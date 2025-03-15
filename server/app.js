// server/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const initializeSocket = require('./socket/gameSocket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize socket.io
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes

app.get('/', (req, res) => {
  return res.status(200).json({ message: 'Hello Quiz' });
});
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = { app, server };