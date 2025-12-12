const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Resume = require('../models/Resume');

const JWT_SECRET = process.env.JWT_SECRET || 'Admin123!';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'Unauthorized' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Get all resumes for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create resume
router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = req.body || {};
    data.userId = req.userId;
    const resume = new Resume(data);
    await resume.save();
    res.json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resume by id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await Resume.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    if (r.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    res.json(r);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resume
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await Resume.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    if (r.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    Object.assign(r, req.body);
    r.updatedAt = new Date();
    await r.save();
    res.json(r);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resume
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const r = await Resume.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    if (r.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    await r.remove();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
