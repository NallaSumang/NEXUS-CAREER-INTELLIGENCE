import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { aiQueue } from "../queues/aiQueue.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const router = express.Router();

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

    let queueJobId = `mock_job_${Date.now()}`;
    try {
      const jobReq = await aiQueue.add("compute-match", {
        resumeId,
        jobId: finalJobId,
        userId: req.user._id,
        applicationId: application._id,
      });
      queueJobId = jobReq.id;
    } catch (e) {
      console.log("Redis down. Mocking compute-match.");
    }

    res.json({
      applicationId: application._id,
      jobStatus: "queued",
      queueJobId,
    });
  } catch (error) {
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

    let queueJobId = `mock_job_${Date.now()}`;
    try {
      const jobReq = await aiQueue.add("gen-cover-letter", {
        applicationId,
        userId: req.user._id,
      });
      queueJobId = jobReq.id;
    } catch (e) {
      console.log("Redis down. Mocking gen-cover-letter.");
    }

    res.json({ applicationId, jobStatus: "queued", queueJobId });
  } catch (error) {
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

    let queueJobId = `mock_job_${Date.now()}`;
    try {
      const jobReq = await aiQueue.add("interview-prep", {
        applicationId,
        userId: req.user._id,
      });
      queueJobId = jobReq.id;
    } catch (e) {
      console.log("Redis down. Mocking interview-prep.");
    }

    res.json({ applicationId, jobStatus: "queued", queueJobId });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/status/:jobId", verifyToken, async (req, res) => {
  try {
    if (req.params.jobId.startsWith("mock_job_")) {
      const elapsed = Date.now() - parseInt(req.params.jobId.split("_")[2]);
      if (elapsed < 4000) {
        return res.json({
          state: "active",
          progress: 50,
          result: null,
          failedReason: null,
        });
      }
      return res.json({
        state: "completed",
        progress: 100,
        result: { mocked: true },
        failedReason: null,
      });
    }

    let job = await aiQueue.getJob(req.params.jobId);
    if (!job) {
      const { resumeQueue } = await import("../queues/resumeQueue.js");
      job = await resumeQueue.getJob(req.params.jobId);
    }
    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({ state, progress, result, failedReason });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/analytics", verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({
      userId: req.user._id,
    }).populate("jobId");
    if (applications.length === 0)
      return res.status(400).json({ error: "Not enough data to analyze." });

    let queueJobId = `mock_job_${Date.now()}`;
    try {
      const jobReq = await aiQueue.add("analytics", {
        userId: req.user._id,
        applicationHistory: applications,
      });
      queueJobId = jobReq.id;
    } catch (e) {
      console.log("Redis down. Mocking analytics.");
    }

    res.json({ jobStatus: "queued", queueJobId });
  } catch (error) {
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
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
