# FinSight README

````markdown
# FinSight

> Smart, privacy-first spending insights and budgeting—built for speed during Google Hackathon.

![FinSight](https://img.shields.io/badge/FinSight-Finance%20Insights-6C5CE7)
![Build](https://img.shields.io/github/actions/workflow/status/bsujalnaik/GoogleHackathon/ci.yml?label=CI)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Issues](https://img.shields.io/github/issues/bsujalnaik/GoogleHackathon)

FinSight helps you understand where your money goes, categorize transactions automatically, set budgets, and get actionable tips to save more. Import SMS/CSV/receipt data and get clean visualizations, summaries, and forecasts. Designed with a lightweight stack so it’s easy to deploy and extend.

---

## ✨ Key Features

- **Auto-categorization** of expenses (rules + ML fallback)
- **Dashboards**: monthly burn, category split, recurring subscriptions
- **Budgets & alerts**: set caps per category; get notified when at risk
- **Forecasts**: simple cash-flow trend and upcoming bills estimate
- **Data import**: CSV (bank exports), SMS (parsed text), receipts (OCR-ready)
- **Privacy-first**: local processing by default; cloud optional
- **Export**: CSV / JSON snapshots for tax or analysis

---

## 🏗️ Architecture

```mermaid
flowchart LR
  A[Client (React/Vite)] -- REST/JSON --> B[API (FastAPI)]
  B -- ORM --> C[(PostgreSQL)]
  B -- Cache --> D[(Redis)]
  B -- Optional --> E[Vertex AI / Local ML]
  B -- Optional --> F[Cloud Vision OCR]
  A <--> G[Auth (JWT)]
````

---

## 🧰 Tech Stack

* **Frontend:** React + Vite, TypeScript, Tailwind
* **Backend:** FastAPI (Python), Pydantic, SQLAlchemy
* **DB/Cache:** PostgreSQL, Redis
* **Auth:** JWT (access + refresh)
* **Cloud (optional):** Google Cloud Run, Cloud SQL, Vertex AI, Cloud Vision
* **CI/CD:** GitHub Actions
* **Packaging:** Docker / Docker Compose
* **Testing:** Pytest, Vitest

---

## 📁 Repository Structure

```
GoogleHackathon/
├─ frontend/           # React app (Vite, TS, Tailwind)
├─ backend/            # FastAPI app, models, services, routers
├─ infra/              # Docker, compose, IaC stubs
├─ data/               # Sample CSV/SMS receipts (sanitized)
├─ scripts/            # One-off utilities, loaders
└─ .github/workflows/  # CI/CD pipelines
```

---

## 🚀 Quick Start (Local)

### 1) Prerequisites

* Node 18+
* Python 3.11+
* PostgreSQL 14+ and Redis (or use Docker)
* (Optional) Google Cloud project for OCR/LLM

### 2) Environment

Create `backend/.env`:

```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/finsight
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=change_me
JWT_EXPIRE_MIN=60
# Optional
GOOGLE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/key.json
VERTEX_REGION=us-central1
```

Create `frontend/.env`:

```
VITE_API_BASE=http://localhost:8000
```

### 3) Run with Docker (recommended)

```bash
docker compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000/docs
```

### 4) Or run manually

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -U pip
pip install -r requirements.txt
alembic upgrade head   # if migrations exist
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm i
npm run dev  # http://localhost:5173
```

---

## 📥 Importing Your Data

* **CSV:** Upload bank exports (columns: date, amount, description, type). Sample in `/data/sample.csv`.
* **SMS:** Paste or upload text; rules will extract amounts/merchants if present.
* **Receipts (optional):** Enable OCR to parse totals & merchants from images.

> Tip: Use `scripts/clean_csv.py` to normalize headers before import.

---

## 🔐 Authentication

* Register → Login to get **access** and **refresh** tokens.
* Include `Authorization: Bearer <access>` for API calls.
* Refresh endpoint issues new tokens when access expires.

---

## 🧪 Testing

**Backend**

```bash
cd backend
pytest -q
```

**Frontend**

```bash
cd frontend
npm run test
```

---

## 📚 API

Interactive docs available at `http://localhost:8000/docs`.

Core endpoints:

* `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
* `POST /import/csv`
* `GET /transactions`, `GET /categories`, `POST /rules`
* `GET /insights/summary`, `GET /insights/forecast`
* `POST /budgets`, `GET /budgets`, `GET /alerts`

---

## 🧠 ML & Rules

* **Rules engine:** simple includes/regex → category mapping.
* **ML fallback (optional):** text embedding + classifier (local or Vertex AI Prediction).
* **Retraining:** `scripts/train_classifier.py` using labeled transactions.

---

## ☁️ Deployment (Google Cloud)

1. **Containerize**

   ```bash
   docker build -t gcr.io/$PROJECT_ID/finsight-backend:latest ./backend
   docker build -t gcr.io/$PROJECT_ID/finsight-frontend:latest ./frontend
   ```

2. **Push**

   ```bash
   gcloud auth configure-docker
   docker push gcr.io/$PROJECT_ID/finsight-backend:latest
   docker push gcr.io/$PROJECT_ID/finsight-frontend:latest
   ```

3. **Run**

   ```bash
   gcloud run deploy finsight-api --image gcr.io/$PROJECT_ID/finsight-backend:latest --region us-central1 --allow-unauthenticated
   gcloud run deploy finsight-web --image gcr.io/$PROJECT_ID/finsight-frontend:latest --region us-central1 --allow-unauthenticated
   ```

4. **DB**

   * Use **Cloud SQL (Postgres)**; set `DATABASE_URL` accordingly.
   * Migrate with `alembic upgrade head`.

---

## 🗺️ Roadmap

* Plaid/Bank API connectors
* Multi-currency support
* Shared budgets & household view
* Advanced anomaly detection
* PWA + offline mode
* More importers (PDF bank statements)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: ..."`
4. Push and open a PR

Please follow Conventional Commits and keep PRs focused.

---

## 🧾 License

MIT © 2025 FinSight Contributors

---

## 🙌 Acknowledgments

* Built during **Google Hackathon**
* Inspiration: simplifying personal finance with clear, private insights

---

### 📸 Screenshots (add yours)

```
frontend/public/screenshots/
 ├─ dashboard.png
 ├─ budgets.png
 └─ import.png
```

> After adding images, embed like:
> `![Dashboard](frontend/public/screenshots/dashboard.png)`

```
```
