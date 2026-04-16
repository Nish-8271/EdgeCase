# 🚀 EdgeCase — AI-Powered Competitive Programming Engine

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://edgecases.duckdns.org)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed-blue?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/Deployed-AWS%20EC2-orange?style=for-the-badge&logo=amazon-aws)](https://aws.amazon.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20Pro-purple?style=for-the-badge&logo=google-gemini)](https://aistudio.google.com/)

**EdgeCase** is a high-performance, secure competitive programming platform designed for the modern era. Beyond just a judge, it leverages **Generative AI** to act as a personal coach—identifying algorithmic bottlenecks and generating rigorous edge cases that standard judges often miss.

---

## ⚡ Key Technical Features

### 🛡️ Secure Sandboxed Execution
Most platforms struggle with security; EdgeCase uses a **Docker-in-Docker** architecture. 
- **Isolation**: Every submission (C++, Python, Java, C, Rust) is executed in a fresh, read-only Docker container.
- **Resource Constraints**: Strict memory (128MB) and CPU (0.5 vCPUs) limits are enforced at the kernel level.
- **Networking**: Containers are purged of network access to prevent unauthorized data exfiltration.

### 🧠 AI-Enhanced Analysis
Powered by the **Gemini 1.5 Flash** model, the platform provides:
- **Big-O Complexity Analysis**: Deep-dive into Time and Space complexity based on code logic, not just execution time.
- **Edge Case Generation**: Automatically generates brutal corner-case inputs based on your problem statement to help you debug before submitting.
- **Optimization Strategy**: Provides actionable advice on algorithmic improvements (e.g., suggesting a Segment Tree over a simple array).

### ☁️ Production-Grade Infrastructure
Successfully deployed on **AWS EC2** with a robust DevOps pipeline:
- **Reverse Proxy**: Nginx handles incoming traffic and provides SSL/TLS termination via Certbot.
- **Socket Communication**: The server communicates with the host Docker daemon via Unix socket mounting, allowing for high-performance container spawning.
- **Session Management**: Secure, persistent sessions via Firebase and `cookie-parser`.

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Vanilla CSS, Monaco Editor (VS Code Engine)
- **AI**: Google Gemini AI (@google/generative-ai)
- **Database/Auth**: Firebase Admin SDK
- **Infrastructure**: AWS EC2, Docker, Nginx, Linux (Ubuntu 22.04)

---

## 🛠️ Local Development

### 1. Prerequisites
- [Node.js v18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- [Google AI Studio Key](https://aistudio.google.com/app/apikey)

### 2. Setup
```bash
git clone https://github.com/Nish-8271/EdgeCase.git
cd EdgeCase
npm install
```

### 3. Build Runner Images
We provide a helper script to build all 5 language environments locally:
```bash
chmod +x docker/build-images.sh
./docker/build-images.sh
```

### 4. Configuration
Create a `.env` file based on our template:
```bash
cp .env.production.example .env
# Fill in your GEMINI_API_KEY and Firebase credentials
```

### 5. Run
```bash
npm run dev
```

---

## 🚢 Deployment Guide

For a full breakdown of how to deploy this to AWS EC2 (including Elastic IP setup, Firewall configuration, and SSL), please refer to our [Deployment Walkthrough](./deploy_guide.md).

---

## 👥 Contributors
- **Nishant** — Lead Developer & Architect

---

*“Don't just code. Edge-case your code.”*
