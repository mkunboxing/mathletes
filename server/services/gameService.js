// server/services/gameService.js
const { v4: uuidv4 } = require('uuid');
const Game = require('../models/Game');
const User = require('../models/User');
const mathService = require('./mathService');

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
      const game = await Game.findOne({ gameId });
      if (!game) throw new Error('Game not found');
      
      // Only creator can start the game
      if (game.createdBy.toString() !== userId.toString()) {
        throw new Error('Only the game creator can start the game');
      }
      
      if (game.players.length < 2) throw new Error('Need two players to start');
      
      game.status = 'active';
      game.startedAt = new Date();
      game.endedAt = new Date(game.startedAt.getTime() + (game.duration * 1000));
      
      await game.save();
      return game;
    } catch (error) {
      throw error;
    }
  }
  
  async submitAnswer(gameId, userId, answer) {
    try {
      const game = await Game.findOne({ gameId, status: 'active' });
      if (!game) throw new Error('Active game not found');
      
      // Get the current problem (last one in the array)
      const currentProblem = game.problems[game.problems.length - 1];
      if (!currentProblem) throw new Error('No active problem');
      
      // Check if player already answered this problem
      const alreadyAnswered = currentProblem.responses.some(r => 
        r.userId.toString() === userId.toString());
      
      if (alreadyAnswered) throw new Error('Already answered this problem');
      
      // Check answer
      const isCorrect = parseInt(answer) === currentProblem.answer;
      
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
        }
      }
      
      await game.save();
      
      // Check if both players answered
      if (currentProblem.responses.length >= 2) {
        // Generate new problem
        return this.generateNextProblem(gameId);
      }
      
      return game;
    } catch (error) {
      throw error;
    }
  }
  
  async generateNextProblem(gameId) {
    try {
      const game = await Game.findOne({ gameId, status: 'active' });
      if (!game) throw new Error('Active game not found');
      
      // Check if game should end
      const now = new Date();
      if (now >= game.endedAt) {
        return this.endGame(gameId);
      }
      
      // Generate new problem
      const problem = mathService.generateProblem();
      game.problems.push(problem);
      
      await game.save();
      return game;
    } catch (error) {
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
}

module.exports = new GameService();