# 🚀 PRD → Sprint Planner

> **AI-Powered Workflow Automation System** — Convert a feature idea into a structured PRD, engineering tasks, and a dependency-aware sprint plan in seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-orange?style=for-the-badge)](https://ai-sprintrelease-planner.replit.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/smanikanta233/ai-sprint-planner)
[![TypeScript](https://img.shields.io/badge/TypeScript-65%25-3178c6?style=for-the-badge&logo=typescript)](https://github.com/smanikanta233/ai-sprint-planner)
[![Built With](https://img.shields.io/badge/Built%20With-GPT--4o-412991?style=for-the-badge&logo=openai)](https://openai.com)

---

## 📋 What Is This?

PRD → Sprint Planner is a **full-stack AI-powered workflow automation platform** built as part of the AirTribe GenAI Launchpad course (IIT Delhi). It demonstrates how AI can be one component within a larger decision-making pipeline — not just a wrapper around an LLM.

**The core idea:** A product manager or engineer describes a feature idea in plain text. The system generates a complete Product Requirements Document, breaks it into engineering tasks, scores and prioritizes each task using a deterministic logic engine, and allocates them into sprints based on team velocity.

### What makes this different from "just asking ChatGPT"?

> **We do not just display AI output. We run it through a deterministic scoring engine first.**

The Smart Logic Layer (`scoringEngine.ts`) runs after AI generation with zero additional AI calls:
- Normalizes effort to **Fibonacci points only** (1, 2, 3, 5, 8, 13)
- Detects **task dependencies** via keyword scanning + category rules
- Calculates a **documented priority score formula**
- Flags **risk levels** (High/Medium/Low) with explicit rules
- Allocates tasks to **sprints via greedy fill** respecting velocity and dependencies

---

## 🎯 Live Demo

**App URL:** https://ai-sprintrelease-planner.replit.app

**Admin Dashboard:** https://ai-sprintrelease-planner.replit.app/admin

Try generating a PRD with this input:
```
Feature Title: Real-time Notification System
Target User: All platform users
Business Goal: Reduce support tickets by 40% through proactive alerts
Description: Implement real-time push notifications for in-app alerts, 
email digests, and SMS fallback with read/unread state and user preferences
Urgency: High | Complexity: High
```

---

## 🏗️ System Architecture

```
User Input (7-field form)
        │
        ▼
Frontend (React + Vite + TypeScript)
        │  POST /api/prds
        ▼
Backend API (Express.js)
        │  OpenAI GPT-4o call
        ▼
AI Generation Layer
  ├── PRD: title, problem statement, goals
  ├── User Stories: As A / I Want To / So That
  └── Raw Tasks: name, description, category, complexity
        │
        ▼
⚡ Smart Logic Layer (scoringEngine.ts) ← NO AI CALLS
  ├── Rule 1: Effort → Fibonacci normalization
  ├── Rule 2: Dependency detection (keywords + category rules)
  ├── Rule 3: Priority score = (BV×3) + (10-effort) + (deps×-2) + risk_penalty
  ├── Rule 4: Risk flagging (High/Medium/Low)
  └── Rule 5: Sprint allocation (greedy fill + dependency ordering)
        │
        ▼
PostgreSQL Database
  ├── prds table
  ├── tasks table (with scores)
  ├── sprint_config table
  └── admin_logs table
        │
        ▼
Structured Output (3-Tab UI)
  ├── PRD Document (cards)
  ├── Task List (table + color-coded badges)
  └── Sprint Plan (Kanban board)
        │
        ▼
Admin Dashboard (password-gated, server-side auth)
  ├── Real-time stats
  ├── Access log (IP + user agent)
  └── Sprint config editor
```

---

## ✨ Features

### 🎨 Frontend
- **7-field structured input form** — Feature Title, Target User, Business Goal, Description, Deadline, Urgency, Complexity, Constraints
- **3-tab output view** — PRD Document, Task List, Sprint Plan
- **Kanban board** — one column per sprint with dynamic point totals
- **Color-coded risk badges** — 🟢 Low / 🟡 Medium / 🔴 High
- **History sidebar** — all past PRDs clickable, persisted in database
- **Zero raw JSON** — every data point rendered as a structured UI component

### ⚙️ Backend
- `POST /api/prds` — AI generation + logic layer + DB save
- `GET /api/prds` — lightweight PRD list
- `GET /api/prds/:id` — full PRD with tasks ordered by sprint
- `POST /api/admin/login` — server-side auth with session token
- `GET /api/admin/stats` — real-time system statistics
- `GET/PUT /api/admin/sprint-config` — configurable velocity settings

### 🧠 Smart Logic Layer (`server/logic/scoringEngine.ts`)

```typescript
// Rule 3: Priority Score Formula (documented)
priority_score = (business_value_weight * 3)   // keyword overlap with PRD goals
              + (10 - effort_points)             // reward low-effort tasks
              + (dependency_count * -2)          // penalize high-dependency tasks
              + risk_penalty                     // penalize risky tasks

// Rule 4: Risk Flagging
HIGH:   effort >= 8 OR dependency_count >= 2 OR description.wordCount < 10
MEDIUM: effort >= 5 OR dependency_count === 1
LOW:    everything else

// Rule 5: Sprint Allocation
Sort by priority_score DESC → greedy fill to velocity_points → 
dependency-aware push (Task B can't be in earlier sprint than Task A)
```

### 🗄️ Database (PostgreSQL)
| Table | Purpose |
|-------|---------|
| `prds` | Stores all generated PRDs with AI content |
| `tasks` | Engineering tasks with Fibonacci effort, priority score, risk level, sprint number |
| `sprint_config` | Singleton config row — velocity_points (default 20), sprint_length_days (default 14) |
| `admin_logs` | Audit trail — prd_generated, admin_login, admin_login_failed, config_changed events |

### 🔒 Admin Dashboard
- **Real server-side authentication** — password compared via `process.env.ADMIN_PASSWORD`, not frontend check
- **401 Unauthorized** returned on all `/api/admin/*` routes without valid token
- **Stats cards** — total PRDs, high priority workflows, avg priority score, avg effort, avg sprint count
- **Access log** — IP address, user agent, timestamps for all events including failed login attempts
- **Sprint config editor** — change velocity live, affects all new generations immediately

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Express.js + Node.js + TypeScript |
| Database | PostgreSQL (Neon) |
| AI Engine | OpenAI GPT-4o |
| Logic Layer | Custom TypeScript module (zero AI calls) |
| Authentication | Server-side session token + bcrypt |
| Deployment | Replit Deployments |
| Version Control | Git + GitHub |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/smanikanta233/ai-sprint-planner.git
cd ai-sprint-planner

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your keys to .env:
# OPENAI_API_KEY=your_openai_key
# DATABASE_URL=your_postgresql_url
# ADMIN_PASSWORD=your_admin_password

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o generation |
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Admin dashboard password (server-side only) |

---

## 📊 Test Results

All 6 input test cases passed on the live deployed application:

| Test Case | Description | Result |
|-----------|-------------|--------|
| TC-01 | Standard Clean Input — User Auth System | ✅ PASS |
| TC-02 | High Urgency Critical — Notification System | ✅ PASS |
| TC-03 | Low Complexity — Dark Mode Toggle | ✅ PASS |
| TC-04 | Vague/Minimal Input — "Fix bugs" | ✅ PASS |
| TC-05 | Complex Multi-dependency — AI Recommendation Engine | ✅ PASS |
| TC-06 | Special Characters & Emoji — @Mentions #Hashtag | ✅ PASS |

**Logic Layer Verification:**
- ✅ Fibonacci effort only (1,2,3,5,8,13 — never 4,6,7,9,10)
- ✅ Priority scores vary per task (2.0 to 22.0 range verified)
- ✅ HIGH risk correctly triggered on effort≥8 tasks
- ✅ Sprint points dynamic and accurate per sprint
- ✅ Dependency ordering respected (backend→API→frontend in TC-05)
- ✅ Direct API call without auth returns `{"error":"Unauthorized"}`

---

## 📁 Project Structure

```
ai-sprint-planner/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── PRDView.tsx    # PRD document tab
│   │   │   ├── TaskList.tsx   # Task table with risk badges
│   │   │   ├── SprintPlan.tsx # Kanban board
│   │   │   └── Sidebar.tsx    # History sidebar
│   │   ├── pages/
│   │   │   ├── NewPlan.tsx    # Main input form
│   │   │   ├── History.tsx    # Past PRDs list
│   │   │   └── Admin.tsx      # Admin dashboard
│   │   └── lib/
│   │       └── api.ts         # API utility functions
├── server/                    # Express backend
│   ├── routes/
│   │   ├── prds.ts            # PRD generation endpoints
│   │   └── admin.ts           # Admin endpoints (auth-gated)
│   ├── logic/
│   │   └── scoringEngine.ts   # ⚡ Smart Logic Layer (zero AI calls)
│   ├── db/
│   │   └── schema.ts          # PostgreSQL table definitions
│   └── index.ts               # Express app entry point
├── shared/                    # Shared TypeScript types
└── README.md
```

---

## 🔄 Git Commit Progression

| Stage | Commit Message | What Was Built |
|-------|---------------|----------------|
| 1 | `Stage 1: DB schema` | PostgreSQL schema — 4 tables, sprint_config seeded |
| 2 | `Stage 2: Backend API and OpenAI` | All REST endpoints + GPT-4o integration |
| 3 | `Stage 3: Smart Logic Layer` | scoringEngine.ts — all 5 deterministic rules |
| 4 | `Stage 4: Frontend UI` | React app — input form, 3-tab output, Kanban |
| 5 | `Stage 5: Admin dashboard` | Admin auth, stats, access log, config editor |
| 6 | `Stage 6: Polish and deployment` | Error handling, UI polish, Replit deployment |

---

## 🎓 About This Project

Built as Assignment 2 for the **AirTribe GenAI Launchpad** course (IIT Delhi).

**Track:** Tech / Product — PRD → Sprint Planner

**Key architectural principle:** AI generates structured raw material. A deterministic logic engine transforms it into scored, prioritized, sprint-allocated output. The two layers are completely separate — this is not a chatbot.

---

## 👨‍💻 Author

**Manikanta Sakibanda**
- 12+ years in Automation & Reporting (Excel VBA, SQL, Power BI)
- Currently building AI workflow automation skills via AirTribe GenAI Launchpad
- [LinkedIn](https://linkedin.com/in/manikanta-sakibanda) | [GitHub](https://github.com/smanikanta233)

---

*Built with React, Express, PostgreSQL, OpenAI GPT-4o, and a lot of deterministic logic.*
