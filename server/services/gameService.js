// server/services/gameService.js
const { v4: uuidv4 } = require('uuid');
const Game = require('../models/Game');
const User = require('../models/User');
const mathService = require('./mathService');

// Queue for players waiting for random matches
const waitingQueue = [];

class GameService {
  async createGame(userId, duration) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      // Create game with unique ID
      const gameId = uuidv4().substring(0, 8);
      
      const game = new Game({
        gameId,
        createdBy: userId,
        duration: parseInt(duration) * 60, // Convert minutes to seconds
        players: [{
          userId,
          username: user.username,
          score: 0
        }]
      });
      
      await game.save();
      return game;
    } catch (error) {
      throw error;
    }
  }
  
  async joinGame(gameId, userId) {
    try {
      const game = await Game.findOne({ gameId });
      if (!game) throw new Error('Game not found');
      
      if (game.status !== 'waiting') throw new Error('Game already started or completed');
      
      if (game.players.length >= 2) throw new Error('Game is full');
      
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      // Add player to game
      game.players.push({
        userId,
        username: user.username,
        score: 0
      });
      
      await game.save();
      return game;
    } catch (error) {
      throw error;
    }
  }
  
  async startGame(gameId, userId) {
    try {
      console.log(`Starting game ${gameId} by user ${userId}`);
      
      const game = await Game.findOne({ gameId });
      if (!game) {
        console.error(`Game not found: ${gameId}`);
        throw new Error('Game not found');
      }
      
      // Only creator can start the game
      if (game.createdBy.toString() !== userId.toString()) {
        console.error(`User ${userId} is not the creator of game ${gameId}`);
        throw new Error('Only the game creator can start the game');
      }
      
      if (game.players.length < 2) {
        console.error(`Game ${gameId} needs two players to start`);
        throw new Error('Need two players to start');
      }
      
      game.status = 'active';
      game.startedAt = new Date();
      game.endedAt = new Date(game.startedAt.getTime() + (game.duration * 1000));
      
      console.log(`Game ${gameId} started at ${game.startedAt}, will end at ${game.endedAt}`);
      
      await game.save();
      console.log(`Game ${gameId} saved with active status`);
      
      return game;
    } catch (error) {
      console.error(`Error in startGame for game ${gameId}:`, error);
      throw error;
    }
  }
  
  async submitAnswer(gameId, userId, answer) {
    try {
      console.log(`Processing answer submission for game ${gameId} from user ${userId}: ${answer}`);
      
      const game = await Game.findOne({ gameId, status: 'active' });
      if (!game) {
        console.error(`Active game not found: ${gameId}`);
        throw new Error('Active game not found');
      }
      
      // Get the current problem (last one in the array)
      const currentProblem = game.problems[game.problems.length - 1];
      if (!currentProblem) {
        console.error(`No active problem for game: ${gameId}`);
        throw new Error('No active problem');
      }
      
      // Check if player already answered this problem
      const alreadyAnswered = currentProblem.responses.some(r => 
        r.userId.toString() === userId.toString());
      
      if (alreadyAnswered) {
        console.log(`User ${userId} already answered problem for game ${gameId}`);
        throw new Error('Already answered this problem');
      }
      
      // Check answer
      const isCorrect = parseInt(answer) === currentProblem.answer;
      console.log(`Answer is ${isCorrect ? 'correct' : 'incorrect'}`);
      
      // Record response
      currentProblem.responses.push({
        userId,
        answer: parseInt(answer),
        correct: isCorrect,
        responseTime: new Date() - game.startedAt
      });
      
      // Update player score if correct
      if (isCorrect) {
        const playerIndex = game.players.findIndex(p => 
          p.userId.toString() === userId.toString());
          
        if (playerIndex !== -1) {
          game.players[playerIndex].score += 1;
          console.log(`Updated score for user ${userId} to ${game.players[playerIndex].score}`);
        }
      }
      
      await game.save();
      
      // Check if both players answered
      if (currentProblem.responses.length >= 2) {
        console.log(`Both players answered for game ${gameId}, generating next problem`);
        // Generate new problem
        return this.generateNextProblem(gameId);
      }
      
      return game;
    } catch (error) {
      console.error(`Error in submitAnswer for game ${gameId}:`, error);
      throw error;
    }
  }
  
  async generateNextProblem(gameId) {
    try {
      console.log(`Generating next problem for game: ${gameId}`);
      
      const game = await Game.findOne({ gameId, status: 'active' });
      if (!game) {
        console.error(`Active game not found: ${gameId}`);
        throw new Error('Active game not found');
      }
      
      // Check if game should end
      const now = new Date();
      if (now >= game.endedAt) {
        console.log(`Game ${gameId} has ended, ending game`);
        return this.endGame(gameId);
      }
      
      // Generate new problem
      const problem = mathService.generateProblem();
      console.log(`Generated problem for game ${gameId}:`, problem);
      
      game.problems.push(problem);
      
      await game.save();
      console.log(`Saved game ${gameId} with new problem`);
      
      return game;
    } catch (error) {
      console.error(`Error in generateNextProblem for game ${gameId}:`, error);
      throw error;
    }
  }
  
  async endGame(gameId) {
    try {
      const game = await Game.findOne({ gameId, status: 'active' });
      if (!game) throw new Error('Active game not found');
      
      game.status = 'completed';
      
      // Determine winner
      let winnerIndex = 0;
      let highestScore = game.players[0].score;
      
      for (let i = 1; i < game.players.length; i++) {
        if (game.players[i].score > highestScore) {
          highestScore = game.players[i].score;
          winnerIndex = i;
        }
      }
      
      // Set winner if there's a clear winner (not a tie)
      if (game.players.filter(p => p.score === highestScore).length === 1) {
        game.winner = game.players[winnerIndex].userId;
        
        // Update user stats
        await User.findByIdAndUpdate(game.winner, { 
          $inc: { gamesPlayed: 1, gamesWon: 1 } 
        });
        
        // Update other player stats
        const loserId = game.players.find(p => 
          p.userId.toString() !== game.winner.toString()).userId;
          
        await User.findByIdAndUpdate(loserId, { 
          $inc: { gamesPlayed: 1 } 
        });
      } else {
        // It's a tie, update both players
        for (const player of game.players) {
          await User.findByIdAndUpdate(player.userId, { 
            $inc: { gamesPlayed: 1 } 
          });
        }
      }
      
      await game.save();
      return game;
    } catch (error) {
      throw error;
    }
  }

  // New methods for random player matching

  addToWaitingQueue(userId, socketId, username) {
    // Remove user from queue if already in it
    this.removeFromWaitingQueue(userId);
    
    // Add user to waiting queue
    waitingQueue.push({
      userId,
      socketId,
      username,
      joinedAt: new Date()
    });
    
    console.log(`Added user ${userId} to waiting queue. Queue size: ${waitingQueue.length}`);
    
    // Try to match players
    return this.matchPlayers();
  }
  
  removeFromWaitingQueue(userId) {
    const index = waitingQueue.findIndex(player => player.userId.toString() === userId.toString());
    if (index !== -1) {
      waitingQueue.splice(index, 1);
      console.log(`Removed user ${userId} from waiting queue. Queue size: ${waitingQueue.length}`);
    }
  }
  
  matchPlayers() {
    // Need at least 2 players to match
    if (waitingQueue.length < 2) {
      return null;
    }
    
    // Get the two players who have been waiting the longest
    const player1 = waitingQueue.shift();
    const player2 = waitingQueue.shift();
    
    console.log(`Matching players: ${player1.userId} and ${player2.userId}`);
    
    // Return the matched players
    return {
      player1,
      player2
    };
  }
  
  async createRandomGame(player1, player2) {
    try {
      // Create game with unique ID
      const gameId = uuidv4().substring(0, 8);
      
      // Fixed 1-minute duration for random matches
      const duration = 60; // 1 minute in seconds
      
      const game = new Game({
        gameId,
        createdBy: player1.userId,
        duration,
        isRandomMatch: true,
        players: [
          {
            userId: player1.userId,
            username: player1.username,
            score: 0
          },
          {
            userId: player2.userId,
            username: player2.username,
            score: 0
          }
        ]
      });
      
      await game.save();
      return game;
    } catch (error) {
      throw error;
    }
  }
  
  getWaitingQueueSize() {
    return waitingQueue.length;
  }
}

module.exports = new GameService();