<p align="center">
  <img src="docs/helio-logo.png" alt="HELIO Logo" width="120" />
</p>

<h1 align="center">🌟 HELIO</h1>
<h3 align="center">Medication Intelligence Platform</h3>
<p align="center">
  An enterprise-grade AI-powered healthcare platform that manages medication schedules, reminds patients, monitors adherence, and bridges doctors, patients, and caregivers in a unified clinical workspace.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0--rc-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-8.x-green?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
 
</p>

---

## 🏥 Vision

HELIO exists to bridge the communication gap between patients and their medication routines. Chronic diseases fail not because of poor prescriptions, but because of poor adherence. HELIO closes this gap with intelligent reminders, real-time monitoring, AI-powered medical intelligence, and direct WhatsApp engagement — all woven into a platform doctors and patients genuinely want to use.

---

## ✨ Features

### Patient Portal
- 📱 **Smart Medication Management** — Add, edit, and track all medications with dosing schedules
- ⏰ **Intelligent Reminder Engine** — Automated reminders via WhatsApp and in-app notifications
- 💬 **WhatsApp Integration** — Interactive dose confirmations via button replies
- 🎤 **Voice Commands** — Natural language dose logging via speech recognition
- 📊 **Adherence Tracking** — Real-time score with historical breakdown
- 📅 **Health Timeline** — Complete chronological care record
- 💊 **Refill Intelligence** — Automatic supply forecasting and refill alerts
- 🤖 **AI Health Assistant** — Contextual medical Q&A powered by Gemini

### Doctor Portal
- 🔗 **Consent-Based Patient Access** — Secure clinical link workflow with patient approval
- 📋 **Prescription Management** — View and update active medication plans
- 📈 **Adherence Reports** — Real-time patient compliance monitoring
- 🔔 **Attention Alerts** — Automatic flags for missed dose patterns
- 📝 **Clinical Notes** — Structured documentation with audit trail

### Medical Intelligence
- 🔬 **OCR Prescription Analysis** — Upload and auto-extract medications from images/PDFs
- 🧠 **AI Entity Extraction** — Gemini-powered dosage, frequency, and timing parsing
- 📄 **Lab Report Processing** — AI-assisted health document interpretation

### Platform Infrastructure
- 🏗️ **Event-Driven Architecture** — Transactional Outbox + Persistent Queue
- 🔄 **Horizontal Worker Scaling** — Configurable via `PROCESS_TYPE` topology
- 🔧 **Circuit Breakers** — Automatic WhatsApp API failure isolation
- 🛡️ **Zero Trust Security** — Server-side validation on every request
- ⚡ **Graceful Shutdowns** — SIGTERM/SIGINT with active job draining

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                React Frontend (Vite)                    │
│    Patient Portal │ Doctor Dashboard │ AI Chat          │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────┐
│              Express.js API Gateway                     │
│  JWT Auth │ Google OAuth │ Rate Limiting │ NoSQL Guard  │
│  Webhook Signature │ Role Middleware │ Consent Gate     │
└────┬───────────────┬────────────────────┬───────────────┘
     │               │                    │
┌────▼────┐    ┌─────▼──────┐    ┌───────▼───────┐
│ Domain  │    │   Queue    │    │    Outbox     │
│Services │    │  Workers   │    │   Publisher   │
└────┬────┘    └─────┬──────┘    └───────┬───────┘
     │               │                    │
┌────▼───────────────▼────────────────────▼───────┐
│              MongoDB Atlas                      │
│  23 Collections │ Compound Indexes │ TTL Rules  │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Vanilla CSS |
| Backend | Node.js v18+, Express.js 5 |
| Database | MongoDB 8 via Mongoose |
| Authentication | Passport.js (JWT + Google OAuth 2.0) |
| AI Services | Google Gemini 1.5 Flash |
| Messaging | Meta WhatsApp Cloud API |
| Security | Helmet, express-mongo-sanitize, express-rate-limit |
| Queue | Custom MongoDB persistent queue |

---

## 🚀 Installation

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB (local) or MongoDB Atlas account
- Google Cloud Console project (for OAuth)

### Clone & Install
```bash
git clone https://github.com/your-org/helio.git
cd helio

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

---

## 🏃 Running Locally

### 1. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Backend
```bash
cd backend
npm start
# or for development with hot reload:
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
# Vite dev server starts at http://localhost:5173
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (use strong random value) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret |
| `GEMINI_API_KEY` | ✅ | Google Gemini API Key |
| `CLIENT_URL` | ✅ | Frontend URL (for CORS/OAuth redirect) |
| `PORT` | Optional | Server port (default: 5000) |
| `PROCESS_TYPE` | Optional | `api` / `worker` / `scheduler` / `all` |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp | Meta Graph API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp | Meta Phone Number ID |
| `WHATSAPP_APP_SECRET` | WhatsApp | For webhook HMAC validation |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp | Webhook challenge token |

---

## 📁 Folder Structure

```
helio/
├── backend/
│   ├── config/               # DB, Passport, env validator, health check
│   ├── controllers/          # HTTP request handlers
│   ├── middleware/           # Auth, consent, security, error handling
│   ├── models/               # 23 Mongoose schemas
│   ├── repositories/         # Data access layer
│   ├── routes/               # Express route definitions
│   ├── services/             # Domain & infrastructure services
│   │   └── medication/       # Core medication engine services
│   ├── tests/                # Integration & unit test suites
│   ├── validators/           # Input validation schemas
│   ├── worker.js             # Background worker entry point
│   └── server.js             # Application entry point
└── frontend/
    └── src/
        ├── components/       # React UI components
        ├── utils/            # Shared utilities
        ├── App.jsx           # Root router & state
        └── main.jsx          # React entry point
```

---

## 📡 API

Full API documentation is available in the [enterprise_certification_report.md](C:\Users\Admin\.gemini\antigravity-ide\brain\4424a937-9dfc-48eb-bb80-1a3bd05070c0\enterprise_certification_report.md).

### Quick Reference
- `POST /api/auth/login` — Patient/Doctor login
- `GET /api/auth/google` — Google OAuth login
- `GET /api/health/medications` — List medications
- `POST /api/health/take-dose` — Log dose taken
- `GET /api/health/adherence` — Get adherence score
- `GET /api/health-check` — Liveness check

---

## 🐳 Deployment

### Production Deployment

```bash
# Set production environment
export NODE_ENV=production
export PROCESS_TYPE=all
export MONGO_URI=mongodb+srv://...

# Build frontend
cd frontend && npm run build
cp -r dist ../backend/dist

# Start server
cd backend && node server.js
```
## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

All PRs must pass:
- `node tests/adherence.test.js`
- `node tests/orchestration.test.js`
- `node tests/outboxAndQueue.test.js`

---

## 📜 License

MIT License — See `LICENSE` file for details.

---

## 🙏 Acknowledgements

Built with deep respect for patients and healthcare workers. Every design decision in HELIO was made with clinical safety and medication adherence in mind.

- Google Gemini AI for medical intelligence
- Meta WhatsApp Cloud API for patient engagement
- MongoDB for persistent, reliable data storage
- The open source community for foundational libraries
