import { Router } from 'express';
import { Session, Vote } from '../models/index.js';
import { authenticateToken, isSessionOwner } from '../middleware/auth.js';

const router = Router();

// Create new session
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, votingScale } = req.body;
    const session = await Session.create({
      name,
      votingScale,
      ownerId: req.user.id
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get session by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id, {
      include: [
        {
          model: Vote,
          where: { story: req.query.story || null },
          required: false
        }
      ]
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update session status
router.patch('/:id/status', authenticateToken, isSessionOwner, async (req, res) => {
  try {
    const { status, currentStory } = req.body;
    const session = await Session.findByPk(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await session.update({ status, currentStory });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit vote
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { value, story } = req.body;
    const session = await Session.findByPk(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const vote = await Vote.create({
      value,
      story,
      SessionId: session.id,
      UserId: req.user.id
    });

    res.status(201).json(vote);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reveal votes
router.post('/:id/reveal', authenticateToken, isSessionOwner, async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await Vote.update(
      { revealed: true },
      { where: { SessionId: session.id, story: session.currentStory } }
    );

    const votes = await Vote.findAll({
      where: { SessionId: session.id, story: session.currentStory }
    });

    res.json(votes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export { router as sessionRoutes };
