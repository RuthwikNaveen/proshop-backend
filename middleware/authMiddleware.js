import admin from 'firebase-admin';
import { createRequire } from 'module';
import User from '../models/userModel.js';

const require = createRequire(import.meta.url);
const serviceAccount = require('../config/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      // THIS IS THE FIX:
      // We now correctly use 'displayName' from the Firebase token.
      const user = await User.findOneAndUpdate(
        { email: decodedToken.email },
        {
          $setOnInsert: {
            name: decodedToken.displayName || decodedToken.email, // Use displayName, or email as a fallback
            email: decodedToken.email,
            // A password is required by our model, so we give new social login users
            // a random, unusable password.
            password: Math.random().toString(36).slice(-8),
          },
        },
        {
          upsert: true, // This creates a new user if one doesn't exist
          new: true, // This returns the new user after creation
          setDefaultsOnInsert: true,
        }
      ).select('-password');

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

export { protect, adminMiddleware as admin };

