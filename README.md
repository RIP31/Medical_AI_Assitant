# Medical AI Assistant

A full-stack medical and health-information assistant built with React,
Node.js, Express, MongoDB, Ollama, and OpenFDA.

The application is intended for general educational health information only.
It is not a substitute for professional medical diagnosis, treatment, or
advice.

## Features

- User registration and login.
- JWT authentication with five-day token expiration.
- Password hashing and comparison with `bcryptjs`.
- Guest mode without creating a MongoDB account.
- AI chat through a locally running Ollama instance.
- Default Ollama model: `llama3.1:8b`.
- Ollama availability and model-status checking.
- Basic-mode chat fallback when Ollama is unavailable.
- Local conversation persistence in the browser.
- Conversation search, grouping, loading, deletion, clearing, and JSON export.
- Personal health profile with age, gender, conditions, medications, allergies,
  blood type, and last checkup fields.
- Deterministic, rule-based symptom checker.
- Medication interaction checker.
- OpenFDA drug-label integration.
- Internal medication interaction fallback rules.
- OpenFDA label-result caching for the lifetime of the backend process.
- Light and dark themes.
- Browser text-to-speech for assistant responses.
- Stop/cancel support for an active AI request.
- Privacy cleanup after a password change.

The symptom checker is a deterministic rule-based system, not an AI diagnostic
model. It considers the entered symptom, duration, severity, related symptoms,
and existing conditions to produce a risk classification.

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface and component rendering |
| State | React Context API | Global authentication, chat, and theme state |
| Frontend build | Create React App / `react-scripts` | Development server and production build |
| Frontend rendering | `react-markdown` | Rendering assistant responses |
| Frontend icons | `lucide-react` | UI icons |
| Backend runtime | Node.js | Server-side JavaScript runtime |
| Backend API | Express.js | REST API routing and middleware |
| Database | MongoDB | User-account storage |
| ODM | Mongoose | MongoDB connection and `User` model access |
| Authentication | JSON Web Tokens (JWT) | Token creation and profile-token verification |
| Password security | `bcryptjs` | Password hashing and comparison |
| Configuration | `dotenv` | Loading backend environment variables |
| Cross-origin support | `cors` | Express CORS middleware |
| AI runtime | Ollama | Local large-language-model inference |
| AI model | `llama3.1:8b` | Default model for chat responses |
| Drug data | OpenFDA Drug Label API | Medication-label and interaction information |
| Browser storage | `localStorage` | Token, profile, chat, session, and theme persistence |
| Browser speech | Web Speech API | Reading assistant responses aloud |
| Package manager | npm | Dependency installation and scripts |
| Testing | Create React App test tooling and Testing Library | Frontend test execution; backend tests are not configured |

## Architecture

The backend uses a layered architecture:

```text
                         HTTP Request
                              |
                              v
                         Express Route
                              |
                              v
                         Controller
                              |
                              v
                           Service
                              |
                +-------------+-------------+
                |                           |
                v                           v
          Repository                    External APIs
                |                    Ollama / OpenFDA
                v
             Mongoose
                |
                v
             MongoDB
```

Responsibilities:

- **Routes** define HTTP endpoints and delegate to controller functions.
- **Controllers** handle HTTP-specific work such as reading requests and
  returning responses.
- **Services** contain application and business logic.
- **Repositories** isolate database operations.
- **Mongoose** provides the MongoDB model and query layer.
- **MongoDB** stores registered user accounts.
- **Ollama** provides local AI inference.
- **OpenFDA** provides medication-label information used by the interaction
  checker.

Chat history and profile data are intentionally not stored in MongoDB in the
current implementation. They remain browser-local through the frontend.

## Project Structure

```text
MedicalAI_Chatbot/
├── backend/
│   ├── server.js
│   ├── resetDb.js
│   ├── package.json
│   │
│   ├── models/
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── interactions.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   └── interactionController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── chatService.js
│   │   └── interactionService.js
│   │
│   └── repositories/
│       └── userRepository.js
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── index.css
│       ├── index.js
│       ├── App.test.js
│       ├── reportWebVitals.js
│       ├── components/
│       │   ├── AuthModal.js
│       │   ├── ChatHistory.js
│       │   ├── ChatInput.js
│       │   ├── ChatPanel.js
│       │   ├── Header.js
│       │   ├── MedicationChecker.js
│       │   ├── ProfileDisplay.js
│       │   ├── ProfileEditor.js
│       │   ├── Sidebar.js
│       │   └── SymptomChecker.js
│       ├── contexts/
│       │   ├── AuthContext.js
│       │   ├── ChatContext.js
│       │   └── ThemeContext.js
│       ├── data/
│       │   └── medications.js
│       ├── hooks/
│       │   └── useSpeechOutput.js
│       ├── services/
│       │   ├── interactionService.js
│       │   └── ollamaService.js
│       └── utils/
│           ├── chatHistory.js
│           ├── privacyCleanup.js
│           └── validation.js
│
├── Research-Papers/
├── .gitignore
├── 10_Minute_Medical_AI_Pitch.txt
├── Medicine.txt
└── README.md
```

### Important backend files

