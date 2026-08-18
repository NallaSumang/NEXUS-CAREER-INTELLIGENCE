FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user (Required for HuggingFace Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# Copy all code with proper ownership
COPY --chown=user . $HOME/app

# 1. Install and Build Frontend
WORKDIR $HOME/app/client
RUN npm install --legacy-peer-deps
RUN npm run build

# 2. Install Server API Dependencies
WORKDIR $HOME/app/server
RUN npm install

# 3. Install Python AI Dependencies
WORKDIR $HOME/app/ai-agents
ENV PATH="$HOME/.local/bin:$PATH"
RUN pip install --user --no-cache-dir -r requirements.txt

# 4. Install root deps (includes concurrently — already in devDependencies)
WORKDIR $HOME/app
RUN npm install

# 5. Environment Config
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

# 6. Start both API (which also serves the Frontend) and AI Swarm
CMD ["npx", "concurrently", "\"cd server && node server.js\"", "\"cd ai-agents && python -m uvicorn main:app --host 0.0.0.0 --port 8000\""]
