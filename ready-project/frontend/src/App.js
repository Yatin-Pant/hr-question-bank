import { useState, useEffect, useRef } from "react";

const API = "http://localhost:3001";

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];
const DIFF_COLOR = { Easy: "#22c55e", Medium: "#f59e0b", Hard: "#ef4444", Expert: "#8b5cf6" };
const DIFF_BG    = { Easy: "#dcfce7", Medium: "#fef3c7", Hard: "#fee2e2", Expert: "#ede9fe" };

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = {
  display: "block", width: "100%", padding: "9px 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14,
  marginBottom: 12, boxSizing: "border-box", color: "#18181b",
  outline: "none", fontFamily: "inherit",
};
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#475569",
  marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase",
};

// ── CSV Helper ────────────────────────────────────────────────────────────────
function generateCSVTemplate() {
  return [
    "question,role,technology,yoe_min,yoe_max,difficulty",
    '"Explain Docker networking modes",DevOps Engineer,Docker|Kubernetes,3,6,Medium',
    '"What is memoization and when do you use it?",Frontend Engineer,JavaScript|React,1,4,Easy',
  ].join("\n");
}

// ── Claude AI Search ──────────────────────────────────────────────────────────
async function askClaude(userMessage, allQuestions) {
  const bank = allQuestions
    .map(q => `[ID:${q.id}][${q.role}][${q.difficulty}][YOE:${q.yoe_min}-${q.yoe_max}][Tech:${q.technology.join(",")}] ${q.question}`)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are an HR assistant. Given this question bank:\n${bank}\n\nReturn ONLY a JSON array of matching question IDs. Example: ["id1","id2"]. Nothing else.`,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "[]";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${color}33`,
    }}>{label}</span>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ q, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      background: "#fff", borderRadius: 12, border: "1.5px solid #e8e8f0",
      padding: "16px 20px", marginBottom: 10, cursor: "pointer",
      boxShadow: open ? "0 4px 20px #6366f115" : "0 1px 4px #0001",
      transition: "box-shadow 0.18s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 15, color: "#18181b", lineHeight: 1.45 }}>
            {q.question}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            <Badge label={q.role} color="#6366f1" bg="#eef2ff" />
            <Badge label={q.difficulty} color={DIFF_COLOR[q.difficulty]} bg={DIFF_BG[q.difficulty]} />
            <Badge label={`${q.yoe_min}–${q.yoe_max} YOE`} color="#0891b2" bg="#ecfeff" />
            {q.technology.map(t => <Badge key={t} label={t} color="#475569" bg="#f1f5f9" />)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onDelete(q.id); }} style={{
            border: "none", background: "#fee2e2", color: "#ef4444",
            borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>✕</button>
          <span style={{ fontSize: 16, color: "#6366f1", paddingTop: 4 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0f8", fontSize: 13, color: "#64748b" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><b>Role:</b> {q.role}</div>
            <div><b>Difficulty:</b> {q.difficulty}</div>
            <div><b>YOE Range:</b> {q.yoe_min}–{q.yoe_max} years</div>
            <div><b>Technologies:</b> {q.technology.join(", ")}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Question Modal ────────────────────────────────────────────────────────
function AddModal({ onAdd, onClose, roles }) {
  const [form, setForm] = useState({ question: "", role: "", customRole: "", tech: "", yoe_min: 0, yoe_max: 5, difficulty: "Medium" });

  const submit = async () => {
    if (!form.question.trim()) return alert("Question is required");
    const role = form.customRole.trim() || form.role;
    if (!role) return alert("Role is required");
    const technology = form.tech.split(",").map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: form.question, role, technology, yoe_min: form.yoe_min, yoe_max: form.yoe_max, difficulty: form.difficulty }),
      });
      const q = await res.json();
      onAdd(q);
      onClose();
    } catch { alert("Could not connect to backend. Is it running?"); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0008", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 520, maxWidth: "95vw", boxShadow: "0 20px 60px #0003", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 18px", fontSize: 19, color: "#18181b" }}>➕ Add New Question</h2>

        <label style={lbl}>Question *</label>
        <textarea rows={3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
          style={{ ...inp, resize: "vertical" }} placeholder="Type the interview question..." />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Role (select)</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
              <option value="">-- Select Role --</option>
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Or Type New Role</label>
            <input value={form.customRole} onChange={e => setForm({ ...form, customRole: e.target.value })} style={inp} placeholder="e.g. ML Engineer" />
          </div>
          <div>
            <label style={lbl}>YOE Min</label>
            <input type="number" min={0} value={form.yoe_min} onChange={e => setForm({ ...form, yoe_min: e.target.value })} style={inp} />
          </div>
          <div>
            <label style={lbl}>YOE Max</label>
            <input type="number" min={0} value={form.yoe_max} onChange={e => setForm({ ...form, yoe_max: e.target.value })} style={inp} />
          </div>
        </div>

        <label style={lbl}>Difficulty</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setForm({ ...form, difficulty: d })} style={{
              flex: 1, border: `2px solid ${form.difficulty === d ? DIFF_COLOR[d] : "#e2e8f0"}`,
              background: form.difficulty === d ? DIFF_BG[d] : "#fff",
              color: form.difficulty === d ? DIFF_COLOR[d] : "#64748b",
              borderRadius: 8, padding: "7px 2px", cursor: "pointer", fontWeight: 700, fontSize: 12,
            }}>{d}</button>
          ))}
        </div>

        <label style={lbl}>Technologies (comma-separated)</label>
        <input value={form.tech} onChange={e => setForm({ ...form, tech: e.target.value })}
          style={inp} placeholder="e.g. React, Node.js, Docker" />

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={submit} style={{ flex: 1, background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Save Question
          </button>
          <button onClick={onClose} style={{ flex: 1, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [questions, setQuestions]   = useState([]);
  const [meta, setMeta]             = useState({ roles: [], technologies: [] });
  const [filters, setFilters]       = useState({ search: "", role: "", technology: "", yoe: "", difficulty: "" });
  const [tab, setTab]               = useState("browse");
  const [showAdd, setShowAdd]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [aiQuery, setAiQuery]       = useState("");
  const [aiResults, setAiResults]   = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState("");

  const [uploadMsg, setUploadMsg]   = useState("");
  const fileRef = useRef();

  // ── Fetch questions from backend ──────────────────────────────────────────
  const fetchQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.role)       params.set("role", filters.role);
      if (filters.yoe)        params.set("yoe", filters.yoe);
      if (filters.technology) params.set("technology", filters.technology);
      if (filters.difficulty) params.set("difficulty", filters.difficulty);
      if (filters.search)     params.set("search", filters.search);

      const res = await fetch(`${API}/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setError("⚠️ Cannot connect to backend. Make sure you ran: cd backend → node server.js");
    }
    setLoading(false);
  };

  const fetchMeta = async () => {
    try {
      const res = await fetch(`${API}/api/meta`);
      const data = await res.json();
      setMeta(data);
    } catch {}
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchQuestions(); }, [filters]);

  const handleDelete = async (id) => {
    await fetch(`${API}/api/questions/${id}`, { method: "DELETE" });
    setQuestions(prev => prev.filter(q => q.id !== id));
    fetchMeta();
  };

  const handleAdd = (q) => {
    setQuestions(prev => [q, ...prev]);
    fetchMeta();
  };

  // ── CSV Upload ────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadMsg("Uploading...");
    try {
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
      const data = await res.json();
      setUploadMsg(`✅ Imported ${data.imported} questions!${data.errors?.length ? ` (${data.errors.length} rows skipped)` : ""}`);
      fetchQuestions();
      fetchMeta();
    } catch {
      setUploadMsg("❌ Upload failed. Make sure backend is running.");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([generateCSVTemplate()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "question_bank_template.csv";
    a.click();
  };

  // ── AI Search ─────────────────────────────────────────────────────────────
  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiError(""); setAiResults(null);
    try {
      const allRes = await fetch(`${API}/api/questions`);
      const allData = await allRes.json();
      const ids = await askClaude(aiQuery, allData.questions);
      setAiResults(allData.questions.filter(q => ids.includes(q.id)));
    } catch { setAiError("AI search failed. Check your internet connection."); }
    setAiLoading(false);
  };

  // ── Tab style ─────────────────────────────────────────────────────────────
  const tabBtn = (active) => ({
    padding: "10px 22px", border: "none", borderRadius: 8, cursor: "pointer",
    fontWeight: 700, fontSize: 14, fontFamily: "inherit",
    background: active ? "#6366f1" : "transparent",
    color: active ? "#fff" : "#c7d2fe", transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", paddingBottom: 0, boxShadow: "0 4px 24px #6366f130" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                🧠 HR Question Bank
              </h1>
              <p style={{ margin: "4px 0 0", color: "#c7d2fe", fontSize: 14 }}>
                {questions.length} questions · Search, filter & AI-powered discovery
              </p>
            </div>
            <button onClick={() => setShowAdd(true)} style={{
              background: "#fff", color: "#6366f1", border: "none", borderRadius: 10,
              padding: "10px 20px", fontWeight: 800, fontSize: 14, cursor: "pointer",
              boxShadow: "0 2px 8px #0002", fontFamily: "inherit",
            }}>+ Add Question</button>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#ffffff22", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {[["browse", "📋 Browse"], ["ai", "✨ AI Search"], ["upload", "📤 Upload CSV"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={tabBtn(tab === key)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#dc2626", fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ─────────── BROWSE TAB ─────────── */}
        {tab === "browse" && (
          <>
            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #e8e8f0", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 130px", gap: 12 }}>
              <div>
                <label style={lbl}>Search</label>
                <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
                  style={{ ...inp, marginBottom: 0 }} placeholder="Keyword..." />
              </div>
              <div>
                <label style={lbl}>Role</label>
                <select value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })} style={{ ...inp, marginBottom: 0 }}>
                  <option value="">All Roles</option>
                  {meta.roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Technology</label>
                <select value={filters.technology} onChange={e => setFilters({ ...filters, technology: e.target.value })} style={{ ...inp, marginBottom: 0 }}>
                  <option value="">All Technologies</option>
                  {meta.technologies.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Years of Experience</label>
                <input type="number" min={0} value={filters.yoe} onChange={e => setFilters({ ...filters, yoe: e.target.value })}
                  style={{ ...inp, marginBottom: 0 }} placeholder="e.g. 5" />
              </div>
              <div>
                <label style={lbl}>Difficulty</label>
                <select value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })} style={{ ...inp, marginBottom: 0 }}>
                  <option value="">All</option>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              {DIFFICULTIES.map(d => {
                const count = questions.filter(q => q.difficulty === d).length;
                return (
                  <div key={d} style={{ background: "#fff", border: `1.5px solid ${DIFF_COLOR[d]}33`, borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: DIFF_COLOR[d], display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{d}:</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: DIFF_COLOR[d] }}>{count}</span>
                  </div>
                );
              })}
              <span style={{ marginLeft: "auto", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                Showing {questions.length} questions
              </span>
              {(filters.role || filters.yoe || filters.technology || filters.search || filters.difficulty) && (
                <button onClick={() => setFilters({ search: "", role: "", technology: "", yoe: "", difficulty: "" })}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, color: "#6366f1", fontSize: 13, fontFamily: "inherit" }}>
                  Clear Filters ✕
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 16 }}>Loading questions...</div>
            ) : questions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>No questions match your filters</p>
              </div>
            ) : (
              questions.map(q => <QuestionCard key={q.id} q={q} onDelete={handleDelete} />)
            )}
          </>
        )}

        {/* ─────────── AI SEARCH TAB ─────────── */}
        {tab === "ai" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)", border: "1.5px solid #c4b5fd", borderRadius: 14, padding: 24, marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
              <h2 style={{ margin: "0 0 6px", color: "#4c1d95", fontSize: 20 }}>AI-Powered Question Discovery</h2>
              <p style={{ color: "#7c3aed", margin: 0, fontSize: 14 }}>Ask in plain English — Claude will find the most relevant questions</p>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAISearch()}
                style={{ ...inp, marginBottom: 0, flex: 1, fontSize: 15, padding: "12px 16px" }}
                placeholder="e.g. Give me hard questions for a Kubernetes engineer with 5-8 years experience" />
              <button onClick={handleAISearch} disabled={aiLoading} style={{
                background: "#6366f1", color: "#fff", border: "none", borderRadius: 10,
                padding: "12px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                opacity: aiLoading ? 0.7 : 1, whiteSpace: "nowrap", fontFamily: "inherit",
              }}>{aiLoading ? "Searching..." : "Ask AI →"}</button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                "Hard questions for DevOps with 6 years experience",
                "Easy frontend questions for freshers",
                "System design questions for senior engineers",
                "Kubernetes questions for 5-8 YOE",
              ].map(s => (
                <button key={s} onClick={() => setAiQuery(s)} style={{
                  background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20,
                  padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#475569",
                  fontWeight: 600, fontFamily: "inherit",
                }}>{s}</button>
              ))}
            </div>

            {aiError && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 16px", color: "#dc2626", marginBottom: 16, fontWeight: 600 }}>{aiError}</div>}

            {aiResults && (
              <div>
                <div style={{ marginBottom: 14, fontWeight: 700, color: "#6366f1", fontSize: 15 }}>
                  ✅ Found {aiResults.length} matching question{aiResults.length !== 1 ? "s" : ""}
                </div>
                {aiResults.length === 0
                  ? <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}><div style={{ fontSize: 40 }}>🤔</div><p>No matches. Try rephrasing your query.</p></div>
                  : aiResults.map(q => <QuestionCard key={q.id} q={q} onDelete={handleDelete} />)
                }
              </div>
            )}
          </div>
        )}

        {/* ─────────── UPLOAD TAB ─────────── */}
        {tab === "upload" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8e8f0", padding: 24 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "#18181b" }}>📤 Upload CSV File</h3>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Upload a CSV with your questions. Download the template below for the correct format.</p>
              <div style={{ border: "2px dashed #c7d2fe", borderRadius: 12, padding: "30px", textAlign: "center", cursor: "pointer", background: "#f8f7ff", marginBottom: 16 }}
                onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
                <p style={{ margin: 0, fontWeight: 700, color: "#6366f1" }}>Click to select CSV file</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>question, role, technology, yoe_min, yoe_max, difficulty</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
              {uploadMsg && (
                <div style={{ background: uploadMsg.startsWith("✅") ? "#dcfce7" : uploadMsg === "Uploading..." ? "#eef2ff" : "#fee2e2", border: `1px solid ${uploadMsg.startsWith("✅") ? "#86efac" : "#c7d2fe"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: uploadMsg.startsWith("✅") ? "#16a34a" : "#6366f1" }}>
                  {uploadMsg}
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8e8f0", padding: 24 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, color: "#18181b" }}>📋 CSV Format Guide</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                <thead>
                  <tr style={{ background: "#f8f7ff" }}>
                    {["Column", "Required", "Example"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #e8e8f0", color: "#475569", fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["question", "✅ Yes", "Explain CAP theorem"],
                    ["role", "✅ Yes", "Backend Engineer"],
                    ["technology", "Optional", "Kubernetes|Docker"],
                    ["yoe_min", "Optional", "3"],
                    ["yoe_max", "Optional", "7"],
                    ["difficulty", "Optional", "Medium"],
                  ].map(([col, req, ex]) => (
                    <tr key={col}>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace", color: "#6366f1", fontWeight: 700 }}>{col}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9" }}>{req}</td>
                      <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: 12 }}>{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>
                💡 Use <code>|</code> (pipe) to separate multiple technologies
              </p>
              <button onClick={downloadTemplate} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                ⬇ Download Template CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddModal onAdd={handleAdd} onClose={() => setShowAdd(false)} roles={meta.roles} />}
    </div>
  );
}
