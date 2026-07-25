<div align="center">
  <h1>Nexus Career Intelligence</h1>
  <p><em>An autonomous multi-agent copilot that transforms the campus placement workflow into a command center featuring AI match scoring, automated cover letter synthesis, and simulated interview coaching.</em></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18-green.svg)](https://nodejs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688.svg)](https://fastapi.tiangolo.com/)
  [![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
</div>

---

## ⚡ Overview

**Nexus** is an advanced, autonomous AI-driven career copilot designed specifically for the rigorous demands of campus placements and modern job hunting. 

Rather than manually tweaking resumes or writing boilerplate cover letters, Nexus provides a **cyberpunk-themed Command Center** powered by a swarm of **6 distinct AI Agents**. These agents work collaboratively in the background to parse your uploaded neural profile (resume), extract insights from target roles, identify your vulnerabilities, and auto-generate the materials you need to land the job.

<div align="center">
  <img src="https://via.placeholder.com/800x400/111111/D4AF37?text=NEXUS+COMMAND+CENTER+DASHBOARD" alt="Dashboard Preview" />
</div>

## 🤖 The 6-Agent Swarm Architecture

1. **Resume Analyzer Agent** (`Neural Hub`): Parses your uploaded PDF resumes into structured, high-dimensional JSON data.
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

Ensure you have the following installed:
- Node.js (v18+)
- Python (v3.9+)
- Redis Server (or Upstash Redis URL)
- MongoDB Atlas cluster URL
- Firebase Service Account Key
- OpenAI or Groq API Key

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NallaSumang/Nexus-Career-Intelligence.git
   cd Nexus-Career-Intelligence
   ```

2. **Install Dependencies**
   Run the following commands in three separate terminals (or use the root `npm install` if you set up workspaces):
   ```bash
   # Terminal 1: Root & Server
   npm install
   cd server && npm install

   # Terminal 2: Client
   cd client && npm install

   # Terminal 3: AI Agents (Python)
   cd ai-agents
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *Make sure to configure MongoDB, Firebase Admin SDK, and your AI Provider keys.*

4. **Launch Nexus**
   From the root directory, run the concurrent dev script:
   ```bash
   npm run dev
   ```
   *This single command will boot the React UI, Node API, and Python Engine simultaneously.*

---
<div align="center">
  <b>Designed and Engineered by Sumang</b>
</div>
