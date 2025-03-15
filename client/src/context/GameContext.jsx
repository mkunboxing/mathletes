import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Backend URL - same as in axios config
const BACKEND_URL = 'https://mathletes-backend.onrender.com';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, active, completed
  const [players, setPlayers] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState(null);
  
  // Use a ref to track if socket is already initialized
  const socketInitialized = useRef(false);

  // Initialize socket connection when authenticated
  useEffect(() => {
    // Only create socket if authenticated and not already initialized
    if (isAuthenticated && !socketInitialized.current) {
      socketInitialized.current = true;
      
      const token = localStorage.getItem('token');
      // Use direct backend URL instead of proxy
      const newSocket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      console.log('Initializing socket connection to:', BACKEND_URL);
      setSocket(newSocket);

      return () => {
        if (newSocket) {
          console.log('Disconnecting socket');
          newSocket.disconnect();
          socketInitialized.current = false;
        }
      };
    }
  }, [isAuthenticated]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('Connected to socket server');
    };

    const onDisconnect = (reason) => {
      console.log('Disconnected from socket server:', reason);
    };

    const onGameUpdate = (game) => {
      console.log('Game update received:', game);
      setCurrentGame(game);
      setPlayers(game.players);
      setGameStatus(game.status);
    };

    const onGameStarted = ({ problem, endTime }) => {
      console.log('Game started:', problem, endTime);
      setCurrentProblem(problem);
      setGameStatus('active');
      setEndTime(new Date(endTime));
    };

    const onProblemUpdate = ({ problem, players }) => {
      console.log('Problem update:', problem);
      setCurrentProblem(problem);
      setPlayers(players);
    };

    const onGameEnded = (game) => {
      console.log('Game ended:', game);
      setCurrentGame(game);
      setGameStatus('completed');
      setCurrentProblem(null);
    };

    const onPlayerLeft = ({ userId, message }) => {
      console.log('Player left:', userId, message);
      setError(message);
    };

    const onError = ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
    };

    // Add event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-update', onGameUpdate);
    socket.on('game-started', onGameStarted);
    socket.on('problem-update', onProblemUpdate);
    socket.on('game-ended', onGameEnded);
    socket.on('player-left', onPlayerLeft);
    socket.on('error', onError);

    // Cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-update', onGameUpdate);
      socket.off('game-started', onGameStarted);
      socket.off('problem-update', onProblemUpdate);
      socket.off('game-ended', onGameEnded);
      socket.off('player-left', onPlayerLeft);
      socket.off('error', onError);
    };
  }, [socket]);

  // Timer for countdown
  useEffect(() => {
    if (!endTime || gameStatus !== 'active') return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, gameStatus]);

  const joinGame = (gameId) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Joining game:', gameId);
    socket.emit('join-game', { gameId });
  };

  const startGame = (gameId) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Starting game:', gameId);
    socket.emit('start-game', { gameId });
  };

  const submitAnswer = (gameId, answer) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Submitting answer:', gameId, answer);
    socket.emit('submit-answer', { gameId, answer });
  };

  const resetGame = () => {
    console.log('Resetting game state');
    setCurrentGame(null);
    setCurrentProblem(null);
    setGameStatus('waiting');
    setPlayers([]);
    setEndTime(null);
    setTimeRemaining(0);
    setError(null);
  };

  return (
    <GameContext.Provider value={{
      currentGame,
      currentProblem,
      gameStatus,
      players,
      timeRemaining,
      error,
      joinGame,
      startGame,
      submitAnswer,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
}; 