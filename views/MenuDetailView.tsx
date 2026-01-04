import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { WeeklyMenu, DayMenu, Meal } from '../types';
import { 
  ArrowLeft, Calendar, Sparkles, ShoppingCart, Trash2, Edit2, 
  ExternalLink, Loader2, ListPlus, X, ChevronDown, ChevronUp, ChefHat
} from 'lucide-react';

const MenuDetailView: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const { 
        weeklyMenus, updateWeeklyMenu, generateAIWeeklyMenu, 
        createListFromUrl, analyzeRecipeUrl, addShoppingList, t
    } = useAppContext();

    const menu = weeklyMenus.find(m => m.id === id);

    // AI Modal State
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiConfig, setAiConfig] = useState({
        restriction: 'none',
        dietetic: false,
        time: 'yes',
        includeStarter: false,
        includeMain: true,
        includeDessert: false
    });
    const [isGenerating, setIsGenerating] = useState(false);

    // Edit Meal Modal State
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editingType, setEditingType] = useState<'lunch' | 'dinner' | null>(null);
    
    // We use a local state for editing the meal data
    const [editMealData, setEditMealData] = useState<Meal>({
        starter: '', starterUrl: '',
        main: '', mainUrl: '',
        dessert: '', dessertUrl: ''
    });

    // Helper for analysing URL in the edit modal
    const [analyzingField, setAnalyzingField] = useState<string | null>(null);

    // Handlers

    const handleSaveMeal = () => {
        if (!menu || !editingDay || !editingType) return;
        
        const updatedDays = { ...menu.days };
        (updatedDays as any)[editingDay][editingType] = { ...editMealData };

        updateWeeklyMenu({
            ...menu,
            days: updatedDays
        });
        
        // Close modal
        setEditingDay(null);
        setEditingType(null);
    };

    const handleOpenEdit = (day: string, type: 'lunch' | 'dinner') => {
        if (!menu) return;
        const dayData = (menu.days as any)[day] as DayMenu;
        setEditingDay(day);
        setEditingType(type);
        setEditMealData({ ...dayData[type] });
    };

    const handleAnalyzeUrl = async (fieldPrefix: 'starter' | 'main' | 'dessert') => {
        const url = (editMealData as any)[`${fieldPrefix}Url`];
        if (!url) return;
        setAnalyzingField(fieldPrefix);
        try {
            const { name } = await analyzeRecipeUrl(url);
            setEditMealData(prev => ({
                ...prev,
                [fieldPrefix]: name || prev[fieldPrefix] // Only update name if found
            }));
        } catch(e) {
            console.error(e);
            alert(t('ai_warning'));
        } finally {
            setAnalyzingField(null);
        }
    };

    const handleGenerateAI = async () => {
        if (!menu) return;
        setIsGenerating(true);
        try {
            const newDays = await generateAIWeeklyMenu(aiConfig);
            updateWeeklyMenu({
                ...menu,
                days: newDays
            });
            setIsAIModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la génération du menu");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateShoppingList = async () => {
        if (!menu) return;
        
        // Simple generation: Collect all dish names
        const items = [];
        const days = Object.values(menu.days);
        for (const day of days) {
            for (const type of ['lunch', 'dinner'] as const) {
                const meal = day[type];
                if (meal.starter) items.push({ customName: meal.starter, quantity: 1, unit: 'Aucune', isChecked: false });
                if (meal.main) items.push({ customName: meal.main, quantity: 1, unit: 'Aucune', isChecked: false });
                if (meal.dessert) items.push({ customName: meal.dessert, quantity: 1, unit: 'Aucune', isChecked: false });
            }
        }

        if (items.length > 0) {
            addShoppingList(`Courses: ${menu.name}`, items);
            alert("Liste de courses générée !");
            navigate('/');
        } else {
            alert("Le menu est vide.");
        }
    };

    if (!menu) return <div className="p-4">Menu introuvable</div>;

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="flex flex-col h-full min-h-screen bg-primary-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-4 shadow-sm z-10 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 dark:text-slate-300"><ArrowLeft /></button>
                    <h1 className="font-bold text-lg text-slate-800 dark:text-white flex-1">{menu.name}</h1>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setIsAIModalOpen(true)}
                        className="flex-1 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg flex items-center justify-center gap-2 font-medium text-sm"
                     >
                         <Sparkles size={16} /> {t('ai_fill')}
                     </button>
                     <button 
                        onClick={handleGenerateShoppingList}
                        className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg flex items-center justify-center gap-2 font-medium text-sm"
                     >
                         <ShoppingCart size={16} /> {t('generate_shopping_list')}
                     </button>
                </div>
            </div>

            {/* Days Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                 {daysOrder.map(day => {
                     const dayMenu = (menu.days as any)[day] as DayMenu;
                     return (
                         <div key={day} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                             <div className="bg-primary-50 dark:bg-slate-800 px-4 py-2 font-bold text-primary-700 dark:text-primary-300 border-b border-primary-100 dark:border-slate-700 uppercase tracking-wide text-sm">
                                 {t(day as any)}
                             </div>
                             <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                 {/* Lunch */}
                                 <div 
                                    onClick={() => handleOpenEdit(day, 'lunch')}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                 >
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="text-xs font-semibold text-orange-500 uppercase">{t('lunch')}</span>
                                     </div>
                                     <div className="space-y-1">
                                         {dayMenu.lunch.starter && <p className="text-sm text-gray-600 dark:text-slate-400"><span className="opacity-50 text-xs">Entrée:</span> {dayMenu.lunch.starter}</p>}
                                         <p className={`text-sm font-medium ${dayMenu.lunch.main ? 'text-slate-800 dark:text-white' : 'text-gray-400 italic'}`}>
                                            {dayMenu.lunch.main || t('nothing_planned')}
                                         </p>
                                         {dayMenu.lunch.dessert && <p className="text-sm text-gray-600 dark:text-slate-400"><span className="opacity-50 text-xs">Dessert:</span> {dayMenu.lunch.dessert}</p>}
                                     </div>
                                 </div>
                                 {/* Dinner */}
                                 <div 
                                    onClick={() => handleOpenEdit(day, 'dinner')}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                 >
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="text-xs font-semibold text-indigo-500 uppercase">{t('dinner')}</span>
                                     </div>
                                     <div className="space-y-1">
                                         {dayMenu.dinner.starter && <p className="text-sm text-gray-600 dark:text-slate-400"><span className="opacity-50 text-xs">Entrée:</span> {dayMenu.dinner.starter}</p>}
                                         <p className={`text-sm font-medium ${dayMenu.dinner.main ? 'text-slate-800 dark:text-white' : 'text-gray-400 italic'}`}>
                                            {dayMenu.dinner.main || t('nothing_planned')}
                                         </p>
                                         {dayMenu.dinner.dessert && <p className="text-sm text-gray-600 dark:text-slate-400"><span className="opacity-50 text-xs">Dessert:</span> {dayMenu.dinner.dessert}</p>}
                                     </div>
                                 </div>
                             </div>
                         </div>
                     );
                 })}
            </div>

            {/* Edit Meal Modal */}
            {editingDay && editingType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-pop">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold dark:text-white capitalize">{t(editingDay as any)} - {t(editingType)}</h3>
                                <p className="text-xs text-gray-500">Modifiez le repas</p>
                            </div>
                            <button onClick={() => { setEditingDay(null); setEditingType(null); }}><X className="text-gray-400 hover:text-red-500"/></button>
                        </div>

                        {['starter', 'main', 'dessert'].map((course) => {
                             const fieldName = course as 'starter' | 'main' | 'dessert';
                             return (
                                <div key={course} className="mb-4 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">{t(course === 'main' ? 'main_dish' : course as any)}</label>
                                    
                                    <input 
                                        type="text" 
                                        placeholder={t('name')}
                                        value={(editMealData as any)[course]}
                                        onChange={(e) => setEditMealData({ ...editMealData, [course]: e.target.value })}
                                        className="w-full p-2 mb-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white text-sm"
                                    />
                                    
                                    <div className="flex gap-2">
                                        <input 
                                            type="url" 
                                            placeholder="URL Recette"
                                            value={(editMealData as any)[`${course}Url`] || ''}
                                            onChange={(e) => setEditMealData({ ...editMealData, [`${course}Url`]: e.target.value })}
                                            className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white text-xs text-gray-500"
                                        />
                                        {(editMealData as any)[`${course}Url`] && (
                                            <>
                                                <button 
                                                    onClick={() => handleAnalyzeUrl(fieldName)}
                                                    disabled={analyzingField === course}
                                                    className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg disabled:opacity-50"
                                                    title="Analyser URL"
                                                >
                                                    {analyzingField === course ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                </button>
                                                <a 
                                                    href={(editMealData as any)[`${course}Url`]} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </>
                                        )}
                                    </div>
                                </div>
                             );
                        })}

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => { setEditingDay(null); setEditingType(null); }} className="px-4 py-2 text-gray-600 dark:text-slate-300">{t('cancel')}</button>
                            <button onClick={handleSaveMeal} className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700">{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Config Modal */}
            {isAIModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-pop">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold dark:text-white flex items-center gap-2"><Sparkles className="text-purple-500" /> {t('ai_config_title')}</h3>
                             <button onClick={() => setIsAIModalOpen(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-1">Régime / Restriction</label>
                                <select 
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600"
                                    value={aiConfig.restriction}
                                    onChange={(e) => setAiConfig({...aiConfig, restriction: e.target.value})}
                                >
                                    <option value="none">{t('ai_restriction_none')}</option>
                                    <option value="vegetarian">{t('ai_restriction_veg')}</option>
                                    <option value="nopork">{t('ai_restriction_nopork')}</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="dietetic"
                                    checked={aiConfig.dietetic}
                                    onChange={(e) => setAiConfig({...aiConfig, dietetic: e.target.checked})}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <label htmlFor="dietetic" className="dark:text-white">{t('ai_dietetic')}</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium dark:text-white mb-1">Temps de cuisine</label>
                                <select 
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600"
                                    value={aiConfig.time}
                                    onChange={(e) => setAiConfig({...aiConfig, time: e.target.value})}
                                >
                                    <option value="yes">{t('ai_time_yes')}</option>
                                    <option value="no">{t('ai_time_no')}</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-300 uppercase mb-2">{t('ai_courses_title')}</p>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={aiConfig.includeStarter} onChange={e => setAiConfig({...aiConfig, includeStarter: e.target.checked})} />
                                        <span className="text-sm dark:text-white">{t('starter')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={aiConfig.includeMain} onChange={e => setAiConfig({...aiConfig, includeMain: e.target.checked})} />
                                        <span className="text-sm dark:text-white">{t('main_dish')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={aiConfig.includeDessert} onChange={e => setAiConfig({...aiConfig, includeDessert: e.target.checked})} />
                                        <span className="text-sm dark:text-white">{t('dessert')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 p-3 rounded-lg">
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 flex gap-1">
                                    <Loader2 size={12} className={isGenerating ? "animate-spin" : ""} />
                                    {t('ai_warning_long')}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button 
                                onClick={handleGenerateAI} 
                                disabled={isGenerating}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="animate-spin" /> {t('ai_generating')}</>
                                ) : (
                                    <><Sparkles /> Générer le menu</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuDetailView;
