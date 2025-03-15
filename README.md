# Multiplayer Math Game

A real-time multiplayer math game where players compete to solve math problems.

## Features

- User authentication (register, login)
- Create game rooms with customizable time limits
- Share game links with friends
- Real-time gameplay with Socket.io
- Score tracking and game results
- Responsive design with Tailwind CSS

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB
- Socket.io
- JWT Authentication

### Frontend
- React
- React Router
- Axios
- Socket.io Client
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository
```
git clone <repository-url>
cd math-game
```

2. Install dependencies
```
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mathgame
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

4. Start the development servers
```
# Start the server
cd server
npm run dev

# Start the client
cd ../client
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Register or log in to your account
2. Create a new game and set the time limit
3. Share the game link with a friend
4. Wait for your friend to join
5. Start the game when ready
6. Solve math problems faster than your opponent
7. Each correct answer earns you 1 point
8. The player with the most points at the end wins!

## License

This project is licensed under the MIT License. 