import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateGame = () => {
  const [duration, setDuration] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gameCreated, setGameCreated] = useState(false);
  const [gameId, setGameId] = useState('');
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/games/create', { duration });
      setGameId(response.data.gameId);
      setGameCreated(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const gameLink = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(gameLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setError('Failed to copy to clipboard');
      });
  };

  const goToGame = () => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">Create New Game</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {!gameCreated ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="duration">
                Game Duration
              </label>
              <select
                id="duration"
                className="input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              >
                <option value="1">1 Minute</option>
                <option value="2">2 Minutes</option>
                <option value="5">5 Minutes</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Game'
              )}
            </button>
          </form>
        ) : (
          <div>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              Game created successfully!
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                Share this link with your friend:
              </label>
              <div className="flex">
                <input
                  type="text"
                  className="input rounded-r-none"
                  value={`${window.location.origin}/game/${gameId}`}
                  readOnly
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-200 text-gray-800 px-4 rounded-r-md hover:bg-gray-300 focus:outline-none"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            
            <button
              onClick={goToGame}
              className="btn btn-primary w-full"
            >
              Go to Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGame; 