"""
Management command to seed realistic weight history for the demo user.
Matches the demo profile's goal: maintain_weight at 70.0 kg
Shows stable weight with natural day-to-day fluctuation (NOT a loss trend).
Run with: python manage.py seed_weight_history
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from progress.models import WeightRecord
import datetime


class Command(BaseCommand):
    help = 'Seed 3-week weight history matching the demo profile goal (maintain_weight)'

    def handle(self, *args, **kwargs):
        try:
            user = User.objects.get(username='demo')
        except User.DoesNotExist:
            self.stderr.write('User "demo" not found.')
            return

        today = datetime.date.today()

        # Stable maintenance pattern: hovering ~70.0 kg with realistic ±0.4 kg noise
        # Profile goal = maintain_weight, current weight = 70.0 kg
        # Slight drift allowed (real people vary daily) but no clear trend
        weight_data = [
            (-21, 70.3),
            (-18, 70.1),
            (-16, 70.5),  # slight bump after a heavy meal
            (-14, 70.2),
            (-12, 70.4),
            (-10, 69.9),
            (-8,  70.1),
            (-6,  70.3),
            (-5,  70.0),
            (-3,  70.2),
            (-1,  70.1),
            (0,   70.0),  # today — matches profile weight exactly
        ]

        # First clear any old seeded records that conflict
        old_dates = [today + datetime.timedelta(days=d) for d, _ in weight_data]
        deleted = WeightRecord.objects.filter(user=user, date__in=old_dates).delete()

        created = 0
        for days_offset, weight in weight_data:
            date = today + datetime.timedelta(days=days_offset)
            WeightRecord.objects.create(user=user, date=date, weight_kg=weight, notes='')
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done. Seeded {created} records (flat ~70kg maintenance trend).'
        ))
