import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete && onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  return (
    <div className="text-center">
      <div className="text-6xl font-bold mb-4">{timeLeft}</div>
      <p className="text-gray-600">Game starting soon...</p>
    </div>
  );
};

export default CountdownTimer; 