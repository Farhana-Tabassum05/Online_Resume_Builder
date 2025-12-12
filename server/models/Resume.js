const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: String,
  role: String,
  email: String,
  phone: String,
  address: String,
  degree: String,
  school: String,
  eduYears: String,
  experience: { type: Array, default: [] },
  projects: { type: Array, default: [] },
  skills: String,
  summary: String,
  profilePhotoData: String,
  templateId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);
