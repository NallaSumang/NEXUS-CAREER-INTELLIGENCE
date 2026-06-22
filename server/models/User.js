import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: String,
  email: String,
  college: String,
  profileComplete: { type: Boolean, default: false }
});

export default mongoose.model('User', userSchema);
