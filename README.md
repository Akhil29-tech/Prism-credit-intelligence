# 🔷 PRISM — Predictive Risk Intelligence & Scoring Model — Full Stack Setup
### *"See credit risk from every angle"*

A banking-grade AI credit risk intelligence platform featuring explainable ML, what-if simulation, and algorithmic fairness auditing — aligned with EU AI Act 2024 and RBI Responsible AI Guidelines.

## 🚀 6 Modules

### 🏠 Executive Dashboard
Real-time portfolio KPIs — total applications, approval rate, default rate by purpose, income distribution, age-group analysis, and model performance summary table.

### 🔍 Smart EDA
Auto-generated plain-English insights + 4 analysis tabs — distributions, financial patterns, demographic breakdown, and correlation heatmap.

### 🤖 Model Arena
4 ML models trained and compared simultaneously — Logistic Regression, Random Forest, XGBoost, SVM. Radar chart, metric bars, confusion matrices, and feature importance.

### 🎯 Risk Predictor
Enter any applicant's details → get instant CIBIL-style score (300-900), default probability, approval decision, and SHAP waterfall chart explaining WHY the decision was made.

### 💡 What-If Simulator
Pick any variable (income, loan amount, credit history) → see how risk score and CIBIL score change in real time. Best-case scenario recommendation included.

### ⚖️ BiasScan — AI Fairness Auditor
Detects algorithmic bias across gender, marital status, and employment type. 3 industry-standard fairness metrics — Disparate Impact, Demographic Parity, Equal Opportunity. EU AI Act & RBI compliance check.

## Project Structure
```
prism_react/
├── backend/
│   ├── api.py          ← Flask ML API
│   └── requirements.txt
└── frontend/
    ├── public/index.html
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.js
        ├── index.css
        ├── components/Sidebar.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── EDA.jsx
            ├── ModelArena.jsx
            ├── Predictor.jsx
            ├── WhatIf.jsx
            └── BiasScan.jsx
```

## Run Locally

### Terminal 1 — Flask Backend
```bash
cd backend
pip install -r requirements.txt
python3 api.py
# Runs on http://localhost:5001
```

### Terminal 2 — React Frontend
```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

Note: Make sure PRISM models are already trained (run python3 train.py from the prism folder first)

---

## ⚖️ Regulatory Alignment

- 🇪🇺 **EU AI Act 2024** — Explainability + fairness for high-risk credit AI
- 🇮🇳 **RBI Responsible AI Guidelines 2024** — Model explainability for credit decisions
- 🌍 **Equal Credit Opportunity Act** — No discrimination by gender, age, marital status

---