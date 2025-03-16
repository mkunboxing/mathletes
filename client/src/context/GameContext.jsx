import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Backend URL - same as in axios config
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      console.log('Initializing socket connection to:', BACKEND_URL);
      setSocket(newSocket);

      // Handle reconnection
      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt ${attemptNumber}`);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
      });

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

    const onReconnect = () => {
      console.log('Reconnected to socket server');
      
      // If we were in a game before disconnecting, rejoin it
      if (currentGame && currentGame.gameId) {
        console.log(`Reconnected, rejoining game: ${currentGame.gameId}`);
        socket.emit('join-game', { gameId: currentGame.gameId });
      }
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
      console.log('Game started event received:', { problem, endTime });
      setCurrentProblem(problem);
      setGameStatus('active');
      setEndTime(new Date(endTime));
    };

    const onProblemUpdate = ({ problem, players }) => {
      console.log('Problem update event received:', { problem, players });
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
      
      // Don't immediately end the game, just show a message
      // The server will handle ending the game if the player doesn't reconnect
      setError(`${message} - Waiting to see if they reconnect...`);
      
      // If the game is already completed, we can reset the error after a few seconds
      if (gameStatus === 'completed') {
        setTimeout(() => {
          setError(null);
        }, 5000);
      }
    };

    const onError = ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
    };

    // Add event listeners
    socket.on('connect', onConnect);
    socket.on('reconnect', onReconnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game-update', onGameUpdate);
    socket.on('game-started', onGameStarted);
    socket.on('problem-update', onProblemUpdate);
    socket.on('game-ended', onGameEnded);
    socket.on('player-left', onPlayerLeft);
    socket.on('error', onError);

    // Log when joining a socket room
    socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
    });

    // Cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('reconnect', onReconnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game-update', onGameUpdate);
      socket.off('game-started', onGameStarted);
      socket.off('problem-update', onProblemUpdate);
      socket.off('game-ended', onGameEnded);
      socket.off('player-left', onPlayerLeft);
      socket.off('error', onError);
    };
  }, [socket, currentGame]);

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
    
    if (!socket.connected) {
      console.error('Socket not connected');
      // Try to reconnect
      socket.connect();
    }
    
    console.log('Joining game:', gameId);
    socket.emit('join-game', { gameId });
  };

  const startGame = (gameId) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.error('Socket not connected');
      // Try to reconnect
      socket.connect();
    }
    
    console.log('Starting game:', gameId);
    socket.emit('start-game', { gameId });
  };

  const submitAnswer = (gameId, answer) => {
    if (!socket) {
      console.error('Socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.error('Socket not connected');
      // Try to reconnect
      socket.connect();
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
      socket,
      joinGame,
      startGame,
      submitAnswer,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
}; 