<div align="center">
  <img src="./client/public/favicon.svg" alt="Nexus Logo" width="80" height="80" />
  <h1>NEXUS CAREER INTELLIGENCE</h1>
  <p><em>An AI-powered campus placement copilot — resume parsing, job matching, cover letters &amp; interview prep, all in one async workflow.</em></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B.svg)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-339933.svg?logo=node.js)](#)
  [![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python)](#)
  [![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](#)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg?logo=fastapi)](#)
  [![Live Demo](https://img.shields.io/badge/Live-nexus--ai--vqxe.onrender.com-8b5cf6.svg)](https://nexus-ai-vqxe.onrender.com)
</div>

---


Nexus is a full-stack career tool built for B.Tech students navigating campus placement season. Upload your resume, paste a job description, and the system scores your fit, identifies missing skills, drafts a cover letter, and generates interview questions — all asynchronously so the UI never blocks.

**Core features:**
- Parses PDF resumes via MongoDB GridFS + `pdf-parse`, sends extracted text to an LLM for structured analysis
- Scores resume-to-job match using OpenAI / Groq / Gemini (switchable via `AI_PROVIDER` env var)
- Generates tailored cover letters and interview question sets
- Tracks all applications, match scores, and full AI call history in MongoDB
- Offloads every heavy AI task to a BullMQ queue (Upstash Redis) so the Express API returns instantly

---

## Architecture

This is a **monorepo** deployed as a **single Docker container** on Render's free tier. Node.js and Python run as two sibling processes under `concurrently`. The separation is **logical, not operational** — both share the same vCPU and RAM.

```
+----------------------------------------------------------+
|                    Docker Container                      |
|                 (Render Free Tier)                       |
|                                                          |
|  +----------------------+    +------------------------+  |
|  |   Node.js :5000      |    |  Python Uvicorn :8000  |  |
|  |   (Express API)      |    |  (FastAPI AI Layer)    |  |
|  |                      |    |                        |  |
|  |  +----------------+  |    |  POST /agents/         |  |
|  |  | BullMQ Workers |--+--->|    parse-resume        |  |
|  |  | (concurrency:1)|  |HTTP|    compute-match       |  |
|  |  +----------------+  |    |    cover-letter        |  |
|  |          ^           |    |    interview-prep      |  |
|  |  +-------+-------+   |    |    analytics           |  |
|  |  | BullMQ        |   |    +------------------------+  |
|  |  | Producers     |   |                                |
|  +--+---------------+---+                                |
|          |                                               |
|          v                                               |
|   +--------------+                                       |
|   | Upstash Redis|  <- Job Queue                         |
|   +--------------+                                       |
+----------------------------------------------------------+
         |                           |
         v                           v
   MongoDB Atlas              OpenAI / Groq / Gemini
   (NoSQL + GridFS)           (External LLM providers)
```

### Real Data Flow

1. **Resume upload** — Express streams PDF to MongoDB GridFS, queues `parse-resume` in Redis, returns immediately
2. **resumeWorker.js** picks up job, downloads PDF from GridFS, extracts text via `pdf-parse`, `POST :8000/agents/parse-resume`
3. **FastAPI** calls the configured LLM, returns a typed Pydantic response
4. **Worker** writes parsed JSON back to `Resume` document (`parseStatus: "done"`)
5. **User triggers match** — Express queues `compute-match`, returns `{ jobStatus: "queued" }` instantly
6. **matchWorker.js** picks it up, fetches Resume + Job from MongoDB, `POST :8000/agents/compute-match`, writes `matchScore` to `Application`
7. **React polls** `/api/v1/resumes/:id/status` until done, renders results

> **Python never touches Redis.** It is a pure stateless HTTP service. Node BullMQ workers consume queue jobs and call Python over localhost HTTP.

---

## Tech Stack

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Fast HMR in dev; built static files served by Express in production |
| **Backend API** | Node.js 20 + Express | Non-blocking event loop handles concurrent I/O: auth, DB queries, queue producers |
| **AI Layer** | Python 3.11 + FastAPI | Native LLM SDK ecosystem; Pydantic for strict structured output validation |
| **Async Queue** | BullMQ + Upstash Redis | Decouples HTTP response from 30-60s LLM processing; exponential retry on failure |
| **Database** | MongoDB Atlas + GridFS | Schemaless JSON for career data; GridFS for binary PDF blob storage |
| **Auth** | Firebase Auth + Admin SDK | Client-side token issuance; server-side JWT verification on every protected route |
| **Deployment** | Docker + Render | Single Dockerfile installs Node + Python; `concurrently` runs both in one container |
| **LLM Providers** | OpenAI / Groq / Gemini | Switchable via `AI_PROVIDER` env var; all calls have 55s timeouts |

---

## Project Structure

```text
NEXUS-CAREER-INTELLIGENCE/
|-- client/                       # React 18 + Vite frontend
|   |-- src/
|   |   |-- api/                  # Axios instance with auth header injection
|   |   |-- components/           # Feature components (Dashboard, ResumeUpload, etc.)
|   |   |-- hooks/                # Custom React hooks
|   |   `-- App.jsx
|   `-- vite.config.js
|
|-- server/                       # Express API + BullMQ workers
|   |-- config/
|   |   |-- db.js                 # MongoDB connection with cached singleton
|   |   |-- redis.js              # ioredis with env-aware retry strategy
|   |   `-- firebase.js           # Firebase Admin SDK
|   |-- middleware/
|   |   |-- auth.js               # Firebase JWT verification
|   |   `-- errorHandler.js
|   |-- models/
|   |   |-- Resume.js             # Resume + GridFS ref + parseStatus
|   |   |-- Job.js                # Job description + parsedRequirements
|   |   |-- Application.js        # User<->Job<->Resume + matchScore
|   |   |-- AIHistory.js          # Audit log of every LLM call
|   |   `-- InterviewNote.js      # Generated interview questions
|   |-- queues/
|   |   |-- aiQueue.js            # BullMQ producer (ai-jobs queue)
|   |   |-- resumeQueue.js        # BullMQ producer (resume-processing queue)
|   |   `-- workers/
|   |       |-- matchWorker.js    # Handles: match, cover-letter, interview-prep, analytics
|   |       `-- resumeWorker.js   # Handles: PDF parse -> Python AI
|   |-- routes/
|   |   |-- auth.routes.js
|   |   |-- resume.routes.js
|   |   |-- ai.routes.js
|   |   `-- application.routes.js
|   `-- server.js                 # App init (singleton guard) + static serving
|
|-- ai-agents/                    # FastAPI AI layer
|   |-- agents/
|   |   |-- resume_agent.py       # POST /agents/parse-resume
|   |   |-- job_parser_agent.py   # POST /agents/parse-job
|   |   |-- match_agent.py        # POST /agents/compute-match
|   |   |-- cover_letter_agent.py # POST /agents/generate-cover-letter
|   |   |-- interview_coach_agent.py
|   |   `-- analytics_agent.py
|   |-- prompts/                  # Prompt templates (.txt)
|   |-- config.py                 # Unified call_llm() with 55s timeout
|   |-- models.py                 # Pydantic request/response schemas
|   |-- main.py                   # FastAPI app + CORS + router registration
|   `-- requirements.txt
|
|-- Dockerfile                    # Installs Node + Python; runs via concurrently
|-- render.yaml                   # Render Blueprint - single Docker web service
|-- package.json                  # Root: concurrently dev scripts
`-- .env.example                  # All required env vars documented
```

---

## Environment Variables

Copy `.env.example` to `.env` in the root directory:

```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cpc

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI Provider - pick ONE and set the matching key
AI_PROVIDER=groq               # options: openai | groq | gemini
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=                # only needed if AI_PROVIDER=gemini

# Redis - required in production for the BullMQ queue
REDIS_URL=redis://localhost:6379   # use your Upstash Redis URL in production

# Internal service URLs (do not change for local dev)
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

> If `REDIS_URL` is unreachable, all AI routes return `503 QUEUE_UNAVAILABLE`. Resume upload has an inline fallback that calls Python directly without the queue.

---

## Local Development

**Prerequisites:** Node.js 20+, Python 3.11+, pip

```bash
# 1. Clone
git clone https://github.com/NallaSumang/NEXUS-CAREER-INTELLIGENCE.git
cd NEXUS-CAREER-INTELLIGENCE

# 2. Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
cd ai-agents && pip install -r requirements.txt && cd ..

# 3. Configure environment
cp .env.example .env
# Edit .env - at minimum set MONGO_URI, AI_PROVIDER, and matching API key

# 4. Start all three processes
npm run dev
```

The `concurrently` package boots all three with colour-coded logs:
- **API** (blue) - Express on `:5000`
- **AI** (yellow) - Uvicorn FastAPI on `:8000`
- **WEB** (green) - Vite dev server on `:5173`

---

## Deployment (Render)

```bash
# Push to GitHub - Render auto-redeploys
git add .
git commit -m "your message"
git push origin main
```

**First-time setup:**
1. Go to [Render.com](https://render.com) -> New -> Blueprint
2. Connect this GitHub repo
3. Set all environment variables in the Render dashboard
4. Render builds the Docker image and deploys both Node + Python in one container

> **Free tier note:** Container runs on ~0.1 vCPU / 512MB RAM. Workers are set to `concurrency: 1` to prevent resource starvation. Cold starts take 30-60s after inactivity.

---

## Stability Fixes Applied

| Fix | File | Bug -> Resolution |
| :--- | :--- | :--- |
| Singleton guard | `server/server.js` | `initializeApp()` ran on every request — MongoDB connection storm. Now runs exactly once. |
| Graceful shutdown | `server/server.js` | No SIGTERM handler — Render killed process mid-write. Added handlers to drain MongoDB cleanly. |
| Redis retry | `server/config/redis.js` | `retryStrategy: () => null` permanently gave up after first failure. Now retries 10x with exponential backoff in production. |
| Worker concurrency | `matchWorker.js`, `resumeWorker.js` | `concurrency: 3` x 2 workers = 6 simultaneous 60s LLM calls on 0.1 vCPU. Set to `1` each. |
| Worker shutdown | Both workers | Added `SIGTERM` handler so in-flight jobs complete before container exit. |
| Silent AI failures | `server/routes/ai.routes.js` | Redis down returned fake `{ jobStatus: "queued" }` — users waited forever. Now returns `503 QUEUE_UNAVAILABLE`. |
| Invalid CORS | `ai-agents/main.py` | `allow_origins=["*"]` + `allow_credentials=True` is invalid per RFC 6454. Fixed: `credentials=False`. |
| LLM timeouts | `ai-agents/config.py` | No timeout on LLM calls — one hung call froze entire Uvicorn process. Added 55s timeout on all providers. |

---

## Data Models

| Model | Key Fields |
| :--- | :--- |
| `Resume` | `userId`, `gridFsId`, `originalFilename`, `parseStatus`, `parsedJson` |
| `Job` | `title`, `company`, `description`, `parsedRequirements`, `postedBy` |
| `Application` | `userId`, `resumeId`, `jobId`, `status`, `matchScore`, `missingSkills`, `coverLetterText` |
| `AIHistory` | `userId`, `agentType`, `promptSnapshot`, `responseSnapshot`, `tokensUsed`, `durationMs`, `success` |
| `InterviewNote` | `userId`, `applicationId`, `generatedQuestions[]`, `userAnswers[]` |

---

## API Reference

All endpoints require `Authorization: Bearer <firebase-id-token>`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register user |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/resumes/upload` | Upload PDF (multipart) -> queues AI parse |
| `GET` | `/api/v1/resumes/` | List user's resumes |
| `GET` | `/api/v1/resumes/:id/status` | Poll parse status + result |
| `DELETE` | `/api/v1/resumes/:id` | Delete resume + GridFS file |
| `POST` | `/api/v1/ai/match` | Queue resume-job match score |
| `POST` | `/api/v1/ai/cover-letter` | Queue cover letter generation |
| `POST` | `/api/v1/ai/interview-prep` | Queue interview questions |
| `GET` | `/api/v1/ai/status/:jobId` | Poll async job status |
| `POST` | `/api/v1/ai/analytics` | Queue career analytics |
| `GET` | `/api/v1/ai/analytics` | Retrieve latest analytics result |
| `GET/POST` | `/api/v1/applications/` | Manage job applications |

---

<div align="center">
  <i>Built by Sumang Nalla — full-stack AI integration project demonstrating async job processing, multi-provider LLM abstraction, and production deployment on Render.</i>
</div>
