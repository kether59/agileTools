import { Router } from 'express';
import { User } from '../models/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.create({ username, email, password });
    const token = generateToken(user);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email']
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as userRoutes };
