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
