import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFilename: String,
  gridFsId: mongoose.Schema.Types.ObjectId,
  parsedJson: mongoose.Schema.Types.Mixed,
  parseStatus: { type: String, enum: ['pending','processing','done','failed'], default: 'pending' },
  uploadedAt: { type: Date, default: Date.now }
});

// Explicit indexing for high-frequency queries
resumeSchema.index({ userId: 1, uploadedAt: -1 });

export default mongoose.model('Resume', resumeSchema);
