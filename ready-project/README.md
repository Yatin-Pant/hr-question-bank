# 🧠 HR Interview Question Bank

A full-stack web application that helps HR teams store, search, filter, and discover interview questions efficiently — with AI-powered natural language search using Claude API.

---

## 🎯 Problem Statement

HR teams manage hundreds of interview questions across different roles and experience levels, but have no centralized place to store and retrieve them. This leads to:
- Difficulty recalling the right questions during interviews
- No way to filter by role, experience, or technology
- Manual effort to find relevant questions for each candidate

## ✅ Solution

A clean web application where HR can:
- Store all questions with metadata (role, YOE, technology, difficulty)
- Filter questions instantly using multiple criteria
- Upload questions in bulk via CSV
- Search using plain English powered by Claude AI

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Smart Filtering** | Filter by Role, Years of Experience, Technology, Difficulty, and Keyword |
| 📋 **Question Cards** | View all questions in expandable cards with full metadata |
| ➕ **Add Questions** | Add individual questions via a clean modal form |
| 📤 **CSV Upload** | Bulk import questions by uploading a CSV file |
| ⬇️ **CSV Template** | Download a pre-formatted template to guide HR teams |
| ✨ **AI Search** | Natural language search powered by Anthropic Claude API |
| 🗑️ **Delete Questions** | Remove any question with one click |

---

## 🤖 AI Search — Bonus Feature

HR can type queries in plain English and Claude finds the most relevant questions.

**Example queries:**
- *"Give me hard questions for a Kubernetes engineer with 5-8 years experience"*
- *"Easy frontend questions for freshers"*
- *"System design questions for senior engineers"*

**How it works:**
1. All questions with metadata are sent to Claude API as context
2. Claude returns only matching question IDs (not text — prevents hallucination)
3. Frontend filters the local array using those IDs
4. Results display instantly

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 (Hooks) | Component-based UI, reactive filtering |
| Backend | Node.js + Express.js | Lightweight REST API |
| CSV Parsing | csv-parse + Multer | Streaming CSV with file upload handling |
| AI Search | Anthropic Claude API | Natural language question discovery |
| Unique IDs | uuid v4 | Unique question identifiers without a DB |
| Storage | In-memory JS Array | Zero-setup prototype (easily replaceable) |

---

## 📁 Project Structure

```
hr-question-bank/
├── backend/
│   ├── server.js          ← Express REST API (all 5 routes)
│   └── package.json       ← Backend dependencies
│
├── frontend/
│   ├── public/
│   │   └── index.html     ← HTML entry point
│   ├── src/
│   │   ├── App.js         ← Main React component (entire frontend)
│   │   └── index.js       ← React DOM render entry
│   └── package.json       ← Frontend dependencies
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (LTS version) — **install this first**
- npm (comes with Node.js automatically)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hr-question-bank.git
cd hr-question-bank
```

---

### Step 2 — Start the Backend

Open a terminal and run:

```bash
cd backend
npm install
node server.js
```

You should see:
```
✅  HR Question Bank API running on http://localhost:3001
```

---

### Step 3 — Start the Frontend

Open a **new terminal** (keep backend running) and run:

```bash
cd frontend
npm install
npm start
```

Browser opens automatically at **http://localhost:3000** 🎉

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/questions` | Get all questions (supports filters via query params) |
| `GET` | `/api/meta` | Get all unique roles and technologies (for dropdowns) |
| `POST` | `/api/questions` | Add a new question |
| `POST` | `/api/upload` | Bulk import questions via CSV file |
| `DELETE` | `/api/questions/:id` | Delete a question by ID |

### Filter Query Parameters

```
/api/questions?role=DevOps Engineer&yoe=5&difficulty=Hard&technology=Kubernetes
```

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Exact role match |
| `yoe` | number | Must fall within question's yoe_min and yoe_max |
| `technology` | string | Match any technology tag |
| `difficulty` | string | Easy / Medium / Hard / Expert |
| `search` | string | Keyword search across question, role, and tags |

---

## 📋 CSV Format

```csv
question,role,technology,yoe_min,yoe_max,difficulty
"Explain Docker networking modes",DevOps Engineer,Docker|Kubernetes,3,6,Medium
"What is memoization?",Frontend Engineer,JavaScript|React,1,4,Easy
"Design a URL shortener",System Design,System Design|Redis,5,10,Hard
```

> ⚠️ Use `|` (pipe) to separate multiple technologies

| Column | Required | Example |
|--------|----------|---------|
| question | ✅ Yes | Explain CAP theorem |
| role | ✅ Yes | Backend Engineer |
| technology | Optional | Kubernetes\|Docker |
| yoe_min | Optional | 3 |
| yoe_max | Optional | 7 |
| difficulty | Optional | Medium |

---

## 💡 Assumptions & Tradeoffs

**In-Memory Storage** — Used a JavaScript array instead of a database for zero setup. Data resets on server restart. Production fix: swap array with MongoDB/PostgreSQL, only the data layer changes.

**No Authentication** — Assumes trusted HR users. Production fix: add JWT with HR admin roles.

**AI Returns IDs Only** — Claude is instructed to return only question IDs, not text. Prevents hallucination, keeps response small and parseable.

**Client-Side Filtering** — Works well up to ~10,000 questions. For larger scale, add database indexes and move filtering to SQL queries.

---

## 🔮 Future Improvements

- [ ] MongoDB/PostgreSQL for persistent storage
- [ ] JWT authentication with HR admin roles
- [ ] Pagination for large question sets
- [ ] Vector embeddings for faster AI search at scale
- [ ] Export filtered questions as PDF

---

## 👨‍💻 Author

**Yatin** — MCA Final Year Student

> *AI tools were used to assist in development as permitted. All architectural decisions and code understanding are my own.*