- `backend/server.js`: Loads configuration, creates Express, configures
  middleware, connects to MongoDB, mounts routes, handles errors, and starts
  the server.
- `backend/models/User.js`: Defines the only Mongoose model.
- `backend/routes/auth.js`: Defines authentication endpoints only.
- `backend/routes/chat.js`: Defines Ollama status and chat endpoints only.
- `backend/routes/interactions.js`: Defines the medication interaction endpoint
  only.
- `backend/controllers/`: Converts HTTP requests into service calls and
  service results into HTTP responses.
- `backend/services/authService.js`: Authentication, password, JWT, and
  privacy-reset business logic.
- `backend/services/chatService.js`: Ollama communication, validation, and
  response normalization.
- `backend/services/interactionService.js`: Medication normalization,
  OpenFDA lookup, caching, pair comparison, fallback rules, and response
  construction.
- `backend/repositories/userRepository.js`: Mongoose operations for users.
- `backend/resetDb.js`: Development utility that deletes all users.

### Important frontend files

- `frontend/src/index.js`: React entry point and provider setup.
- `frontend/src/App.js`: Main application coordinator and feature flow.
- `frontend/src/contexts/AuthContext.js`: Authentication and guest state.
- `frontend/src/contexts/ChatContext.js`: Current messages and active session.
- `frontend/src/contexts/ThemeContext.js`: Light/dark theme state.
- `frontend/src/components/ChatPanel.js`: Displays chat messages.
- `frontend/src/components/ChatInput.js`: Collects and sends chat input.
- `frontend/src/components/ChatHistory.js`: Searches and manages saved chats.
- `frontend/src/components/ProfileEditor.js`: Edits and validates the profile.
- `frontend/src/components/MedicationChecker.js`: Runs interaction checks.
- `frontend/src/components/SymptomChecker.js`: Runs the rule-based assessment.
- `frontend/src/services/ollamaService.js`: Calls the backend chat endpoints.
- `frontend/src/services/interactionService.js`: Calls the interaction endpoint.
- `frontend/src/utils/chatHistory.js`: Persists and manages local conversations.
- `frontend/src/utils/privacyCleanup.js`: Clears local privacy data.

## Authentication Flow

```text
POST /api/auth/register
        |
        v
routes/auth.js
        |
        v
authController.js
        |
        v
authService.js
        |
        v
userRepository.js
        |
        v
User.js / MongoDB
```

### Registration

```text
Request
  ↓
Find existing user
  ↓
Hash password with bcrypt
  ↓
Create user
  ↓
Save to MongoDB
  ↓
Generate JWT
  ↓
Return response
```

`authService.register()` checks the email through `userRepository`, hashes the
password with `bcryptjs`, creates and saves a `User`, and signs a JWT with a
five-day expiration.

### Login

```text
Request
  ↓
Find user
  ↓
bcrypt.compare()
  ↓
Generate JWT
  ↓
Return response
```

`authService.login()` finds the user, compares the supplied password against
the stored bcrypt hash, and returns the same JWT/user response shape used by
the frontend.

The profile endpoint verifies either a raw token or a `Bearer` token from the
`Authorization` header. The frontend stores the returned token and active-user
information in browser localStorage.

## AI Chat Flow

```text
React Frontend
      |
      v
POST /api/chat
      |
      v
chatController
      |
      v
chatService
      |
      v
Ollama
      |
      v
llama3.1:8b
      |
      v
AI Response
      |
      v
Frontend
```

Ollama runs locally and the Express backend acts as the API layer between the
frontend and Ollama. The frontend first calls `GET /api/chat/status`. When a
chat request is made, `chatService` validates the messages, sends a
non-streaming request to Ollama, validates the returned message content, and
normalizes the response to `{ text, done, model }`.

If Ollama is unavailable, the frontend uses its basic-mode fallback response.
The frontend also uses `AbortController` to cancel an active request.

## Medication Interaction Flow

```text
POST /api/interactions/check
             |
             v
interactionController
             |
             v
interactionService
             |
       +-----+-----+
       |           |
       v           v
    OpenFDA   Internal Rules
```

`interactionService` preserves the existing interaction algorithm. It:

- Normalizes medication names.
- Handles aliases such as `paracetamol`, `tylenol`, and `crocin`.
- Removes duplicate medications.
- Uses an in-memory cache for OpenFDA label results.
- Queries OpenFDA when a normalized medication is not cached.
- Collects candidate generic, brand, and substance names.
- Compares every unique medication pair.
- Detects mentions in FDA interaction text.
- Applies `INTERNAL_INTERACTIONS` fallback rules when needed.
- Classifies interaction severity.
- Determines whether the response source is OpenFDA, internal, or mixed.
- Returns the existing `interactions` and `source` response structure.

## Symptom Checker

The symptom checker is a deterministic rule-based system, not an AI
diagnostic model.

It asks for:

- Primary symptom.
- Duration.
- Severity.
- Related symptoms.
- Existing conditions.

The frontend rules classify the result as `LOW`, `MEDIUM`, or `URGENT`. For
example, chest/breathing/stroke keywords or severe severity produce an urgent
classification. Longer duration, moderate severity, or relevant conditions can
produce a medium classification. The result is then added to the current chat
as a summary.

