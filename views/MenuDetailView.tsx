
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { 
  ArrowLeft, Utensils, Coffee, Moon, ExternalLink, ListPlus, 
  Loader2, Check, ChefHat, X, Sparkles, Save
} from 'lucide-react';
import { DayMenu, DishType, Season } from '../types';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const MenuDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    weeklyMenus, createListFromUrl, shoppingLists, t, 
    addRecipe, recipeCategories, analyzeRecipeUrl 
  } = useAppContext();
  
  const menu = weeklyMenus.find(m => m.id === id);
  const [loadingRecipeUrl, setLoadingRecipeUrl] = useState<string | null>(null);

  // States for Quick Recipe Save
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recipeFormData, setRecipeFormData] = useState({
    name: '',
    link: '',
    note: '',
    type: '' as DishType,
    categoryId: '',
    season: 'all' as Season
  });

  if (!menu) return <div className="text-center p-10 dark:text-white">Menu introuvable</div>;

  const handleCreateList = async (name: string, url: string) => {
      setLoadingRecipeUrl(url);
      try {
          await createListFromUrl(name, url);
          alert("Liste de courses créée avec succès !");
      } catch (error) {
          alert("Erreur lors de la création de la liste. Vérifiez votre connexion ou la clé API.");
      } finally {
          setLoadingRecipeUrl(null);
      }
  };

  const openRecipeSaveModal = (name: string, url: string, type: DishType) => {
      setRecipeFormData({
          name,
          link: url,
          note: '',
          type,
          categoryId: '',
          season: 'all'
      });
      setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = () => {
      if (!recipeFormData.name.trim()) return;
      addRecipe({
          ...recipeFormData,
          name: recipeFormData.name.trim()
      });
      setIsRecipeModalOpen(false);
      alert("Recette enregistrée !");
  };

  const handleAnalyzeUrl = async () => {
    if (!recipeFormData.link) return;
    setIsAnalyzing(true);
    try {
        const result = await analyzeRecipeUrl(recipeFormData.link);
        setRecipeFormData(prev => ({
            ...prev,
            name: result.name || prev.name,
            note: result.note || prev.note
        }));
    } catch (error) {
        alert("Erreur lors de l'analyse IA.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const renderMealCell = (dayMenu: DayMenu, type: 'lunch' | 'dinner') => {
    const meal = dayMenu[type];
    const hasContent = meal.starter || meal.main || meal.dessert;

    if (!hasContent) {
        return <div className="text-gray-300 dark:text-slate-600 italic text-xs">{t('nothing_planned')}</div>;
    }

    const renderItem = (label: string, name: string, url?: string, badgeColorClass: string = "", dishType: DishType = 'main') => {
        const isListCreated = shoppingLists.some(l => l.name === name);

        return (
        <div className={`flex gap-2 items-start group bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors`}>
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold h-fit mt-0.5 ${badgeColorClass}`}>{label}</span>
            <div className="flex-1 flex justify-between items-start gap-1 min-w-0">
                {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline leading-snug block truncate">
                        {name}
                    </a>
                ) : (
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug block truncate">{name}</span>
                )}
                
                <div className="flex gap-1 flex-shrink-0">
                    {url && (
                        <>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/30 p-1 rounded" title={t('link_open')}>
                                <ExternalLink size={14} />
                            </a>
                            <button 
                                onClick={() => openRecipeSaveModal(name, url, dishType)}
                                className="text-purple-600 hover:text-purple-800 bg-purple-50 dark:bg-purple-900/30 p-1 rounded transition-colors"
                                title="Enregistrer dans mes recettes"
                            >
                                <ChefHat size={14} />
                            </button>
                            <button 
                                onClick={() => handleCreateList(name, url)}
                                disabled={loadingRecipeUrl === url || isListCreated}
                                className={`transition-colors p-1 rounded ${isListCreated ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-default' : 'text-green-600 hover:text-green-800 bg-green-50 dark:bg-green-900/30'}`}
                                title={isListCreated ? "Liste déjà créée" : "Créer une liste de courses"}
                            >
                                {loadingRecipeUrl === url ? <Loader2 size={14} className="animate-spin"/> : (isListCreated ? <Check size={14} /> : <ListPlus size={14} />)}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
        );
    };

    return (
      <div className="space-y-2">
        {meal.starter && renderItem('E', meal.starter, meal.starterUrl, "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300", 'starter')}
        {meal.main && renderItem('P', meal.main, meal.mainUrl, "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300", 'main')}
        {meal.dessert && renderItem('D', meal.dessert, meal.dessertUrl, "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300", 'dessert')}
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
         
         {/* Legends */}
         <div className="flex flex-wrap gap-4 px-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-1 rounded text-blue-500 flex-shrink-0">
                    <ExternalLink size={14} />
                </div>
                <span>{t('open_recipe')}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-purple-50 dark:bg-purple-900/30 p-1 rounded text-purple-600 flex-shrink-0">
                    <ChefHat size={14} />
                </div>
                <span>Sauvegarder la recette</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-green-50 dark:bg-green-900/30 p-1 rounded text-green-600 flex-shrink-0">
                    <ListPlus size={14} />
                </div>
                <span>{t('generate_shopping_list')}</span>
            </div>
         </div>

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

      {/* Quick Recipe Save Modal */}
      {isRecipeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-pop max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ChefHat className="text-purple-500" /> 
                        {t('new_recipe')}
                    </h3>
                    <button onClick={() => setIsRecipeModalOpen(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_name')}</label>
                         <input 
                             type="text" 
                             value={recipeFormData.name}
                             onChange={(e) => setRecipeFormData({...recipeFormData, name: e.target.value})}
                             className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                         />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('type')}</label>
                             <select 
                                 value={recipeFormData.type}
                                 onChange={(e) => setRecipeFormData({...recipeFormData, type: e.target.value as DishType})}
                                 className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                             >
                                 <option value="">{t('none_type')}</option>
                                 <option value="starter">{t('starter')}</option>
                                 <option value="main">{t('main_dish')}</option>
                                 <option value="dessert">{t('dessert')}</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('season')}</label>
                             <select 
                                 value={recipeFormData.season}
                                 onChange={(e) => setRecipeFormData({...recipeFormData, season: e.target.value as Season})}
                                 className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                             >
                                 <option value="all">{t('all_seasons')}</option>
                                 <option value="spring">{t('spring')}</option>
                                 <option value="summer">{t('summer')}</option>
                                 <option value="autumn">{t('autumn')}</option>
                                 <option value="winter">{t('winter')}</option>
                             </select>
                        </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_category')}</label>
                         <select 
                             value={recipeFormData.categoryId}
                             onChange={(e) => setRecipeFormData({...recipeFormData, categoryId: e.target.value})}
                             className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                         >
                             <option value="">{t('none_category')}</option>
                             {recipeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_link')}</label>
                         <div className="flex gap-2">
                             <input 
                                 type="url" 
                                 value={recipeFormData.link}
                                 onChange={(e) => setRecipeFormData({...recipeFormData, link: e.target.value})}
                                 placeholder="https://..."
                                 className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                             />
                             <button
                                 onClick={handleAnalyzeUrl}
                                 disabled={isAnalyzing || !recipeFormData.link}
                                 className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center disabled:opacity-50"
                                 title="Extraire les détails avec l'IA"
                             >
                                 {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                             </button>
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_note')}</label>
                         <textarea 
                             rows={3}
                             value={recipeFormData.note}
                             onChange={(e) => setRecipeFormData({...recipeFormData, note: e.target.value})}
                             className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                             placeholder="Notes ou ingrédients..."
                         />
                     </div>
                 </div>

                 <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsRecipeModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                     <button onClick={handleSaveRecipe} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-md">
                         <Save size={18}/> {t('save')}
                     </button>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default MenuDetailView;
