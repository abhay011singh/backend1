import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Auth middleware: No valid authorization header');
      return res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.error('❌ Auth middleware: Token is missing after split');
      return res.status(401).json({ success: false, message: 'Token missing' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.error('❌ Auth middleware: No user found for decoded token');
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      req.user = user;
      console.info('✅ Auth middleware: User authenticated');
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.error('⏳ Auth middleware: JWT expired');
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      console.error('❌ Auth middleware: JWT verification failed:', jwtError.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

  } catch (error) {
    console.error('❌ Auth middleware: Unexpected error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
};


export default authMiddleware;