## Data Storage

```text
MongoDB
└── User accounts

Browser localStorage
├── Authentication token
├── Active user
├── Health profile
├── Chat history
├── Current chat session
└── Theme
```

**Chat history and health profile data are currently stored in browser
localStorage, not MongoDB.**

The MongoDB `User` model contains:

- `name`
- `email`
- bcrypt password hash
- `created_at`
- `privacyResetRequired`

The main browser storage keys include:

- `medicalAI_auth_token`
- `medicalAI_active_user`
- `medicalAI_profile_<email>`
- `medicalAI_history_<email>`
- `chat_current_session_<email>`
- `chat_current_session_id_<email>`
- `medicalAI_theme`

## API Reference

The frontend development server proxies `/api` requests to the backend at
`http://localhost:5000`.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register a user and return a JWT |
| `POST` | `/api/auth/login` | Verify credentials and return a JWT |
| `GET` | `/api/auth/profile` | Verify the JWT in the `Authorization` header |
| `POST` | `/api/auth/change-password` | Change a password and schedule privacy cleanup |
| `POST` | `/api/auth/ack-privacy-reset` | Clear the privacy-reset flag |

### Chat

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/chat/status` | Check Ollama availability and available models |
| `POST` | `/api/chat` | Send messages to Ollama and return a normalized response |

### Medication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/interactions/check` | Check medication pairs using OpenFDA and fallback rules |

These are the implemented endpoints. There are no `/api/chat/history` or
`/api/chat/save` backend endpoints; chat history is managed by the frontend
through localStorage.

## Installation and Running

### Prerequisites

- Node.js and npm.
- MongoDB running locally or an accessible MongoDB deployment.
- Ollama installed and running locally for full AI functionality.
- The `llama3.1:8b` model available in Ollama.

### Backend

```bash
cd backend
npm install
node server.js
```

The backend listens on `http://localhost:5000` by default.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000` and proxies API requests to the
backend.

### Ollama model

```bash
ollama pull llama3.1:8b
```

### Production frontend build

```bash
cd frontend
npm run build
```

### Tests

```bash
cd frontend
npm test
```

The backend package currently has no configured automated test suite. Its
`npm test` script reports that no tests are specified.

### Development database reset

```bash
cd backend
node resetDb.js
```

This deletes all user documents from the MongoDB `users` collection. Use it
only for development.

## Environment Variables

Create `backend/.env` locally. Do not commit it.

```env
MONGO_URI=mongodb://localhost:27017/medical_ai
JWT_SECRET=your_secret_here
PORT=5000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

The backend uses these variables as follows:

- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: JWT signing and verification secret.
- `PORT`: Express server port.
- `OLLAMA_BASE_URL`: Ollama server base URL.
- `OLLAMA_MODEL`: Default Ollama model.

The code has development fallbacks for some values, but production deployments
should provide explicit secure values.

## Security

### Implemented

- Passwords are hashed with `bcryptjs` before storage.
- Password comparison uses bcrypt verification.
- JWTs are generated for authenticated users.
- JWTs expire after five days.
- A privacy-reset flag can trigger cleanup of browser-local data after a
  password change.
- `.env` files are excluded through `.gitignore`.

### Current limitations

- JWT tokens are stored in browser localStorage.
- Authentication middleware is not consistently applied to every endpoint.
- A development fallback JWT secret exists in the code.
- There is no rate limiting.
- There is no request-schema validation library.
- CORS is globally enabled by the backend.
- Chat history and profile data are browser-local rather than server-managed.

## Architecture Improvements

### Before

```text
Routes
  ↓
Business Logic
  ↓
Database / External APIs
```

### After

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
MongoDB
```

External integrations are handled by services:

```text
Services
├── Ollama
└── OpenFDA
```

The refactor improves:

- Separation of concerns.
- Maintainability.
- Testability.
- Code organization.
- Reusability.
- Clarity of database and external-service boundaries.

Routes now focus on endpoint definitions, controllers focus on HTTP concerns,
services contain business logic, and the user repository isolates Mongoose
operations.

## Project Limitations and Future Improvements

The following are future improvements, not current functionality:

- Move chat history from localStorage to MongoDB.
- Add Conversation and Profile models if server-side persistence is required.
- Add reusable JWT authentication middleware.
- Improve request validation.
- Add backend automated tests.
- Add rate limiting.
- Remove the unsafe development JWT fallback secret.
- Configure production-safe CORS.
- Add Docker and deployment configuration.
- Add CI/CD.
- Use persistent or distributed caching for OpenFDA data.
- Add stronger observability, structured logging, and production monitoring.

## Medical Disclaimer

This project is intended for educational and general health-information
purposes only. It is not a substitute for professional medical diagnosis,
treatment, or advice. For urgent or serious symptoms, contact an appropriate
healthcare professional or emergency service.

## Documentation

The repository also contains research papers and design documentation in
`Research-Papers/`, along with project notes and the presentation file
`10_Minute_Medical_AI_Pitch.txt`.
