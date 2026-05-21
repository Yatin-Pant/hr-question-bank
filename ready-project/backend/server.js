const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("csv-parse");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── In-memory question store ──────────────────────────────────────────────────
let questions = [
  { id: uuidv4(), question: "What is the difference between a process and a thread?", role: "Backend Engineer", technology: ["OS Concepts", "System Design"], yoe_min: 0, yoe_max: 2, difficulty: "Easy" },
  { id: uuidv4(), question: "Explain the CAP theorem and give a real-world example.", role: "Backend Engineer", technology: ["Distributed Systems", "System Design"], yoe_min: 3, yoe_max: 5, difficulty: "Medium" },
  { id: uuidv4(), question: "How does Kubernetes handle pod scheduling? Explain taints and tolerations.", role: "DevOps Engineer", technology: ["Kubernetes", "Docker"], yoe_min: 5, yoe_max: 8, difficulty: "Hard" },
  { id: uuidv4(), question: "What is a Kubernetes Operator and when would you build one?", role: "DevOps Engineer", technology: ["Kubernetes"], yoe_min: 7, yoe_max: 12, difficulty: "Expert" },
  { id: uuidv4(), question: "Explain the virtual DOM and how React reconciliation works.", role: "Frontend Engineer", technology: ["React", "JavaScript"], yoe_min: 2, yoe_max: 5, difficulty: "Medium" },
  { id: uuidv4(), question: "What are React hooks and why were they introduced?", role: "Frontend Engineer", technology: ["React"], yoe_min: 1, yoe_max: 3, difficulty: "Easy" },
  { id: uuidv4(), question: "Describe your approach to designing a rate limiter at scale.", role: "System Design", technology: ["System Design", "Redis"], yoe_min: 5, yoe_max: 10, difficulty: "Hard" },
  { id: uuidv4(), question: "What is OIDC and how does it differ from OAuth 2.0?", role: "Backend Engineer", technology: ["Security", "Auth"], yoe_min: 3, yoe_max: 6, difficulty: "Medium" },
  { id: uuidv4(), question: "Walk me through a CI/CD pipeline you have designed from scratch.", role: "DevOps Engineer", technology: ["CI/CD", "GitHub Actions"], yoe_min: 4, yoe_max: 8, difficulty: "Medium" },
  { id: uuidv4(), question: "What is a service mesh? Compare Istio and Linkerd.", role: "DevOps Engineer", technology: ["Kubernetes", "Istio", "Service Mesh"], yoe_min: 6, yoe_max: 12, difficulty: "Expert" },
  { id: uuidv4(), question: "Explain the difference between SQL and NoSQL. When do you choose each?", role: "Backend Engineer", technology: ["Databases", "SQL", "NoSQL"], yoe_min: 1, yoe_max: 3, difficulty: "Easy" },
  { id: uuidv4(), question: "What are CSS specificity rules and how does the cascade work?", role: "Frontend Engineer", technology: ["CSS", "HTML"], yoe_min: 0, yoe_max: 2, difficulty: "Easy" },
  { id: uuidv4(), question: "How would you architect a real-time notification system for 10M users?", role: "System Design", technology: ["System Design", "WebSockets", "Kafka"], yoe_min: 7, yoe_max: 15, difficulty: "Expert" },
  { id: uuidv4(), question: "What is the N+1 query problem and how do you fix it?", role: "Backend Engineer", technology: ["Databases", "ORM"], yoe_min: 2, yoe_max: 5, difficulty: "Medium" },
  { id: uuidv4(), question: "Explain event loop, call stack and microtask queue in JavaScript.", role: "Frontend Engineer", technology: ["JavaScript"], yoe_min: 2, yoe_max: 4, difficulty: "Medium" },
];

// ── Multer for CSV uploads ────────────────────────────────────────────────────
const upload = multer({ dest: "/tmp/" });

// ── GET /api/questions ────────────────────────────────────────────────────────
app.get("/api/questions", (req, res) => {
  let result = [...questions];
  const { role, yoe, technology, search, difficulty } = req.query;

  if (role) result = result.filter(q => q.role.toLowerCase() === role.toLowerCase());
  if (yoe !== undefined && yoe !== "") {
    const y = parseInt(yoe);
    if (!isNaN(y)) result = result.filter(q => y >= q.yoe_min && y <= q.yoe_max);
  }
  if (technology) {
    const tags = technology.split(",").map(t => t.trim().toLowerCase());
    result = result.filter(q => q.technology.some(t => tags.includes(t.toLowerCase())));
  }
  if (difficulty) result = result.filter(q => q.difficulty === difficulty);
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(q =>
      q.question.toLowerCase().includes(s) ||
      q.role.toLowerCase().includes(s) ||
      q.technology.some(t => t.toLowerCase().includes(s))
    );
  }

  res.json({ total: result.length, questions: result });
});

// ── GET /api/meta ─────────────────────────────────────────────────────────────
app.get("/api/meta", (req, res) => {
  const roles = [...new Set(questions.map(q => q.role))].sort();
  const technologies = [...new Set(questions.flatMap(q => q.technology))].sort();
  res.json({ roles, technologies });
});

// ── POST /api/questions ───────────────────────────────────────────────────────
app.post("/api/questions", (req, res) => {
  const { question, role, technology, yoe_min, yoe_max, difficulty } = req.body;
  if (!question || !role) return res.status(400).json({ error: "question and role are required" });

  const newQ = {
    id: uuidv4(),
    question,
    role,
    technology: Array.isArray(technology)
      ? technology
      : (technology || "").split(",").map(t => t.trim()).filter(Boolean),
    yoe_min: parseInt(yoe_min) || 0,
    yoe_max: parseInt(yoe_max) || 99,
    difficulty: difficulty || "Medium",
  };
  questions.unshift(newQ);
  res.status(201).json(newQ);
});

// ── POST /api/upload ──────────────────────────────────────────────────────────
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const results = [];
  const errors = [];
  let row = 1;

  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
    .on("data", (data) => {
      row++;
      if (!data.question || !data.role) { errors.push(`Row ${row}: missing question or role`); return; }
      const tech = (data.technology || "").split("|").map(t => t.trim()).filter(Boolean);
      results.push({
        id: uuidv4(),
        question: data.question,
        role: data.role,
        technology: tech,
        yoe_min: parseInt(data.yoe_min) || 0,
        yoe_max: parseInt(data.yoe_max) || 99,
        difficulty: data.difficulty || "Medium",
      });
    })
    .on("end", () => {
      questions.unshift(...results);
      fs.unlink(req.file.path, () => {});
      res.json({ imported: results.length, errors });
    })
    .on("error", err => res.status(500).json({ error: err.message }));
});

// ── DELETE /api/questions/:id ─────────────────────────────────────────────────
app.delete("/api/questions/:id", (req, res) => {
  const before = questions.length;
  questions = questions.filter(q => q.id !== req.params.id);
  if (questions.length === before) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Deleted" });
});

app.listen(PORT, () => {
  console.log(`\n✅  HR Question Bank API is running!`);
  console.log(`👉  http://localhost:${PORT}\n`);
});
