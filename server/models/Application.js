import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  matchScore: Number,
  missingSkills: [String],
  coverLetterText: String,
  status: { type: String, enum: ['Saved','Applied','Interview','Rejected'], default: 'Saved' }
}, { timestamps: true });

// Explicit indexing for high-frequency queries
applicationSchema.index({ userId: 1, jobId: 1 });

export default mongoose.model('Application', applicationSchema);
