import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Use all the core routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

