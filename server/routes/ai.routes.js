import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { aiQueue } from "../queues/aiQueue.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const router = express.Router();

// ── Helper: wraps every aiQueue.add() call so failures are honest, not silent ─
const enqueueOrFail = async (res, addFn) => {
  try {
    return await addFn();
  } catch (err) {
    console.error("❌ Redis/BullMQ unavailable:", err.message);
    res.status(503).json({
      error: "AI processing service is temporarily unavailable. Please try again in a moment.",
      code: "QUEUE_UNAVAILABLE",
    });
    return null; // signals caller to stop
  }
};

router.post("/match", verifyToken, async (req, res) => {
  try {
    const { resumeId, jobId, jobDescription, jobTitle, companyName } = req.body;
    if (!resumeId) return res.status(400).json({ error: "Missing resumeId" });
    if (!jobId && !jobDescription)
      return res.status(400).json({ error: "Missing jobId or jobDescription" });

    const resume = await Resume.findById(resumeId);
    if (!resume || resume.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Forbidden" });

    let finalJobId = jobId;
    if (!jobId && jobDescription) {
      const newJob = new Job({
        title: jobTitle || "Target Role",
        company: companyName || "Target Company",
        description: jobDescription,
        postedBy: req.user._id,
      });
      await newJob.save();
      finalJobId = newJob._id;
    }

    const job = await Job.findById(finalJobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    let application = await Application.findOne({
      userId: req.user._id,
      jobId: finalJobId,
      resumeId,
    });
    if (!application) {
      application = new Application({
        userId: req.user._id,
        jobId: finalJobId,
        resumeId,
        status: "Saved",
      });
      await application.save();
    }

    const jobReq = await enqueueOrFail(res, () =>
      aiQueue.add("compute-match", {
        resumeId,
        jobId: finalJobId,
        userId: req.user._id,
        applicationId: application._id,
      })
    );
    if (!jobReq) return; // 503 already sent

    res.json({
      applicationId: application._id,
      jobStatus: "queued",
      queueJobId: jobReq.id,
    });
  } catch (error) {
    console.error("❌ /match route error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/cover-letter", verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId)
      return res.status(400).json({ error: "Missing applicationId" });

    const application = await Application.findById(applicationId);
    if (
      !application ||
      application.userId.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ error: "Forbidden" });

    const jobReq = await enqueueOrFail(res, () =>
      aiQueue.add("gen-cover-letter", {
        applicationId,
        userId: req.user._id,
      })
    );
    if (!jobReq) return; // 503 already sent

    res.json({ applicationId, jobStatus: "queued", queueJobId: jobReq.id });
  } catch (error) {
    console.error("❌ /cover-letter route error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/interview-prep", verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId)
      return res.status(400).json({ error: "Missing applicationId" });

    const application = await Application.findById(applicationId);
    if (
      !application ||
      application.userId.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ error: "Forbidden" });

    const jobReq = await enqueueOrFail(res, () =>
      aiQueue.add("interview-prep", {
        applicationId,
        userId: req.user._id,
      })
    );
    if (!jobReq) return; // 503 already sent

    res.json({ applicationId, jobStatus: "queued", queueJobId: jobReq.id });
  } catch (error) {
    console.error("❌ /interview-prep route error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/status/:jobId", verifyToken, async (req, res) => {
  try {
    let job = await aiQueue.getJob(req.params.jobId).catch(() => null);

    if (!job) {
      const { resumeQueue } = await import("../queues/resumeQueue.js");
      job = await resumeQueue.getJob(req.params.jobId).catch(() => null);
    }

    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({ state, progress, result, failedReason });
  } catch (error) {
    console.error("❌ /status route error:", error.message);
    res.status(503).json({
      error: "Unable to fetch job status — queue service may be unavailable.",
      code: "QUEUE_UNAVAILABLE",
    });
  }
});

router.post("/analytics", verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({
      userId: req.user._id,
    }).populate("jobId");
    if (applications.length === 0)
      return res.status(400).json({ error: "Not enough data to analyze." });

    const jobReq = await enqueueOrFail(res, () =>
      aiQueue.add("analytics", {
        userId: req.user._id,
        applicationHistory: applications,
      })
    );
    if (!jobReq) return; // 503 already sent

    res.json({ jobStatus: "queued", queueJobId: jobReq.id });
  } catch (error) {
    console.error("❌ /analytics route error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/analytics", verifyToken, async (req, res) => {
  try {
    const { default: AIHistory } = await import("../models/AIHistory.js");
    const analytics = await AIHistory.findOne({
      userId: req.user._id,
      agentType: "analytics",
    }).sort({ createdAt: -1 });
    res.json(analytics ? JSON.parse(analytics.responseSnapshot) : null);
  } catch (error) {
    console.error("❌ GET /analytics route error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
