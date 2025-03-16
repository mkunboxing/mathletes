// server/socket/gameSocket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const gameService = require('../services/gameService');
const Game = require('../models/Game');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });
  
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join a game room
    socket.on('join-game', async ({ gameId }) => {
      try {
        console.log(`User ${socket.userId} joining game: ${gameId}`);
        
        // Join the socket room for this game
        socket.join(gameId);
        console.log(`User ${socket.userId} joined socket room for game: ${gameId}`);
        
        // If player is not creator, add them to the game
        const game = await Game.findOne({ gameId });
        
        if (game) {
          const isCreator = game.createdBy.toString() === socket.userId;
          const isAlreadyJoined = game.players.some(p => 
            p.userId.toString() === socket.userId);
            
          console.log(`Game ${gameId} - User is creator: ${isCreator}, already joined: ${isAlreadyJoined}`);
            
          if (!isAlreadyJoined) {
            await gameService.joinGame(gameId, socket.userId);
            console.log(`User ${socket.userId} added to game ${gameId} in database`);
          }
          
          // Get the updated game data
          const updatedGame = await Game.findOne({ gameId })
            .populate('players.userId', 'username')
            .populate('createdBy', 'username');
            
          // Notify everyone in the room about the new player
          console.log(`Emitting game-update event for game: ${gameId}`);
          io.to(gameId).emit('game-update', updatedGame);
          
          // Send confirmation to the client that they joined the room
          socket.emit('joined-room', { gameId });
          
          // If the game is already active, send the current problem to the player
          if (game.status === 'active') {
            console.log(`Game ${gameId} is already active, sending current problem to player ${socket.userId}`);
            
            // Get the current problem (last one in the array)
            const currentProblem = game.problems[game.problems.length - 1];
            
            // Send game state to the player
            socket.emit('game-started', {
              problem: currentProblem,
              endTime: game.endedAt
            });
          }
        }
      } catch (error) {
        console.error(`Error joining game ${gameId}:`, error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Start the game
    socket.on('start-game', async ({ gameId }) => {
      try {
        console.log(`Starting game: ${gameId} by user: ${socket.userId}`);
        await gameService.startGame(gameId, socket.userId);
        
        // Generate the first problem
        console.log(`Generating first problem for game: ${gameId}`);
        const game = await gameService.generateNextProblem(gameId);
        
        // Log the problem being sent
        console.log(`First problem generated for game ${gameId}:`, 
          game.problems[game.problems.length - 1]);
        
        // Send game state to all players
        console.log(`Emitting game-started event for game: ${gameId}`);
        io.to(gameId).emit('game-started', {
          problem: game.problems[game.problems.length - 1],
          endTime: game.endedAt
        });
        
        // Set up timer for game end
        const timeRemaining = game.endedAt - new Date();
        setTimeout(async () => {
          const endedGame = await gameService.endGame(gameId);
          io.to(gameId).emit('game-ended', endedGame);
        }, timeRemaining);
      } catch (error) {
        console.error(`Error starting game ${gameId}:`, error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Submit answer
    socket.on('submit-answer', async ({ gameId, answer }) => {
      try {
        console.log(`User ${socket.userId} submitted answer ${answer} for game ${gameId}`);
        await gameService.submitAnswer(gameId, socket.userId, answer);
        
        // Get the updated game
        const game = await Game.findOne({ gameId });
        
        // Log the current problem
        console.log(`Current problem for game ${gameId}:`, 
          game.problems[game.problems.length - 1]);
        
        // Send latest problem and scores to all players
        console.log(`Emitting problem-update event for game: ${gameId}`);
        io.to(gameId).emit('problem-update', {
          problem: game.problems[game.problems.length - 1],
          players: game.players
        });
      } catch (error) {
        console.error(`Error submitting answer for game ${gameId}:`, error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // Find random opponent
    socket.on('find-random-opponent', async () => {
      try {
        // Add user to waiting queue
        const matchResult = gameService.addToWaitingQueue(socket.userId, socket.id, socket.username);
        
        // If we have a match, create a game and notify both players
        if (matchResult) {
          const { player1, player2 } = matchResult;
          
          // Create a new game for the matched players
          const game = await gameService.createRandomGame(player1, player2);
          
          // Notify both players about the match
          io.to(player1.socketId).emit('random-match-found', {
            gameId: game.gameId,
            opponent: player2.username,
            countdownSeconds: 3
          });
          
          io.to(player2.socketId).emit('random-match-found', {
            gameId: game.gameId,
            opponent: player1.username,
            countdownSeconds: 3
          });
          
          // Start the game automatically after 3 seconds
          setTimeout(async () => {
            try {
              // Start the game
              console.log(`Starting random match game: ${game.gameId}`);
              await gameService.startGame(game.gameId, player1.userId);
              
              // Generate the first problem
              console.log(`Generating first problem for game: ${game.gameId}`);
              const startedGame = await gameService.generateNextProblem(game.gameId);
              
              // Log the problem being sent
              console.log(`First problem generated for game ${game.gameId}:`, 
                startedGame.problems[startedGame.problems.length - 1]);
              
              // Send game state to all players
              console.log(`Emitting game-started event for game: ${game.gameId}`);
              io.to(game.gameId).emit('game-started', {
                problem: startedGame.problems[startedGame.problems.length - 1],
                endTime: startedGame.endedAt
              });
              
              // Set up timer for game end
              const timeRemaining = startedGame.endedAt - new Date();
              setTimeout(async () => {
                const endedGame = await gameService.endGame(game.gameId);
                io.to(game.gameId).emit('game-ended', endedGame);
              }, timeRemaining);
            } catch (error) {
              console.error(`Error starting random match game ${game.gameId}:`, error);
              io.to(game.gameId).emit('error', { message: error.message });
            }
          }, 3000); // 3 seconds countdown
        } else {
          // No match yet, notify the user they're in queue
          socket.emit('waiting-for-opponent', {
            queueSize: gameService.getWaitingQueueSize()
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Cancel finding random opponent
    socket.on('cancel-find-opponent', () => {
      gameService.removeFromWaitingQueue(socket.userId);
      socket.emit('find-opponent-cancelled');
    });
    
    // Handle disconnections
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove from waiting queue if they were searching
      gameService.removeFromWaitingQueue(socket.userId);
      
      // Find any active games where this user is a player
      const activeGames = await Game.find({
        'players.userId': socket.userId,
        status: 'active'
      });
      
      // End any active games if a player leaves
      for (const game of activeGames) {
        await gameService.endGame(game.gameId);
        io.to(game.gameId).emit('player-left', {
          userId: socket.userId,
          message: 'Opponent has left the game'
        });
      }
    });
  });
  
  return io;
}

module.exports = initializeSocket;