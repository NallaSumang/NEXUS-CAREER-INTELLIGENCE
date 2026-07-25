<div align="center">
  <img src="./client/public/favicon.svg" alt="Nexus Hexagon" width="80" height="80" />
  <h1>NEXUS CAREER INTELLIGENCE</h1>
  <p><em>An Enterprise-Grade, Autonomous AI Swarm Architecture for Predictive Career Matching & Interview Synthesis</em></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B.svg)](#)
  [![Architecture](https://img.shields.io/badge/Architecture-Microservices-0ea5e9.svg)](#)
  [![AI Layer](https://img.shields.io/badge/Intelligence-LLM_Swarm-8b5cf6.svg)](#)
  [![Deployment](https://img.shields.io/badge/Deployment-Docker_Unified-10b981.svg)](#)
</div>

---

## ⚡ Executive Summary

**Nexus** is an advanced, distributed multi-agent intelligence system engineered specifically for high-stakes recruitment and placement optimization. 

Moving beyond traditional monolithic wrappers, Nexus implements a **highly decoupled microservice architecture**. It orchestrates a reactive presentation layer, an asynchronous I/O-optimized Node.js routing hub, and a heavy-computation Python AI swarm executing asynchronously over a distributed Redis message queue. 

This repository demonstrates peak engineering standards: utilizing unified Docker containerization, dynamic environment proxying, and scalable NoSQL persistence.

---

## 🏗️ System Architecture & Folder Topology

The codebase is strictly organized into decoupled, domain-specific bounded contexts, adhering to the highest standards of senior-level Monorepo engineering.

```text
NEXUS-CAREER-INTELLIGENCE/
├── client/                 # Edge Presentation Layer (React 18 + Vite)
│   ├── src/api/            # Dynamic Axios interceptors with intelligent production routing
│   ├── src/components/     # Highly modular, stateful functional components
│   └── index.html          # Entry point
│
├── server/                 # Primary Orchestrator (Node.js + Express)
│   ├── config/             # DB & Queue configuration singletons (MongoDB, Redis, Firebase)
│   ├── controllers/        # Business logic & request validation
│   ├── queues/             # BullMQ Redis Producers & asynchronous task offloading
│   ├── routes/             # REST API definition layer
│   └── server.js           # Core instantiation & static artifact serving (Unified Deployment)
│
├── ai-agents/              # Intelligence Swarm (Python 3.11 + FastAPI)
│   ├── agents/             # Autonomous LangChain/LLM discrete reasoning modules
│   ├── main.py             # Uvicorn ASGI server instantiation
│   └── requirements.txt    # Frozen dependency graph
│
├── Dockerfile              # Cross-environment Unified Deployment Manifest
├── render.yaml             # Infrastructure-as-Code (IaC) Blueprint
└── package.json            # Global dependency management & concurrently execution scripts
```

### Architectural Data Flow (The "How")
1. **The Request:** The user interacts with the React Edge UI (glassmorphism luxury theme). The UI makes an asynchronous HTTP request.
2. **The Orchestrator:** The Node.js Express server receives the payload. It strictly validates authentication via Firebase Admin SDK.
3. **The Queue:** Instead of blocking the main thread (which would crash under load), Node.js drops the heavy AI inference task into an in-memory **Redis (BullMQ)** message queue and instantly returns a `202 Accepted` status to the client.
4. **The Swarm:** The Python FastAPI worker, running continuously on a separate process, detects the new job in Redis. It spins up the necessary AI Agents (using Groq/OpenAI LLMs) to process resumes, synthesize cover letters, or generate interview simulations.
5. **The Persistence:** The Python worker writes the final output directly to the **MongoDB Atlas (NoSQL)** cluster and marks the job as complete. The React UI, polling the DB, updates in real-time.

---

## 🛠️ Technology Matrix (The "Why")

We selected each layer of the stack based on strict performance and scaling requirements:

| Domain | Technology | Engineering Rationale |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | React's virtual DOM prevents full-page reloads, essential for a fluid, app-like experience. Vite replaces legacy Webpack for near-instant HMR (Hot Module Replacement) during development. |
| **Backend API** | Node.js + Express | Node's Event Loop is unmatched for handling thousands of concurrent, I/O-bound network requests and managing connection pools to Redis and MongoDB. |
| **Intelligence** | Python + FastAPI | Python possesses the richest ecosystem for AI/ML (LangChain, Transformers). FastAPI provides lightning-fast ASGI performance with strict Pydantic type validation. |
| **Database** | MongoDB Atlas | Career data (resumes, unpredictable JSON arrays of skills) is inherently unstructured. NoSQL provides the schema flexibility SQL lacks. |
| **Message Broker** | Upstash Redis | Guarantees delivery of AI tasks. Prevents the Node.js API from bottlenecking during high-latency LLM inference calls. |
| **Deployment** | Docker & Render | A bespoke `Dockerfile` packages all three environments (React, Node, Python) into a single, unified container running on Render's free tier, bypassing typical cloud limitations. |

---

## 🚀 Deployment Operations (DevOps)

### 1-Click Automated Cloud Deployment
The repository contains a declarative `render.yaml` Blueprint. This completely automates the CI/CD pipeline.

1. Connect this repository to [Render.com](https://render.com).
2. Select **New Blueprint**.
3. Input your production Environment Variables.
4. The system automatically provisions a unified Docker container and proxies all `/api/v1` traffic internally.

### Local Engineering Environment
To spin up the entire cluster locally on your development machine:

1. **Clone the matrix:**
   ```bash
   git clone https://github.com/NallaSumang/NEXUS-CAREER-INTELLIGENCE.git
   cd NEXUS-CAREER-INTELLIGENCE
   ```

2. **Hydrate dependencies:**
   ```bash
   npm install                  # Root orchestrator dependencies
   cd server && npm install     # Node API dependencies
   cd ../client && npm install  # React Edge UI dependencies
   cd ../ai-agents && pip install -r requirements.txt # Python Swarm
   ```

3. **Configure the Environment:**
   Duplicate the `.env.example` to `.env` in the root directory and inject your securely provisioned credentials (MONGO_URI, GROQ_API_KEY, REDIS_URL).

4. **Ignite the Cluster:**
   ```bash
   # From the root directory:
   npm run dev
   ```
   *The `concurrently` package will automatically boot the Node API, Python Engine, and React HMR server simultaneously, color-coding their stdout logs in your terminal.*

---

<div align="center">
  <i>Engineered for peak performance, extreme scalability, and uncompromising aesthetics.</i>
</div>
