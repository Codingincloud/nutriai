import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from nutrition.models import Food
from django.conf import settings

class Command(BaseCommand):
    help = 'Import foods from CSV file'

    def handle(self, *args, **kwargs):
        csv_file = Path(settings.BASE_DIR) / 'data' / 'nepali_food_data.csv'
        if not csv_file.exists():
            self.stdout.write(self.style.ERROR(f"CSV file not found at {csv_file}"))
            return

        with open(csv_file, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                Food.objects.update_or_create(
                    name=row['name'],
                    defaults={
                        'name_nepali': row.get('name_nepali', ''),
                        'category': row.get('category', 'international'),
                        'calories': float(row.get('calories', 0)),
                        'protein': float(row.get('protein', 0)),
                        'carbohydrates': float(row.get('carbohydrates', 0)),
                        'fat': float(row.get('fat', 0)),
                        'fiber': float(row.get('fiber', 0)),
                        'sugar': float(row.get('sugar', 0)),
                        'sodium': float(row.get('sodium', 0)),
                        'is_vegetarian': row.get('is_vegetarian', 'False').lower() == 'true',
                        'is_vegan': row.get('is_vegan', 'False').lower() == 'true',
                        'is_gluten_free': row.get('is_gluten_free', 'False').lower() == 'true',
                        'contains_nuts': row.get('contains_nuts', 'False').lower() == 'true',
                        'contains_dairy': row.get('contains_dairy', 'False').lower() == 'true',
                        'contains_gluten': row.get('contains_gluten', 'False').lower() == 'true',
                        'contains_egg': row.get('contains_egg', 'False').lower() == 'true',
                        'is_nepali': row.get('is_nepali', 'False').lower() == 'true',
                        'data_source': row.get('data_source', ''),
                        'serving_size_g': float(row.get('serving_size_g', 100)),
                    }
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f"Successfully imported {count} foods"))
