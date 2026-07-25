import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Worker } from "bullmq";
import axios from "axios";
import mongoose from "mongoose";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import redisConnection from "../../config/redis.js";
import Resume from "../../models/Resume.js";
import AIHistory from "../../models/AIHistory.js";

const resumeWorker = new Worker(
  "resume-processing",
  async (job) => {
    if (job.name !== "parse-resume") return;

    const { resumeId, userId } = job.data;
    const start = Date.now();

    try {
      const resume = await Resume.findById(resumeId);
      if (!resume) throw new Error("Resume not found");

      await Resume.findByIdAndUpdate(resumeId, { parseStatus: "processing" });

      // 1. Download binary PDF data from GridFS into memory buffer
      const db = mongoose.connection.db;
      const bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: "resumes",
      });
      const chunks = [];

      // Explicitly import mongoose to get the ObjectId class
      const downloadStream = bucket.openDownloadStream(
        new mongoose.Types.ObjectId(resume.gridFsId),
      );

      const buffer = await new Promise((resolve, reject) => {
        downloadStream.on("data", (chunk) => chunks.push(chunk));
        downloadStream.on("error", (err) => reject(err));
        downloadStream.on("end", () => resolve(Buffer.concat(chunks)));
      });

      // 2. Extract raw text from PDF
      const parsedPdf = await pdfParse(buffer);
      const rawText = parsedPdf.text;

      if (!rawText || rawText.trim().length === 0) {
        throw new Error("PDF parsing resulted in empty text content.");
      }

      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";

      // 3. Send raw text to Python AI Service
      console.log(
        `[Worker] Text extracted. Forwarding to Python AI Microservice...`,
      );
      const res = await axios.post(
        `${aiServiceUrl}/agents/parse-resume`,
        {
          text: rawText,
          metadata: { filename: resume.originalFilename, profileId: resumeId },
        },
        { timeout: 60000 },
      );

      const structuredAnalysis = res.data;

      // 4. Update Resume with AI payload
      await Resume.findByIdAndUpdate(resumeId, {
        parsedJson: structuredAnalysis,
        parseStatus: "done",
      });

      await AIHistory.create({
        userId,
        agentType: "resume-parser",
        promptSnapshot: rawText.substring(0, 5000), // Text can be truncated, it's not parsed as JSON
        responseSnapshot: JSON.stringify(structuredAnalysis),
        tokensUsed: structuredAnalysis.tokens || 0,
        durationMs: Date.now() - start,
        success: true,
      });

      return structuredAnalysis;
    } catch (error) {
      console.error("❌ Resume Worker Error:", error.message);

      await Resume.findByIdAndUpdate(resumeId, { parseStatus: "failed" });

      await AIHistory.create({
        userId,
        agentType: "resume-parser",
        promptSnapshot: `Resume ID: ${resumeId}`,
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
    concurrency: 3,
  },
);

resumeWorker.on("completed", (job) => {
  console.log(`✅ Resume parse job ${job.id} completed`);
});

resumeWorker.on("failed", (job, err) => {
  console.error(`❌ Resume parse job ${job?.id} failed: ${err.message}`);
});

export default resumeWorker;
