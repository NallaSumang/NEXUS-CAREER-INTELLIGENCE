import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.js';
import Resume from '../models/Resume.js';
import { resumeQueue } from '../queues/resumeQueue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

router.post('/upload', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Manually stream to GridFS to bypass the broken multer-gridfs-storage package
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
    const uploadStream = bucket.openUploadStream(`resume_${Date.now()}_${req.file.originalname}`);
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        const resume = new Resume({
          userId: req.user._id,
          originalFilename: req.file.originalname,
          gridFsId: uploadStream.id,
          parseStatus: 'pending'
        });

        await resume.save();

        let queueJobId = `mock_job_${Date.now()}`;
        try {
          const customJobId = `resume_${Date.now()}`;
          const jobReq = await resumeQueue.add('parse-resume', { resumeId: resume._id, userId: req.user._id }, { jobId: customJobId });
          queueJobId = jobReq.id;
        } catch (err) {
          console.log('[Fallback] Redis unavailable. Processing resume directly...');
          // Process directly without BullMQ — call the Python AI service inline
          (async () => {
            try {
              const axios = (await import('axios')).default;
              const { createRequire } = await import('module');
              const require = createRequire(import.meta.url);
              const pdfParse = require('pdf-parse');
              
              await Resume.findByIdAndUpdate(resume._id, { parseStatus: 'processing' });
              
              // Download from GridFS
              const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
              const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(resume.gridFsId));
              const chunks = [];
              const buffer = await new Promise((resolve, reject) => {
                downloadStream.on('data', (chunk) => chunks.push(chunk));
                downloadStream.on('error', (err) => reject(err));
                downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
              });
              
              // Extract text
              const parsedPdf = await pdfParse(buffer);
              const rawText = parsedPdf.text;
              
              // Call Python AI service
              const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
              const aiRes = await axios.post(`${aiServiceUrl}/agents/parse-resume`, {
                text: rawText,
                metadata: { filename: resume.originalFilename, profileId: resume._id }
              }, { timeout: 60000 });
              
              await Resume.findByIdAndUpdate(resume._id, {
                parsedJson: aiRes.data,
                parseStatus: 'done'
              });
              console.log('[Fallback] Resume processed successfully without Redis.');
            } catch (fallbackErr) {
              console.error('[Fallback] Direct processing failed:', fallbackErr.message);
              await Resume.findByIdAndUpdate(resume._id, { parseStatus: 'failed' });
            }
          })();
        }

        res.json({ resumeId: resume._id, status: 'pending', message: 'Processing started', queueJobId });
      } catch (err) {
        console.error('Error during upload finish callback:', err);
        res.status(500).json({ error: `Database save failed: ${err.message}` });
      }
    });

    uploadStream.on('error', (err) => {
      console.error('GridFS stream error:', err);
      res.status(500).json({ error: `Failed to write file to database: ${err.message}` });
    });
  } catch (error) {
    console.error('Outer upload error:', error);
    res.status(500).json({ error: `Upload error: ${error.message}` });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ uploadedAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume || resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume || resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ resumeId: resume._id, parseStatus: resume.parseStatus, parsedJson: resume.parsedJson || null });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume || resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Also delete from GridFS
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
    const fileId = resume.gridFsId;
    try {
      if (fileId) await bucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (e) {
      console.log("File not found in GridFS", e);
    }

    await Resume.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
    const obj_id = new mongoose.Types.ObjectId(req.params.id);
    const downloadStream = bucket.openDownloadStream(obj_id);
    
    downloadStream.on('error', () => {
      res.status(404).json({ error: 'File not found' });
    });
    
    res.set('Content-Type', 'application/pdf');
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
