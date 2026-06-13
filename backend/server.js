const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Route files
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173', // Vite development
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Production URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && !origin.includes('vercel.app')) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for socket.io during connection
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance in app to make it accessible in routes
app.set('io', io);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
