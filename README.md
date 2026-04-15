# AI-Powered Competitive Programming Platform

A modern, fast, and highly secure competitive programming platform built with Node.js and Express. This platform features isolated code execution via an integrated Docker sandbox system and is supercharged with Google Gemini AI to help users analyze their code's performance and generate rigorous edge-test cases automatically.

## ✨ Features

- **Isolated Code Sandboxes**: Execute untrusted user code (C++, Python, Java, C, Rust) safely via Docker containerization with strict cpu/memory timeouts.
- **AI Code Analyzer**: Built-in Google Gemini engine automatically identifies and breaks down a user's Time Complexity (Big-O), Space Complexity, algorithmic approach, and provides critical optimization advice.
- **AI Edge Case Generator**: Instantly generate brutal corner-case testing scenarios via generative AI based purely on the problem statement.
- **Live IDE Environment**: A dark-themed, highly responsive Monaco-based editor matching the visual aesthetic of premium coding environments (like VS Code).
- **Trending Dashboards**: A live-updating aggregate feed pulling the Top 4 Developer articles from Dev.to and the hottest trending repositories from GitHub.
- **Authentication**: A secure Firebase authentication module heavily integrated with persistent sessions, allowing personalized coding environments.
- **Security Protocols**: Armed with `helmet` HTTP headers and `express-rate-limit` middleware, ensuring the Generative AI and execution routes cannot be abused or drained.

## 🚀 Tech Stack

- **Backend Framework**: Node.js, Express.js
- **Frontend Views**: EJS Templating, Vanilla CSS, Monaco Editor
- **AI Integration**: `@google/generative-ai` (Gemini 2.5 Flash)
- **Code Runner**: Remote Docker Engined Instances (`child_process` spawn)
- **Authentication**: Firebase Admin SDK & Firebase Client SDK
- **Security**: Express Rate Limit, Helmet

## 🛠️ Installation & Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) installed securely on your machine.
- [Docker Engine](https://www.docker.com/) running locally (required for executing code).
- A [Firebase Project](https://firebase.google.com/) equipped with Authentication enabled.
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey).

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/repo-name.git
cd repo-name
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Build Sandbox Docker Images
In order for the platform to execute your compiler queries without downloading images sequentially, you must build the target dependencies within the local Docker registry:
```bash
# Navigate to your Docker module and run your image builds
# Example: docker build -t cp-python -f Dockerfile.python .
# Example: docker build -t cp-cpp -f Dockerfile.cpp .
# The executing routes expect the tags: cp-python, cp-cpp, cp-java, cp-c, cp-rust
```

### 5. Environment Configuration
Create a `.env` file in the root of your project:
```env
PORT=8800

# Google AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase (for deployment architecture)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Frontend Firebase Injection
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender
FIREBASE_APP_ID=your_app_id
```

### 6. Start the Platform
```bash
# Start locally using nodemon hot-reload
npm run dev

# Or boot standard for production
npm start
```
*Your application will now be running at `http://localhost:8800`*


## ☁️ Deployment Requirements (VPS)

Because the Execution architecture utilizes `child_process.spawn('docker run ...')` behind the scenes, this application **cannot be deployed to standard Serverless solutions** (Vercel, standard Heroku Dynos). 
You **must** deploy this to a Virtual Private Server (AWS EC2, DigitalOcean Droplet, Linode) or a Docker-compatible App Platform where the Docker Daemon is actively running natively to safely cage your executing applications!
