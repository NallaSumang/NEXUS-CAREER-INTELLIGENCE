import mongoose from "mongoose";

const InterviewNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: false,
    },
    generatedQuestions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    userAnswers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("InterviewNote", InterviewNoteSchema);
