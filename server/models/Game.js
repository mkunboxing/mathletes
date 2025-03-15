// server/models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    score: {
      type: Number,
      default: 0
    }
  }],
  duration: {
    type: Number,
    required: true,
    enum: [60, 120, 300] // 1min, 2min, 5min in seconds
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  problems: [{
    type: {
      type: String,
      enum: ['addition', 'subtraction', 'multiplication', 'division']
    },
    operand1: Number,
    operand2: Number,
    answer: Number,
    responses: [{
      userId: mongoose.Schema.Types.ObjectId,
      answer: Number,
      correct: Boolean,
      responseTime: Number
    }]
  }],
  startedAt: Date,
  endedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', GameSchema);