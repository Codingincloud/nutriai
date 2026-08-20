# NutriAI — AI-Powered Personalized Nutrition Recommendation System



---

## What this is

NutriAI is a personalized nutrition tracking and recommendation system built around Nepali dietary patterns. Most existing nutrition apps use Western food databases — NutriAI uses **NepaliNutriDB**, a custom dataset of 117 traditional Nepali foods (Dal Bhat, Momo, Dhido, Gundruk, Sel Roti, etc.) with full nutritional data.

**Core features:**
- XGBoost + Random Forest recommendation engine (R² = 0.87)
- Daily macro budget tracking — recommendations shift based on what you've already eaten
- Behavioral learning — liked/disliked foods shift future recommendation scores
- 8-week weight trend prediction (linear regression)
- Gemini Flash AI nutrition assistant with user profile context
- BMI / BMR / TDEE auto-calculation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework |
| Auth | JWT (SimpleJWT) |
| ML | XGBoost, scikit-learn (Random Forest) |
| AI | Google Gemini 1.5 Flash |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Database | SQLite (dev) |

---

## Project Structure

```
nutriai/
├── backend/
│   ├── core/              # Django settings, URLs
│   ├── users/             # Auth, profile, BMI/BMR calc
│   ├── nutrition/         # Food model, meal logging, daily/weekly summary
│   ├── recommendations/   # XGBoost + RF scoring engine, feedback
│   │   └── ml/
│   │       ├── train.py   # Retrain models from DB
│   │       └── recommender.py
│   ├── progress/          # Weight history, 8-week prediction
│   ├── assistant/         # Gemini AI chat endpoint
│   ├── .env.example       # Copy to .env and fill in your keys
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/         # Dashboard, FoodLog, Recommendations, Progress, Assistant, About
    │   ├── components/    # Navbar, ChatBot, FoodSearch, MealCard, CalorieRing, MacroChart
    │   └── context/       # AuthContext, ThemeContext (dark/light mode)
    └── package.json
```

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Copy and fill in your keys
cp .env.example .env

python manage.py migrate
python manage.py import_foods   # loads NepaliNutriDB (117 foods)
python manage.py seed_demo_user # creates demo/nutriai123
python manage.py seed_weight_history

# Train the ML models
python recommendations/ml/train.py

python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### Demo login
```
Username: demo
Password: nutriai123
```

---

## ML Model Performance

Trained on NepaliNutriDB + 17 synthetic examples (junk food anchors).

| Metric | XGBoost | Random Forest |
|--------|---------|---------------|
| Accuracy | 0.9630 | 0.9630 |
| Precision | 1.0000 | 1.0000 |
| Recall | 0.7500 | 0.7500 |
| F1-Score | 0.8571 | 0.8571 |
| R² Score | **0.8683** | 0.7683 |
| MAE | 0.0213 | 0.0272 |

**Score range:** XGBoost 6.5%–90.8% across foods (fried snacks low, dals and legumes high).

---

## What's not built

Computer vision food recognition was in the original scope. No labelled Nepali food image dataset exists publicly, so it was deferred. NepaliNutriDB text search covers the same use case adequately for this scope.

---

## Environment variables

Copy `backend/.env.example` to `backend/.env`:

```
SECRET_KEY=your-django-secret-key
DEBUG=True
GEMINI_API_KEY=your-gemini-api-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
```

Get a free Gemini API key at: https://aistudio.google.com/

---

v0.9 beta · August 2026
