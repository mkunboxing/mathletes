import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="max-w-md mx-auto mt-10 text-center">
      <div className="card">
        <h2 className="text-3xl font-bold mb-4">404</h2>
        <p className="text-xl mb-6">Page Not Found</p>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary inline-block">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 