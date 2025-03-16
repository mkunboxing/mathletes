import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RandomMatchmaking from '../components/RandomMatchmaking';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [showRandomMatch, setShowRandomMatch] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Math Game</h1>
        <p className="text-xl text-gray-600">
          Test your math skills against other players in real-time!
        </p>
      </div>

      {isAuthenticated && (
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setShowRandomMatch(false)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${!showRandomMatch ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200' : 'bg-gray-100 text-gray-600'}`}
            >
              Create Custom Game
            </button>
            <button 
              onClick={() => setShowRandomMatch(true)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${showRandomMatch ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200' : 'bg-gray-100 text-gray-600'}`}
            >
              Quick Match
            </button>
          </div>
          
          <div className="bg-white rounded-b-lg rounded-tr-lg shadow-md p-6 border border-gray-200">
            {showRandomMatch ? (
              <RandomMatchmaking />
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-center">Create Custom Game</h2>
                <p className="mb-6 text-gray-700">
                  Create a new game, set the time limit, and challenge your friends to a math duel!
                </p>
                <Link to="/create-game" className="btn btn-primary block text-center">
                  Create New Game
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">How to Play</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Create a new game and set the time limit</li>
            <li>Share the game link with a friend</li>
            <li>Wait for your friend to join</li>
            <li>Start the game when ready</li>
            <li>Solve math problems faster than your opponent</li>
            <li>Each correct answer earns you 1 point</li>
            <li>The player with the most points at the end wins!</li>
          </ol>
        </div>

        <div className="card">
          {isAuthenticated ? (
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
              {user && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-gray-600">Games Played</p>
                    <p className="text-2xl font-bold">{user.gamesPlayed || 0}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-gray-600">Games Won</p>
                    <p className="text-2xl font-bold">{user.gamesWon || 0}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">Join the Fun!</h2>
              <p className="mb-6 text-gray-700">
                Sign up or log in to create games and track your progress.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/login" className="btn btn-primary block text-center">
                  Login
                </Link>
                <Link to="/register" className="btn btn-secondary block text-center">
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home; 