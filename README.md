<div align="center">
  <img src="https://raw.githubusercontent.com/NallaSumang/PlaceIQ-Agentic-Copilot/master/client/public/favicon.ico" alt="PlaceIQ Logo" width="80" height="80" />
  <h1>PlaceIQ Agentic Copilot</h1>
  <p><em>A multi-agent LLM orchestrator that transforms the campus placement workflow into an autonomous command center featuring AI match scoring, automated cover letter synthesis, and simulated interview coaching.</em></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18-green.svg)](https://nodejs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688.svg)](https://fastapi.tiangolo.com/)
  [![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
</div>

---

## ⚡ Overview

**PlaceIQ** is an advanced, autonomous AI-driven career copilot designed specifically for the rigorous demands of campus placements and modern job hunting. 

Rather than manually tweaking resumes or writing boilerplate cover letters, PlaceIQ provides a **cyberpunk-themed Command Center** powered by a swarm of **6 distinct AI Agents**. These agents work collaboratively in the background to parse your uploaded neural profile (resume), extract insights from target roles, identify your vulnerabilities, and auto-generate the materials you need to land the job.

<div align="center">
  <img src="https://via.placeholder.com/800x400/111111/D4AF37?text=PLACEIQ+COMMAND+CENTER+DASHBOARD" alt="Dashboard Preview" />
</div>

## 🤖 The 6-Agent Swarm Architecture

1. **Resume Analyzer Agent** (`Neural Hub`): Parses your uploaded PDF resumes into structured, high-dimensional JSON data, extracting hard skills, soft skills, and experience vectors.
2. **Job Parser Agent** (`Active Targets`): Instantly analyzes raw job descriptions to extract the canonical Job Title, Company Name, and absolute required skills.
3. **Gap Analysis / Match Agent**: Correlates the output from the Resume Agent and Job Parser to generate a deterministic **Alignment Score** and flags missing required skills as "Vulnerabilities".
4. **Cover Letter Synthesizer**: Automatically writes a professional, targeted cover letter by fusing your extracted resume data with the job requirements.
5. **Interview Coach Agent** (`Combat Prep`): Generates highly technical, company-specific interview questions based on your resume vulnerabilities and the job's tech stack.
6. **Career Analytics Agent** (`Trajectory`): Analyzes your historical application data and provides macro-level feedback on your overall career trajectory.

## ✨ Core Features

* **Glassmorphism / Dark Mode UI**: A visually stunning interface heavily inspired by sci-fi command centers.
* **1-Click AI Generation**: Paste a target job description and instantly receive Match Scores, Cover Letters, and Interview Prep.
* **Asynchronous LLM Queues**: Uses BullMQ + Redis to handle heavy AI workloads in the background without blocking the UI.
* **Agent Output Exports**: Download the raw `.txt` output of any agent directly from the dashboard.
* **Isolated Telemetry**: Multi-tenant database architecture separating user data.

## 🛠️ Tech Stack

* **Frontend**: React (Vite), Framer Motion, Tailwind CSS
* **Backend API**: Node.js, Express, MongoDB (Mongoose), BullMQ (Redis)
* **AI Engine**: Python, FastAPI, Groq (Llama-3), OpenAI
* **Database**: MongoDB Atlas
* **Authentication**: Firebase Admin SDK

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Redis (Running locally or via Upstash)
* MongoDB Database URI
* API Keys for Groq / OpenAI

### 1. Clone the Repository
```bash
git clone https://github.com/NallaSumang/PlaceIQ-Agentic-Copilot.git
cd PlaceIQ-Agentic-Copilot
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_firebase_project_id
GROQ_API_KEY=your_groq_api_key
AI_PROVIDER=groq
AI_SERVICE_URL=http://127.0.0.1:8000
REDIS_URL=your_redis_url
```

### 3. Install Dependencies
```bash
# Install root/server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install Python AI dependencies
cd ai-agents
pip install -r requirements.txt
cd ..
```

### 4. Boot up the Command Center
You need to run three separate services to power the full architecture:

**Terminal 1 (Web Interface):**
```bash
npm run dev
```

**Terminal 2 (Node.js API & Workers):**
```bash
npm run dev:api
```

**Terminal 3 (Python AI Swarm):**
```bash
npm run dev:ai
```

---
*Built to hyper-optimize the modern campus placement workflow.*
