
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { ArrowLeft, Utensils, Coffee, Moon, ExternalLink } from 'lucide-react';
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
      <div className="space-y-2">
        {meal.starter && (
            <div className="flex gap-2 items-start group bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-transparent hover:border-green-100 dark:hover:border-green-900 transition-colors">
               <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold h-fit mt-0.5">E</span>
               <div className="flex-1 flex justify-between items-start gap-1">
                   <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{meal.starter}</span>
                   {meal.starterUrl && (
                       <a href={meal.starterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/30 p-1 rounded" title={t('link_open')}>
                           <ExternalLink size={14} />
                       </a>
                   )}
               </div>
            </div>
        )}
        
        {meal.main && (
            <div className={`flex gap-2 items-start group bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border ${meal.mainUrl ? 'border-blue-100 dark:border-blue-900/30' : 'border-transparent'}`}>
               <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold h-fit mt-0.5">P</span>
               <div className="flex-1 flex justify-between items-start gap-1">
                   {meal.mainUrl ? (
                       <a href={meal.mainUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline leading-snug block">
                           {meal.main}
                       </a>
                   ) : (
                       <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{meal.main}</span>
                   )}
                   
                   {meal.mainUrl && (
                       <a href={meal.mainUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/30 p-1 rounded flex-shrink-0" title={t('link_open')}>
                           <ExternalLink size={14} />
                       </a>
                   )}
               </div>
            </div>
        )}

        {meal.dessert && (
            <div className="flex gap-2 items-start group bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-transparent hover:border-pink-100 dark:hover:border-pink-900 transition-colors">
               <span className="text-[10px] bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold h-fit mt-0.5">D</span>
               <div className="flex-1 flex justify-between items-start gap-1">
                   <span className="text-sm text-slate-700 dark:text-slate-300 italic leading-snug">{meal.dessert}</span>
                   {meal.dessertUrl && (
                       <a href={meal.dessertUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/30 p-1 rounded" title={t('link_open')}>
                           <ExternalLink size={14} />
                       </a>
                   )}
               </div>
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
          <div className="flex-1 overflow-hidden">
             <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate">{menu.name}</h1>
             <p className="text-xs text-gray-500 dark:text-gray-400">{t('created_at')} {menu.createdAt}</p>
          </div>
          <Utensils className="text-primary-500 flex-shrink-0" size={24} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {DAYS_ORDER.map((dayKey) => {
                 const dayMenu = menu.days[dayKey as keyof typeof menu.days];
                 return (
                     <div key={dayKey} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl shadow-sm border border-primary-100 dark:border-slate-800 overflow-hidden flex flex-col">
                         <div className="bg-white dark:bg-slate-800 p-3 border-b border-primary-50 dark:border-slate-700">
                             <h3 className="font-bold text-primary-800 dark:text-primary-200 uppercase tracking-wide text-sm flex items-center gap-2">
                                 {t(dayKey as any)}
                             </h3>
                         </div>
                         <div className="flex-1 flex flex-col divide-y divide-gray-100 dark:divide-slate-700">
                             {/* Midi */}
                             <div className="p-3 flex gap-3 flex-1">
                                 <div className="mt-1.5 flex-shrink-0">
                                     <Coffee size={18} className="text-orange-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    {renderMealCell(dayMenu, 'lunch')}
                                 </div>
                             </div>
                             {/* Soir */}
                             <div className="p-3 flex gap-3 flex-1 bg-white/50 dark:bg-slate-800/20">
                                 <div className="mt-1.5 flex-shrink-0">
                                     <Moon size={18} className="text-indigo-400" />
                                 </div>
                                 <div className="flex-1 min-w-0">
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
