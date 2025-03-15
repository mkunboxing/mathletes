import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">Math Game</Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden focus:outline-none" 
            onClick={toggleMenu}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="hover:text-blue-200">Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/create-game" className="hover:text-blue-200">Create Game</Link>
                <div className="relative group">
                  <button className="flex items-center hover:text-blue-200">
                    {user?.username}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">Login</Link>
                <Link to="/register" className="hover:text-blue-200">Register</Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-500">
            <Link to="/" className="block py-2 hover:text-blue-200" onClick={toggleMenu}>Home</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/create-game" className="block py-2 hover:text-blue-200" onClick={toggleMenu}>Create Game</Link>
                <div className="py-2">
                  <span className="block py-2">{user?.username}</span>
                  <button 
                    onClick={() => {
                      logout();
                      toggleMenu();
                    }}
                    className="block py-2 text-blue-200 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 hover:text-blue-200" onClick={toggleMenu}>Login</Link>
                <Link to="/register" className="block py-2 hover:text-blue-200" onClick={toggleMenu}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 