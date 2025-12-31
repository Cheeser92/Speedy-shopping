
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { ArrowLeft, Utensils, Coffee, Moon } from 'lucide-react';
import { DayMenu } from '../types';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const MenuDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { weeklyMenus, t } = useAppContext();
  
  const menu = weeklyMenus.find(m => m.id === id);

  if (!menu) return <div className="text-center p-10 dark:text-white">Menu introuvable</div>;

  const renderMealCell = (dayMenu: DayMenu, type: 'lunch' | 'dinner') => {
    const meal = dayMenu[type];
    const hasContent = meal.starter || meal.main || meal.dessert;

    if (!hasContent) {
        return <div className="text-gray-300 dark:text-slate-600 italic text-xs">{t('nothing_planned')}</div>;
    }

    return (
      <div className="space-y-1">
        {meal.starter && (
            <div className="flex gap-1 items-start">
               <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1 rounded uppercase tracking-wider font-bold">E</span>
               <span className="text-sm text-slate-700 dark:text-slate-300">{meal.starter}</span>
            </div>
        )}
        {meal.main && (
            <div className="flex gap-1 items-start">
               <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded uppercase tracking-wider font-bold">P</span>
               <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{meal.main}</span>
            </div>
        )}
        {meal.dessert && (
            <div className="flex gap-1 items-start">
               <span className="text-[10px] bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-1 rounded uppercase tracking-wider font-bold">D</span>
               <span className="text-sm text-slate-700 dark:text-slate-300 italic">{meal.dessert}</span>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-primary-50 dark:bg-slate-950 relative transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm z-10 flex items-center gap-3 transition-colors duration-300">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><ArrowLeft /></button>
          <div className="flex-1">
             <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate">{menu.name}</h1>
             <p className="text-xs text-gray-500 dark:text-gray-400">{t('created_at')} {menu.createdAt}</p>
          </div>
          <Utensils className="text-primary-500" size={24} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
         <div className="grid gap-4">
             {DAYS_ORDER.map((dayKey) => {
                 const dayMenu = menu.days[dayKey as keyof typeof menu.days];
                 return (
                     <div key={dayKey} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary-100 dark:border-slate-800 overflow-hidden">
                         <div className="bg-primary-50 dark:bg-slate-800 p-2 border-b border-primary-100 dark:border-slate-700">
                             <h3 className="font-bold text-primary-800 dark:text-primary-200 uppercase tracking-wide text-sm">{t(dayKey as any)}</h3>
                         </div>
                         <div className="grid grid-cols-1 divide-y dark:divide-slate-800">
                             {/* Midi */}
                             <div className="p-3 flex gap-3">
                                 <div className="mt-1">
                                     <Coffee size={18} className="text-orange-400" />
                                 </div>
                                 <div className="flex-1">
                                    {renderMealCell(dayMenu, 'lunch')}
                                 </div>
                             </div>
                             {/* Soir */}
                             <div className="p-3 flex gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                                 <div className="mt-1">
                                     <Moon size={18} className="text-indigo-400" />
                                 </div>
                                 <div className="flex-1">
                                    {renderMealCell(dayMenu, 'dinner')}
                                 </div>
                             </div>
                         </div>
                     </div>
                 );
             })}
         </div>
      </div>
    </div>
  );
};

export default MenuDetailView;
