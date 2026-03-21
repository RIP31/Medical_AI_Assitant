# Medical AI Assistant

A full-stack medical chatbot web application with authentication, profile-aware chat, symptom guidance, and medication interaction checks.

## Disclaimer

This project provides general educational information only and is **not** a substitute for professional medical advice, diagnosis, or treatment.

## Features

- User authentication (register, login, password change)
- Profile management for personalized chat context
- AI chat interface with Ollama integration (`llama3.1:8b`)
- Graceful fallback response mode when Ollama is unavailable
- Symptom checker workflow in the frontend
- Medication interaction checker powered by openFDA label data
- Persistent chat history per user
- Speech output support
- Privacy reset flow after password changes

## Tech Stack

### Frontend

- React (Create React App)
- Context API for app state
- Lucide React icons

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcryptjs password hashing

### External Services

- Ollama local LLM runtime
- openFDA API for medication labels/interactions

## Project Structure

```text
MedicalAI_Chatbot/
  backend/
    models/
    routes/
    server.js
    resetDb.js
  frontend/
    public/
    src/
  Research-Papers/
  package.json
  README.md
```

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB (local or cloud)
- Ollama (optional but recommended for full chat capability)

## Environment Variables

Create a `.env` file in `backend/` with:

```env
MONGO_URI=mongodb://localhost:27017/medical_ai
JWT_SECRET=replace_with_a_secure_secret
PORT=5000
```

## Installation

Install dependencies in all required folders:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Running The App

### 1) Start backend

```bash
cd backend
node server.js
```

Backend runs on `http://localhost:5000` by default.

### 2) Start frontend

```bash
cd frontend
npm start
```

Frontend runs on `http://localhost:3000` and proxies API requests to backend.

## API Overview

### Auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/change-password`
- `POST /api/auth/ack-privacy-reset`

### Interaction routes

- `POST /api/interactions/check`
- Additional interaction and history endpoints are available under `/api/interactions`.

## Ollama Setup (Optional)

Install and run Ollama, then pull your model:

```bash
ollama pull llama3.1:8b
```

Keep Ollama running while using chat for full AI responses.

## Scripts

### Frontend (`frontend/package.json`)

- `npm start`
- `npm run build`
- `npm test`

### Backend (`backend/package.json`)

- Start server with: `node server.js`

## Notes

- The repository includes research documents under `Research-Papers/`.
- Root `node_modules` and nested `node_modules` are ignored via `.gitignore`.

## License

This project currently does not define a license. Add one if you plan to open-source it publicly.
