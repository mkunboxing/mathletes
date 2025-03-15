import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameResult = ({ players, winner, currentUserId }) => {
  const navigate = useNavigate();
  
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  // Check if it's a tie
  const isTie = sortedPlayers.length > 1 && 
    sortedPlayers[0].score === sortedPlayers[1].score;
  
  // Check if current user won
  const userWon = winner === currentUserId;
  
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-center">Game Over</h2>
      
      {isTie ? (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6 text-center">
          <p className="text-xl font-bold">It's a tie!</p>
        </div>
      ) : (
        <div className={`${userWon ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-6 text-center`}>
          <p className="text-xl font-bold">
            {userWon ? 'You won!' : 'You lost!'}
          </p>
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Final Scores</h3>
        <div className="space-y-4">
          {sortedPlayers.map((player, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center p-4 rounded-md ${player.userId === winner ? 'bg-yellow-100' : 'bg-gray-100'}`}
            >
              <div className="flex items-center">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                  {index + 1}
                </span>
                <span className="font-medium">{player.username}</span>
                {player.userId === currentUserId && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
              <span className="text-2xl font-bold">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary flex-1"
        >
          Back to Home
        </button>
        <button
          onClick={() => navigate('/create-game')}
          className="btn btn-primary flex-1"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameResult; 