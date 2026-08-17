import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import './MealCard.css';

const MealCard = ({ meal, onDelete }) => {
  const foodName = meal.food_details?.name || meal.food_name || 'Unknown Food';
  const nepaliName = meal.food_details?.name_nepali || '';
  const calories = meal.total_calories || 0;
  const protein = meal.total_protein || 0;
  const carbs = meal.total_carbs || 0;
  const fat = meal.total_fat || 0;

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${foodName} from your log?`)) return;
    try {
      await api.delete(`/nutrition/logs/${meal.id}/`);
      onDelete && onDelete(meal.id);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="meal-card">
      <div className="meal-card-info">
        <div className="meal-card-name">{foodName}</div>
        {nepaliName && <div className="meal-card-nepali">{nepaliName}</div>}
        <div className="meal-card-meta">
          {meal.meal_type} &bull; {meal.quantity_g || meal.portion_size}g
        </div>
      </div>
      <div className="meal-card-right">
        <div className="meal-card-calories">{Math.round(calories)} kcal</div>
        <div className="meal-card-macros">
          <span>P:{Math.round(protein)}g</span>
          <span>C:{Math.round(carbs)}g</span>
          <span>F:{Math.round(fat)}g</span>
        </div>
        <button className="delete-btn" onClick={handleDelete} title="Remove">
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default MealCard;
