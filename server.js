import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import sosRoutes from './src/routes/sosRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
if (process.env.NODE_ENV !== 'production') {
  app.use(cors()); // Allow all origins in development
} else {
  app.use(cors({
    origin: [
      'http://localhost:8081', 
      'http://localhost:3000', 
      'http://localhost:19006', 
      'exp://localhost:19000',
      'http://192.168.1.7:8081',
      'http://192.168.1.7:19006',
      'exp://192.168.1.7:19000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', sosRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'BatterTrack Backend API is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is also accessible at http://192.168.0.33:5000`);
  connectDB();
});
