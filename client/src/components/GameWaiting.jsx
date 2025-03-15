import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameWaiting = ({ gameId, players, isCreator, canStart, onStartGame }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const copyToClipboard = () => {
    const gameLink = `${window.location.origin}/game/${gameId}`;
    navigator.clipboard.writeText(gameLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        console.error('Failed to copy to clipboard');
      });
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-center">Waiting for Players</h2>
      
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
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Players ({players.length}/2)</h3>
        <div className="bg-gray-100 rounded-md p-4">
          {players.length > 0 ? (
            <ul className="space-y-2">
              {players.map((player, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  <span>{player.username || 'Unknown Player'}</span>
                  {isCreator && player.userId === players[0]?.userId && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Creator
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No players have joined yet</p>
          )}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary flex-1"
        >
          Cancel
        </button>
        
        {isCreator && (
          <button
            onClick={onStartGame}
            className="btn btn-primary flex-1"
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : 'Waiting for Players...'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GameWaiting; 