// server/controllers/gameController.js
const Game = require('../models/Game');
const gameService = require('../services/gameService');

exports.createGame = async (req, res) => {
  try {
    const { duration } = req.body;
    
    // Validate duration
    if (![1, 2, 5].includes(parseInt(duration))) {
      return res.status(400).json({ message: 'Invalid duration' });
    }
    
    const game = await gameService.createGame(req.userId, duration);
    
    res.status(201).json({
      gameId: game.gameId,
      duration: game.duration
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId })
      .populate('players.userId', 'username')
      .populate('createdBy', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserGames = async (req, res) => {
  try {
    const games = await Game.find({ 
      'players.userId': req.userId 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('players.userId', 'username')
      .populate('createdBy', 'username')
      .populate('winner', 'username');
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};