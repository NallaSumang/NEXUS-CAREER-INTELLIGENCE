import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Worker } from "bullmq";
import axios from "axios";
import redisConnection from "../../config/redis.js";
import Application from "../../models/Application.js";
import Resume from "../../models/Resume.js";
import Job from "../../models/Job.js";
import AIHistory from "../../models/AIHistory.js";
import InterviewNote from "../../models/InterviewNote.js";

const matchWorker = new Worker(
  "ai-jobs",
  async (job) => {
    const start = Date.now();
    const { userId, resumeId, jobId, applicationId } = job.data;
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

    let res;
    let agentType = "";

    try {
      if (job.name === "compute-match") {
        agentType = "match-score";
        const resume = await Resume.findById(resumeId);
        const jobDoc = await Job.findById(jobId);

        if (!resume) {
          job.discard();
          throw new Error(`Resume ${resumeId} not found (discarded)`);
        }
        if (!jobDoc) {
          job.discard();
          throw new Error(`Job ${jobId} not found (discarded)`);
        }

        let currentJobDoc = jobDoc;
        if (
          !currentJobDoc.parsedRequirements ||
          Object.keys(currentJobDoc.parsedRequirements).length === 0
        ) {
          console.log(
            `[Job Parser] Parsing raw job description for Job ${jobId}`,
          );
          const parseRes = await axios.post(
            `${aiServiceUrl}/agents/parse-job`,
            {
              description: currentJobDoc.description,
            },
            { timeout: 60000 },
          );

          currentJobDoc = await Job.findByIdAndUpdate(
            jobId,
            {
              title: parseRes.data.jobTitle || currentJobDoc.title,
              company: parseRes.data.companyName || currentJobDoc.company,
              parsedRequirements: parseRes.data,
            },
            { new: true },
          );

          await AIHistory.create({
            userId,
            agentType: "job-parser",
            promptSnapshot: JSON.stringify({
              description: currentJobDoc.description,
            }),
            responseSnapshot: JSON.stringify(parseRes.data),
            tokensUsed: parseRes.data.tokens || 0,
            durationMs: Date.now() - start,
            success: true,
          });
        }

        res = await axios.post(
          `${aiServiceUrl}/agents/compute-match`,
          {
            resumeJson: resume.parsedJson || {},
            jobRequirements: currentJobDoc.parsedRequirements,
          },
          { timeout: 60000 },
        );

        await Application.findByIdAndUpdate(applicationId, {
          matchScore: res.data.match_score,
          missingSkills: res.data.missing_skills || [],
        });
      } else if (job.name === "gen-cover-letter") {
        agentType = "cover-letter";
        const application = await Application.findById(applicationId)
          .populate("resumeId")
          .populate("jobId");

        if (!application) {
          job.discard();
          throw new Error(`Application ${applicationId} not found (discarded)`);
        }

        const resume = application.resumeId;
        const jobDoc = application.jobId;

        res = await axios.post(
          `${aiServiceUrl}/agents/generate-cover-letter`,
          {
            resumeJson: resume.parsedJson || {},
            jobTitle: jobDoc.title,
            company: jobDoc.company,
            jobDescription: jobDoc.description,
            tone: "professional",
          },
          { timeout: 60000 },
        );

        await Application.findByIdAndUpdate(applicationId, {
          coverLetterText: res.data.cover_letter || "",
        });
      } else if (job.name === "interview-prep") {
        agentType = "interview-coach";
        const application = await Application.findById(applicationId)
          .populate("resumeId")
          .populate("jobId");

        if (!application) {
          job.discard();
          throw new Error(`Application ${applicationId} not found (discarded)`);
        }

        const resume = application.resumeId;
        const jobDoc = application.jobId;

        res = await axios.post(
          `${aiServiceUrl}/agents/generate-interview-prep`,
          {
            resumeJson: resume.parsedJson || {},
            jobTitle: jobDoc.title,
            company: jobDoc.company,
            requiredSkills: jobDoc.parsedRequirements?.requiredSkills || [],
          },
          { timeout: 60000 },
        );

        await InterviewNote.create({
          userId,
          applicationId,
          generatedQuestions: res.data.questions || [],
          userAnswers: [],
        });
      } else if (job.name === "analytics") {
        agentType = "analytics";
        res = await axios.post(
          `${aiServiceUrl}/agents/generate-insights`,
          {
            applicationHistory: job.data.applicationHistory || [],
            aiHistory: job.data.aiHistory || [],
          },
          { timeout: 60000 },
        );
      } else {
        // Unknown job type — discard so BullMQ doesn't retry or mark as completed
        console.warn(`⚠️  Unknown job type: ${job.name} — discarding`);
        await job.discard();
        return;
      }

      await AIHistory.create({
        userId,
        agentType,
        promptSnapshot: JSON.stringify(job.data),
        responseSnapshot: JSON.stringify(res?.data || {}),
        tokensUsed: res?.data?.tokens || 0,
        durationMs: Date.now() - start,
        success: true,
      });

      return res?.data;
    } catch (error) {
      console.error(`❌ Match Worker [${job.name}] Error:`, error.message);

      await AIHistory.create({
        userId,
        agentType: agentType || job.name,
        promptSnapshot: JSON.stringify(job.data),
        responseSnapshot: error.message,
        tokensUsed: 0,
        durationMs: Date.now() - start,
        success: false,
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    // Free-tier (0.1 vCPU / 512MB): concurrency > 1 causes resource starvation.
    // Each job makes a 60s HTTP call to Python + DB writes. Keep at 1.
    concurrency: 1,
  },
);

matchWorker.on("completed", (job) => {
  console.log(`✅ Job [${job.name}] ${job.id} completed`);
});

matchWorker.on("failed", (job, err) => {
  console.error(`❌ Job [${job?.name}] ${job?.id} failed: ${err.message}`);
});

// Graceful shutdown: let the current job finish before the container dies
process.on("SIGTERM", async () => {
  console.log("[matchWorker] SIGTERM — closing worker gracefully...");
  await matchWorker.close();
  console.log("[matchWorker] closed.");
});

export default matchWorker;
