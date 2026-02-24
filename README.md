# Aegis AI: IT Ticket Resolution Suggestion Engine 🛡️🚀

**HCL Hackathon | Team AsyncNinjas**

Aegis AI is an intelligent, NLP-powered support assistant designed to drastically reduce IT helpdesk response times. By leveraging advanced text similarity algorithms and Generative AI, Aegis provides instant troubleshooting guides to employees and empowers admins with automated knowledge management.

---

## 🌟 Key Features

### 1. 🤖 AI-Powered Instant Fixes
The moment a user describes an issue, Aegis uses a hybrid system (**TF-IDF Similarity + Google Gemini AI**) to:
- Find the **top 3 matching historical tickets** from the database.
- Perform a **Root Cause Analysis** based on past data.
- Generate a consolidated **Expert Fix** for immediate resolution.

### 2. 🧠 Self-Improving Knowledge Loop
Aegis doesn't just suggest; it learns.
- Whenever an Admin resolves a ticket with a new solution, the system **automatically appends** it to the historical dataset (`tickets.csv`).
- The NLP model reloads in real-time, making it smarter for the next similar query.

### 3. 🛡️ Role-Based Access Control (RBAC)
- **Employee Portal**: Dedicated space for raising tickets, viewing history, and receiving instant AI help.
- **Admin Dashboard**: Comprehensive view for ticket management, resolving issues, and adding to the global knowledge base.

### 4. 📊 Live Support Analytics
Admins can track the pulse of their IT department:
- **Avg Resolution Time**: Track speed and target efficiency.
- **Common Issues**: Automated category breakdown to identify recurring bottlenecks.
- **Resolution Rates**: Real-time KPI monitoring.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Vanilla CSS (Rich UI) |
| **Backend** | FastAPI (Python), SQLAlchemy |
| **Database** | SQLite (Primary), CSV (Historical NLP data) |
| **AI/NLP** | Google Gemini 1.5 Flash, Scikit-learn (TF-IDF) |
| **Security** | JWT (JSON Web Tokens), Bcrypt Hashing |

---

## 📂 Project Structure

```text
HCL_HACKATHON_ASYNCNINJAS/
├── backend/
│   ├── main.py           # API Endpoints & Routes
│   ├── nlp.py            # AI Engine & Similarity Search
│   ├── crud.py           # Database Operations
│   ├── models.py         # SQL Alchemy Models
│   ├── schemas.py        # Pydantic Schemas
│   ├── auth.py           # JWT & Bcrypt Logic
│   └── data/
│       └── tickets.csv   # Historical Knowledge Base
├── frontend/
│   ├── src/
│   │   ├── api.js        # API Integration Layer
│   │   ├── components/   # Dashboards, Login, Signup
│   │   └── App.jsx       # Main App Logic
│   └── index.css         # Custom Premium Styling
└── README.md             # Project Documentation
```

---

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Configure `.env` with your `GEMINI_API_KEY` and `JWT_SECRET`.
3. Start the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

## 📈 Business Value
Repetitive IT tickets account for up to **60-70%** of support volume. Aegis AI minimizes manual search time from minutes to **seconds**, saving hundreds of hours per month and allowing engineers to focus on high-impact projects.

---

**Developed with ❤️ by Team AsyncNinjas**
