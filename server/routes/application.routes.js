import express from "express";
import { verifyToken } from "../middleware/auth.js";
import Application from "../models/Application.js";
import InterviewNote from "../models/InterviewNote.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate("jobId")
      .populate("resumeId")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/interview", verifyToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (
      !application ||
      application.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const note = await InterviewNote.findOne({
      applicationId: req.params.id,
    }).sort({ createdAt: -1 });
    res.json(note || { questions: [] });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
