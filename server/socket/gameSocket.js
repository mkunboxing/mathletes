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
        // Join the socket room for this game
        socket.join(gameId);
        
        // If player is not creator, add them to the game
        const game = await Game.findOne({ gameId });
        
        if (game) {
          const isCreator = game.createdBy.toString() === socket.userId;
          const isAlreadyJoined = game.players.some(p => 
            p.userId.toString() === socket.userId);
            
          if (!isAlreadyJoined) {
            await gameService.joinGame(gameId, socket.userId);
          }
          
          // Get the updated game data
          const updatedGame = await Game.findOne({ gameId })
            .populate('players.userId', 'username')
            .populate('createdBy', 'username');
            
          // Notify everyone in the room about the new player
          io.to(gameId).emit('game-update', updatedGame);
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Start the game
    socket.on('start-game', async ({ gameId }) => {
      try {
        await gameService.startGame(gameId, socket.userId);
        
        // Generate the first problem
        const game = await gameService.generateNextProblem(gameId);
        
        // Send game state to all players
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
        socket.emit('error', { message: error.message });
      }
    });
    
    // Submit answer
    socket.on('submit-answer', async ({ gameId, answer }) => {
      try {
        await gameService.submitAnswer(gameId, socket.userId, answer);
        
        // Get the updated game
        const game = await Game.findOne({ gameId });
        
        // Send latest problem and scores to all players
        io.to(gameId).emit('problem-update', {
          problem: game.problems[game.problems.length - 1],
          players: game.players
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
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