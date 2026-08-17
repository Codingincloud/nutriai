"""
NutriAI — XGBoost + Random Forest Recommendation Engine Trainer
Fixes applied:
  - Label formula now uses proper per-component normalization → produces real 0-1 variance
  - Augmented with synthetic negative examples (junk food, high-sugar, high-sodium profiles)
  - Evaluation outputs Accuracy/Precision/Recall/F1 (binarized at 0.5) + MAE/RMSE/R²
Run: venv\\Scripts\\python.exe recommendations/ml/train.py
"""
import os
import sys
import django
import numpy as np
import joblib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from nutrition.models import Food
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score
)


def make_label(cal, prot, carb, fat, fiber, sugar, sodium):
    """
    Compute a nutritional quality score in [0.0, 1.0] with genuine variance.
    Components are each normalized to [0,1] before weighting.

    Scoring philosophy:
      - High protein density = good (supports muscle, satiety)
      - High fiber = good (digestive health)
      - Low fat fraction = good (calorie efficiency)
      - Low sugar = good (metabolic health)
      - Low sodium = good (cardiovascular health)
    """
    cal = max(cal, 1.0)

    # Protein density: reward foods where ≥25% of calories come from protein
    # 1g protein = 4 kcal → 25% protein = protein/cal * 4 ≥ 0.25 → protein/cal ≥ 0.0625
    prot_density = np.clip(prot * 4 / cal, 0, 1)           # 0-1, capped at 100% protein

    # Fiber: 10g+ per serving is excellent
    fiber_score = np.clip(fiber / 10.0, 0, 1)

    # Fat fraction: penalize if >40% of calories from fat
    fat_fraction = np.clip(fat * 9 / cal, 0, 1)
    fat_score = 1.0 - fat_fraction                          # 1=no fat, 0=all fat

    # Sugar penalty: >25g sugar per serving is poor
    sugar_score = 1.0 - np.clip(sugar / 25.0, 0, 1)

    # Sodium penalty: >500mg per serving is poor
    sodium_score = 1.0 - np.clip(sodium / 500.0, 0, 1)

    # Weighted combination
    raw = (0.35 * prot_density +
           0.20 * fiber_score  +
           0.20 * fat_score    +
           0.15 * sugar_score  +
           0.10 * sodium_score)

    return float(np.clip(raw, 0.0, 1.0))


def build_dataset():
    """Load real foods + augment with synthetic positive/negative examples."""
    foods = list(Food.objects.all())
    if not foods:
        raise RuntimeError('No foods in database! Run import_foods first.')

    print(f'Loaded {len(foods)} real foods from NepaliNutriDB')

    rows = []
    for f in foods:
        cal  = float(f.calories or 0)
        prot = float(f.protein or 0)
        carb = float(f.carbohydrates or 0)
        fat  = float(f.fat or 0)
        fib  = float(getattr(f, 'fiber',  0) or 0)
        sug  = float(getattr(f, 'sugar',  0) or 0)
        sod  = float(getattr(f, 'sodium', 0) or 0)
        rows.append([cal, prot, carb, fat, fib, sug, sod])

    # ── Augmented synthetic examples ──────────────────────────────────────
    # These create genuine spread in the label distribution.
    # Format: [cal, protein, carb, fat, fiber, sugar, sodium]
    synthetic = [
        # --- Near-zero score: junk food / pure sugar ---
        ([450, 2,  110, 1,  0,  100, 20],   0.03),  # sugary drink
        ([600, 3,  80,  30, 0,  60,  80],   0.07),  # candy bar
        ([550, 4,  70,  28, 1,  50,  200],  0.10),  # fried donut
        ([800, 5,  60,  60, 0,  30,  600],  0.08),  # fried chips, high sodium
        ([900, 6,  40,  80, 0,  5,   900],  0.05),  # deep fried food

        # --- Low score: high fat, high sodium, low fiber ---
        ([400, 10, 30,  30, 1,  5,   800],  0.20),  # processed sausage
        ([350, 8,  45,  18, 1,  20,  700],  0.22),  # fast food burger component
        ([500, 12, 50,  28, 2,  10,  650],  0.25),  # greasy rice dish

        # --- Medium score: reasonable balance ---
        ([300, 15, 40,  8,  3,  5,   250],  0.52),  # average mixed meal
        ([250, 12, 35,  6,  4,  4,   180],  0.56),  # rice + moderate protein
        ([350, 20, 40,  10, 3,  3,   200],  0.60),  # chicken + rice

        # --- High score: balanced, high protein, low sugar ---
        ([350, 28, 30,  8,  6,  3,   150],  0.78),  # grilled chicken + veggies
        ([280, 22, 28,  6,  8,  2,   120],  0.82),  # lentil soup (like dal)
        ([200, 18, 20,  4,  10, 2,   100],  0.85),  # high-fiber legume dish
        ([320, 30, 25,  7,  7,  2,   130],  0.87),  # lean protein + fiber

        # --- Near-perfect: high protein, high fiber, very low sugar/fat ---
        ([240, 25, 20,  4,  12, 1,   80],   0.92),  # ideal protein-fiber food
        ([200, 20, 18,  3,  14, 1,   70],   0.94),  # very high fiber legume
    ]

    X_syn = np.array([row for row, _ in synthetic])
    y_syn = np.array([label for _, label in synthetic])

    X_real = np.array(rows)
    y_real = np.array([make_label(*row) for row in rows])

    print(f'Real food label range: {y_real.min():.3f} – {y_real.max():.3f}  '
          f'(mean={y_real.mean():.3f}, std={y_real.std():.3f})')

    X = np.vstack([X_real, X_syn])
    y = np.concatenate([y_real, y_syn])

    print(f'Total training samples: {len(X)} '
          f'(real={len(X_real)}, synthetic={len(X_syn)})')
    return X, y


