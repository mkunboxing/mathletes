import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

const GameActive = ({ gameId }) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { 
    currentProblem, 
    players, 
    timeRemaining,
    submitAnswer
  } = useGame();

  // Debug: Log when currentProblem changes
  useEffect(() => {
    console.log('GameActive - currentProblem changed:', currentProblem);
  }, [currentProblem]);

  // Add a retry mechanism to fetch the problem if it's not available
  useEffect(() => {
    if (!currentProblem && gameId) {
      console.log('GameActive - No problem available, checking game status');
      
      // If we've been waiting for more than 5 seconds, try to rejoin the game
      const timer = setTimeout(() => {
        if (!currentProblem) {
          console.log('GameActive - Still no problem after timeout, trying to refresh game state');
          // This will trigger the socket to emit a game-update event
          submitAnswer(gameId, '0'); // Send a dummy answer to trigger a refresh
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [currentProblem, gameId, submitAnswer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Please enter an answer');
      return;
    }
    
    if (isNaN(parseInt(answer))) {
      setError('Please enter a valid number');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      submitAnswer(gameId, answer);
      setAnswer('');
    } catch (err) {
      setError('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get operation symbol
  const getOperationSymbol = (type) => {
    switch (type) {
      case 'addition': return '+';
      case 'subtraction': return '-';
      case 'multiplication': return '×';
      case 'division': return '÷';
      default: return '';
    }
  };

  // Check if player has already answered current problem
  const hasAnswered = () => {
    if (!currentProblem || !currentProblem.responses || !user) return false;
    
    return currentProblem.responses.some(
      response => response.userId === user._id
    );
  };

  if (!currentProblem) {
    console.log('GameActive - No current problem available');
    return (
      <div className="card text-center">
        <h2 className="text-2xl font-bold mb-4">Loading problem...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-semibold">
          Time Remaining: <span className="text-blue-600">{formatTime(timeRemaining)}</span>
        </div>
        
        <div className="flex space-x-4">
          {players.map((player, index) => (
            <div key={index} className="bg-gray-100 rounded-md px-4 py-2">
              <span className="font-medium">{player.username}: </span>
              <span className="text-blue-600 font-bold">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Solve the Problem</h2>
        
        <div className="text-center mb-8">
          <div className="text-4xl font-bold mb-4">
            {currentProblem.operand1} {getOperationSymbol(currentProblem.type)} {currentProblem.operand2} = ?
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {hasAnswered() ? (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-center">
            Answer submitted! Waiting for other player...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="answer">
                Your Answer
              </label>
              <input
                type="number"
                id="answer"
                className="input text-center text-2xl"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer"
                disabled={submitting}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={submitting || hasAnswered()}
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GameActive; 