import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import CountdownTimer from './CountdownTimer';

const RandomMatchmaking = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [gameId, setGameId] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');
  
  const { socket } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Listen for opponent found event
    const handleMatchFound = ({ gameId, opponent, countdownSeconds }) => {
      console.log('Match found event received:', { gameId, opponent, countdownSeconds });
      setMatchFound(true);
      setOpponent(opponent);
      setGameId(gameId);
      setCountdown(countdownSeconds);
      setIsSearching(false);
      
      // Join the game room immediately
      socket.emit('join-game', { gameId });
    };

    // Listen for waiting event
    const handleWaiting = ({ queueSize }) => {
      setQueueSize(queueSize);
    };

    // Listen for cancel event
    const handleCancelled = () => {
      setIsSearching(false);
      setQueueSize(0);
    };

    // Listen for error event
    const handleError = ({ message }) => {
      setError(message);
      setIsSearching(false);
    };

    socket.on('random-match-found', handleMatchFound);
    socket.on('waiting-for-opponent', handleWaiting);
    socket.on('find-opponent-cancelled', handleCancelled);
    socket.on('error', handleError);

    return () => {
      socket.off('random-match-found', handleMatchFound);
      socket.off('waiting-for-opponent', handleWaiting);
      socket.off('find-opponent-cancelled', handleCancelled);
      socket.off('error', handleError);
    };
  }, [socket]);

  const handleFindOpponent = () => {
    if (!socket) {
      setError('Connection error. Please try again.');
      return;
    }

    setIsSearching(true);
    setError('');
    socket.emit('find-random-opponent');
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    
    socket.emit('cancel-find-opponent');
    setIsSearching(false);
    setQueueSize(0);
  };

  const handleCountdownComplete = () => {
    console.log(`Countdown complete, navigating to game: ${gameId}`);
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-center">Random Matchmaking</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {matchFound ? (
        <div className="text-center">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Match found! Playing against <span className="font-bold">{opponent}</span>
          </div>
          
          <div className="mb-6">
            <CountdownTimer 
              seconds={countdown} 
              onComplete={handleCountdownComplete} 
            />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-700 mb-6">
            Find a random opponent to play a quick 1-minute math challenge. The system will automatically match you with another player who is also searching.
          </p>
          
          {isSearching ? (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching for opponent...</p>
                {queueSize > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {queueSize} {queueSize === 1 ? 'player' : 'players'} in queue
                  </p>
                )}
              </div>
              
              <button
                onClick={handleCancelSearch}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleFindOpponent}
              className="btn btn-primary w-full"
            >
              Find Random Opponent
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RandomMatchmaking; 