import mongoose from "mongoose";

const AIHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    agentType: {
      type: String,
      required: true,
    },
    promptSnapshot: {
      type: String,
    },
    responseSnapshot: {
      type: String,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    success: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("AIHistory", AIHistorySchema);
