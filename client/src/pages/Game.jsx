import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GameWaiting from '../components/GameWaiting';
import GameActive from '../components/GameActive';
import GameResult from '../components/GameResult';

// Configure axios to use the correct base URL
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const Game = () => {
  const { gameId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { 
    joinGame, 
    startGame, 
    currentGame, 
    gameStatus, 
    players, 
    error,
    resetGame
  } = useGame();
  
  const [loading, setLoading] = useState(true);
  const [gameError, setGameError] = useState('');
  const [gameDataFetched, setGameDataFetched] = useState(false);
  
  const navigate = useNavigate();

  // Reset game state on component mount
  useEffect(() => {
    console.log('Game component mounted, resetting game state');
    resetGame();
  }, []);

  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      if (!isAuthenticated || !gameId || gameDataFetched) return;
      
      try {
        console.log('Fetching game data for:', gameId);
        await axios.get(`/api/games/${gameId}`);
        setGameDataFetched(true);
        setLoading(false);
        console.log('Game data fetched successfully for:', gameId);
      } catch (err) {
        console.error('Error fetching game:', err);
        setGameError(err.response?.data?.message || 'Game not found');
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId, isAuthenticated, gameDataFetched]);

  // Join game after data is fetched
  useEffect(() => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (gameDataFetched && !loading && !gameError) {
      console.log('Joining game:', gameId);
      joinGame(gameId);
    }
  }, [gameDataFetched, loading, gameError, isAuthenticated, gameId, navigate]);

  // Handle errors from game context
  useEffect(() => {
    if (error) {
      setGameError(error);
    }
  }, [error]);

  // Log game status changes
  useEffect(() => {
    console.log('Game status changed:', gameStatus);
  }, [gameStatus]);

  // Log current problem changes
  useEffect(() => {
    console.log('Current game updated:', currentGame);
  }, [currentGame]);

  const handleStartGame = () => {
    startGame(gameId);
  };

  const isCreator = currentGame?.createdBy?._id === user?._id;
  const canStart = isCreator && players.length >= 2 && gameStatus === 'waiting';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="card">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {gameError}
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {gameStatus === 'waiting' && (
        <GameWaiting 
          gameId={gameId} 
          players={players} 
          isCreator={isCreator}
          canStart={canStart}
          onStartGame={handleStartGame}
        />
      )}
      
      {gameStatus === 'active' && (
        <GameActive gameId={gameId} />
      )}
      
      {gameStatus === 'completed' && (
        <GameResult 
          players={players} 
          winner={currentGame?.winner} 
          currentUserId={user?._id}
        />
      )}
    </div>
  );
};

export default Game; 