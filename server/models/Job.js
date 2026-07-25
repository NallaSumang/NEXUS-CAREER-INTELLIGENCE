import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  parsedRequirements: mongoose.Schema.Types.Mixed,
});

export default mongoose.model("Job", jobSchema);
