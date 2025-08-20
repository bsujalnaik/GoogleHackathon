# FinSight

FinSight is a powerful AI-driven financial insights platform designed to analyze, predict, and visualize financial trends. It leverages modern web technologies and cloud services to deliver scalable, fast, and intelligent insights.

---

## ✨ Features

* 📊 Real-time financial data visualization
* 🤖 AI-powered predictions and recommendations
* 🔒 Secure JWT-based authentication
* ☁️ Optional Google Cloud integration
* 🐳 Dockerized for easy deployment
* ✅ CI/CD with GitHub Actions

---

## 🧰 Tech Stack

**Frontend:** React + Vite, TypeScript, Tailwind
**Backend:** FastAPI (Python), Pydantic, SQLAlchemy
**DB/Cache:** PostgreSQL, Redis
**Auth:** JWT (access + refresh)
**Cloud (optional):** Google Cloud Run, Cloud SQL, Vertex AI, Cloud Vision
**CI/CD:** GitHub Actions
**Packaging:** Docker / Docker Compose
**Testing:** Pytest, Vitest

---

## 📁 Repository Structure

```
├── backend/            # FastAPI backend (APIs, models, database)
│   ├── app/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/           # React + Vite + Tailwind frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docker-compose.yml  # Multi-service setup
├── Dockerfile          # Backend Dockerfile
├── README.md           # Project documentation
└── .github/workflows/  # GitHub Actions CI/CD configs
```

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/bsujalnaik/GoogleHackathon.git
cd GoogleHackathon
```

### 2️⃣ Run with Docker Compose

```bash
docker-compose up --build
```

### 3️⃣ Manual Setup

* **Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

* **Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/finsight
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
```

---

## 🧪 Testing

* **Backend:**

```bash
pytest
```

* **Frontend:**

```bash
npm run test
```

---

## 📦 Deployment

* **Docker:** Single or multi-container with `docker-compose`
* **Cloud Run:** Deploy backend using Google Cloud Run
* **Cloud SQL:** Managed PostgreSQL database

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss any major changes.

---

## 📜 License

This project is licensed under the MIT License.
