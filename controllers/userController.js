import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const authUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      shippingAddress: user.shippingAddress,
      token: token,
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      shippingAddress: user.shippingAddress,
      token: token,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      shippingAddress: user.shippingAddress,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400).json({ message: 'Cannot delete an admin user' });
      return;
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export {
  authUser,
  registerUser,
  getUserProfile,
  getUsers,
  deleteUser,
};