def evaluate(name, y_true, y_pred):
    """Print regression + binarized classification metrics."""
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2   = r2_score(y_true, y_pred)

    # Binarize at 0.5 for classification metrics
    y_true_bin = (y_true >= 0.5).astype(int)
    y_pred_bin = (np.clip(y_pred, 0, 1) >= 0.5).astype(int)

    acc  = accuracy_score(y_true_bin, y_pred_bin)
    prec = precision_score(y_true_bin, y_pred_bin, zero_division=0)
    rec  = recall_score(y_true_bin, y_pred_bin, zero_division=0)
    f1   = f1_score(y_true_bin, y_pred_bin, zero_division=0)

    print(f'\n-- {name} ------------------------')
    print(f'  Regression  -> MAE: {mae:.4f}  RMSE: {rmse:.4f}  R2: {r2:.4f}')
    print(f'  Classification (threshold=0.5):')
    print(f'    Accuracy:  {acc:.4f}')
    print(f'    Precision: {prec:.4f}')
    print(f'    Recall:    {rec:.4f}')
    print(f'    F1-Score:  {f1:.4f}')
    return {'mae': mae, 'rmse': rmse, 'r2': r2,
            'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1}


def train():
    X, y = build_dataset()

    test_size = 0.20
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )
    print(f'\nTrain: {len(X_train)}  Test: {len(X_test)}')

    # ── XGBoost ──────────────────────────────────────────────────────────
    xgb = XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        random_state=42,
        verbosity=0
    )
    xgb.fit(X_train, y_train)
    xgb_metrics = evaluate('XGBoost', y_test, xgb.predict(X_test))

    # ── Random Forest ─────────────────────────────────────────────────────
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_metrics = evaluate('Random Forest', y_test, rf.predict(X_test))

    # ── Score spread check ────────────────────────────────────────────────
    print('\n-- Score spread on full dataset -------------------------')
    xgb_all = xgb.predict(X)
    rf_all   = rf.predict(X)
    print(f'  XGBoost  range: {xgb_all.min():.3f} - {xgb_all.max():.3f}  '
          f'std={xgb_all.std():.3f}')
    print(f'  RF       range: {rf_all.min():.3f} - {rf_all.max():.3f}  '
          f'std={rf_all.std():.3f}')

    # ── Save ──────────────────────────────────────────────────────────────
    model_dir = Path(__file__).parent
    model_dir.mkdir(exist_ok=True)
    joblib.dump(xgb, model_dir / 'model.pkl')
    joblib.dump(rf,  model_dir / 'rf_model.pkl')

    print('\nModels saved: model.pkl  rf_model.pkl')
    print('\nDefense-ready metrics:')
    for k in ['mae', 'rmse', 'r2', 'accuracy', 'precision', 'recall', 'f1']:
        print(f'  XGB {k:12s}: {xgb_metrics[k]:.4f}   RF: {rf_metrics[k]:.4f}')


if __name__ == '__main__':
    train()
