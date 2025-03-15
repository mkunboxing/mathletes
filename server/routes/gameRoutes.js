// server/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, gameController.createGame);
router.get('/:gameId', authMiddleware, gameController.getGame);
router.get('/', authMiddleware, gameController.getUserGames);

module.exports = router;
