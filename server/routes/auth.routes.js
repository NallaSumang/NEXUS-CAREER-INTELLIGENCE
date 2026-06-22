import express from 'express';
// Dynamically import firebase to prevent early Mongoose SSL corruption
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/sync', async (req, res) => {
  const header = req.headers.authorization || '';
  
  if (!header.startsWith('Bearer ')) {
    try {
      let user = await User.findOne({ email: 'test@placeiq.com' });
      if (!user) {
        user = new User({ firebaseUid: 'dev_mock_uid', email: 'test@placeiq.com', name: 'Test User' });
        await user.save();
      }
      return res.json({ user });
    } catch (error) {
      return res.status(500).json({ error: 'Mock sync failed' });
    }
  }

  try {
    const admin = (await import('../config/firebase.js')).default;
    const decoded = await admin.auth().verifyIdToken(header.split(' ')[1]);
    const { uid, email, name } = decoded;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = new User({ firebaseUid: uid, email, name });
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const Resume = (await import('../models/Resume.js')).default;

    const resumes = await Resume.countDocuments({ userId: req.user._id });

    res.json({
      ...req.user.toObject(),
      summary: { resumes }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { college, branch, graduationYear, name } = req.body;
    req.user.college = college || req.user.college;
    req.user.branch = branch || req.user.branch;
    req.user.graduationYear = graduationYear || req.user.graduationYear;
    req.user.name = name || req.user.name;
    
    if (college && branch && graduationYear) {
      req.user.profileComplete = true;
    }
    
    await req.user.save();
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
