"""
Progress Prediction Module — NutriAI
Uses linear regression (numpy.polyfit) over recorded weight history to:
  1. Return all historical data points in chart-compatible format
  2. Extrapolate 8 weeks forward as a dashed prediction line
  3. Compute weekly change rate and estimated goal date
"""
import datetime
import numpy as np


def predict_weight_trend(records, calorie_target, weeks=8):
    """
    Args:
        records: list of WeightRecord model instances, ordered by date ASC
        calorie_target: user's daily calorie target (not used in regression
                        but useful for context/display)
        weeks: number of weeks to project forward

    Returns a dict with keys consumed by WeightChart.jsx:
        - chart_data: list of {date, actual, predicted} — both lines on one chart
        - current_weight: float
        - weekly_change: float (kg/week, negative = losing)
        - trend: "decreasing" | "increasing" | "stable"
        - estimated_goal_date: str or None
        - summary_text: human-readable sentence for UI
    """
    if not records:
        return {
            'chart_data': [],
            'current_weight': 0,
            'weekly_change': 0,
            'trend': 'stable',
            'estimated_goal_date': None,
            'summary_text': 'Log your weight to see progress predictions.',
            # Legacy keys kept for backwards-compat
            'predicted_weights': [],
        }

    current_weight = round(float(records[-1].weight_kg), 1)

    if len(records) < 2:
        today_str = records[-1].date.strftime('%Y-%m-%d')
        return {
            'chart_data': [{'date': today_str, 'actual': current_weight, 'predicted': None}],
            'current_weight': current_weight,
            'weekly_change': 0,
            'trend': 'stable',
            'estimated_goal_date': None,
            'summary_text': 'Add more weight entries to see your trend line.',
            'predicted_weights': [],
        }

    # ── Build regression ────────────────────────────────────────────────────
    start_date = records[0].date
    x = np.array([(r.date - start_date).days for r in records], dtype=float)
    y = np.array([float(r.weight_kg) for r in records])

    slope, intercept = np.polyfit(x, y, 1)

    weekly_change = round(slope * 7, 2)
    trend = ('decreasing' if slope < -0.01
             else 'increasing' if slope > 0.01
             else 'stable')

    # ── Build chart_data: historical actual + predicted overlay ────────────
    # Historical points
    chart_data = []
    for r in records:
        day_idx = (r.date - start_date).days
        predicted_at_that_day = round(intercept + slope * day_idx, 1)
        chart_data.append({
            'date': r.date.strftime('%b %d'),
            'actual': round(float(r.weight_kg), 1),
            'predicted': predicted_at_that_day,
        })

    # Projected future points (dashed line)
    last_date = records[-1].date
    last_day_idx = float((last_date - start_date).days)

    predicted_weights = []  # legacy
    for w in range(1, weeks + 1):
        future_day = last_day_idx + (w * 7)
        future_date = last_date + datetime.timedelta(days=w * 7)
        pred_w = round(intercept + slope * future_day, 1)
        date_str = future_date.strftime('%b %d')
        chart_data.append({
            'date': date_str,
            'actual': None,          # no actual data yet
            'predicted': pred_w,
        })
        predicted_weights.append({'date': future_date.strftime('%Y-%m-%d'), 'weight': pred_w})

    # ── Estimated goal date ────────────────────────────────────────────────
    estimated_goal_date = None
    try:
        goal_w = None
        # Will be overridden by views.py which adds goal_weight to the response
        # If slope is meaningful, compute when regression line hits the goal
        # (Left to views.py to fill in — included here as None)
    except Exception:
        pass

    # ── Summary text ───────────────────────────────────────────────────────
    if trend == 'decreasing':
        summary_text = (f'You are losing approximately {abs(weekly_change)} kg/week. '
                        f'Keep it up!')
    elif trend == 'increasing':
        summary_text = (f'Weight is increasing by {abs(weekly_change)} kg/week. '
                        f'Consider reviewing your calorie intake.')
    else:
        summary_text = 'Your weight is stable. Adjust diet if you want to change trajectory.'

    return {
        'chart_data': chart_data,
        'current_weight': current_weight,
        'weekly_change': weekly_change,
        'trend': trend,
        'estimated_goal_date': estimated_goal_date,
        'summary_text': summary_text,
        'predicted_weights': predicted_weights,
    }
