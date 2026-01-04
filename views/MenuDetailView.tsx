import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { ArrowLeft, Save, Sparkles, Loader2, ExternalLink, Calendar, Search, Edit3, ListPlus, BookHeart, X, Check } from 'lucide-react';
import { DayMenu, DishType, Recipe, Season } from '../types';

const MenuDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { weeklyMenus, updateWeeklyMenu, analyzeRecipeUrl, t, createListFromUrl, addRecipe, recipeCategories, shoppingLists } = useAppContext();
    
    const menu = weeklyMenus.find(m => m.id === id);
    
    // State for editing a meal
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editingType, setEditingType] = useState<'lunch' | 'dinner' | null>(null);
    
    // State for creating list loader
    const [generatingListFor, setGeneratingListFor] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<DayMenu['lunch']>({
        starter: '', starterUrl: '',
        main: '', mainUrl: '',
        dessert: '', dessertUrl: ''
    });

    // Recipe Modal State
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [recipeFormData, setRecipeFormData] = useState<Omit<Recipe, 'id'>>({
        name: '', link: '', note: '', type: '', categoryId: '', season: ''
    });
    const [isAnalyzingRecipe, setIsAnalyzingRecipe] = useState(false);
    const [loadingRecipeUrl, setLoadingRecipeUrl] = useState<string | null>(null);

    // Helper for recipe analysis within the form
    const [analyzingField, setAnalyzingField] = useState<string | null>(null);

    useEffect(() => {
        if (!menu) {
            navigate('/');
        }
    }, [menu, navigate]);

    if (!menu) return null;

    const handleEdit = (day: string, type: 'lunch' | 'dinner') => {
        setEditingDay(day);
        setEditingType(type);
        setFormData({ ...((menu.days as any)[day][type]) });
    };

    const handleSave = () => {
        if (editingDay && editingType) {
            const updatedMenu = { ...menu };
            (updatedMenu.days as any)[editingDay][editingType] = { ...formData };
            updateWeeklyMenu(updatedMenu);
            setEditingDay(null);
            setEditingType(null);
        }
    };

    const handleAnalyzeUrl = async (fieldPrefix: 'starter' | 'main' | 'dessert') => {
        const urlField = `${fieldPrefix}Url` as keyof typeof formData;
        const nameField = fieldPrefix as keyof typeof formData;
        
        const url = formData[urlField];
        if (!url) return;
        
        setAnalyzingField(fieldPrefix);
        try {
            const { name } = await analyzeRecipeUrl(url);
            setFormData(prev => ({ ...prev, [nameField]: name }));
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingField(null);
        }
    };

    const handleCreateList = async (name: string, url: string) => {
        if (!url) return;
        setGeneratingListFor(name + url); 
        try {
            await createListFromUrl(name, url);
            // Optional: Feedback notification
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la création de la liste.");
        } finally {
            setGeneratingListFor(null);
        }
    };

    const handleOpenRecipeModal = (name: string, url: string, type: DishType) => {
        setRecipeFormData({
            name,
            link: url || '',
            note: '',
            type: type || '',
            season: 'all',
            categoryId: ''
        });
        setIsRecipeModalOpen(true);
    };

    const handleSaveRecipe = () => {
        if (!recipeFormData.name.trim()) return;
        addRecipe(recipeFormData);
        setIsRecipeModalOpen(false);
    };

    const handleAnalyzeRecipeInModal = async () => {
         if (!recipeFormData.link) return;
         setIsAnalyzingRecipe(true);
         try {
             const result = await analyzeRecipeUrl(recipeFormData.link);
             setRecipeFormData(prev => ({ ...prev, name: result.name || prev.name, note: result.note || prev.note }));
         } catch (e) {
             console.error(e);
         } finally {
             setIsAnalyzingRecipe(false);
         }
    };

    const handleCreateListFromRecipe = async () => {
        if (!recipeFormData.link || !recipeFormData.name) return;
        setLoadingRecipeUrl(recipeFormData.link);
        try {
            await createListFromUrl(recipeFormData.name, recipeFormData.link);
            alert("Liste de courses créée avec succès !");
        } catch (error) {
            alert("Erreur lors de la création de la liste.");
        } finally {
            setLoadingRecipeUrl(null);
        }
    };

    // Helper to render a single line item
    const renderMealItem = (labelKey: string, name: string, url: string | undefined, type: DishType) => {
        if (!name) return null;
        
        return (
            <div className="flex justify-between items-start group py-1">
                <div className="flex-1 pr-2">
                    <div className="text-slate-600 dark:text-slate-400 text-sm break-words">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{t(labelKey as any)}:</span> {name}
                    </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                    {url && (
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors" 
                            title={t('link_open')}
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}
                    {url && (
                        <button 
                            onClick={() => handleCreateList(name, url)}
                            disabled={generatingListFor === name + url}
                            className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 p-1.5 rounded-lg disabled:opacity-50 transition-colors"
                            title={t('generate_shopping_list')}
                        >
                            {generatingListFor === name + url ? <Loader2 size={16} className="animate-spin"/> : <ListPlus size={16} />}
                        </button>
                    )}
                    <button 
                        onClick={() => handleOpenRecipeModal(name, url || '', type)}
                        className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors"
                        title="Sauvegarder dans mes recettes"
                    >
                        <BookHeart size={16} />
                    </button>
                </div>
            </div>
        );
    };

    // Days mapping for translation/display
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="flex flex-col h-screen bg-primary-50 dark:bg-slate-950 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 p-4 shadow-sm z-10 flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 dark:text-slate-300"><ArrowLeft /></button>
                <h1 className="font-bold text-lg truncate flex-1 text-slate-800 dark:text-white">{menu.name}</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
                {days.map(day => {
                    const dayData = (menu.days as any)[day];
                    const hasLunch = dayData.lunch.starter || dayData.lunch.main || dayData.lunch.dessert;
                    const hasDinner = dayData.dinner.starter || dayData.dinner.main || dayData.dinner.dessert;

                    return (
                        <div key={day} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary-100 dark:border-slate-800 overflow-hidden">
                            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 px-4 font-bold text-primary-800 dark:text-primary-200 capitalize flex items-center gap-2">
                                <Calendar size={16} />
                                {t(day as any)}
                            </div>
                            
                            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                {/* Lunch */}
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 tracking-wider">{t('lunch')}</span>
                                        <button onClick={() => handleEdit(day, 'lunch')} className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 p-1 rounded"><Edit3 size={16} /></button>
                                    </div>
                                    <div className="space-y-1">
                                        {renderMealItem('starter', dayData.lunch.starter, dayData.lunch.starterUrl, 'starter')}
                                        {renderMealItem('main_dish', dayData.lunch.main, dayData.lunch.mainUrl, 'main')}
                                        {renderMealItem('dessert', dayData.lunch.dessert, dayData.lunch.dessertUrl, 'dessert')}
                                        {!hasLunch && <div className="text-sm italic text-gray-400 px-1">{t('nothing_planned')}</div>}
                                    </div>
                                </div>

                                {/* Dinner */}
                                <div className="p-3 bg-gray-50/50 dark:bg-slate-800/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold uppercase text-gray-400 dark:text-slate-500 tracking-wider">{t('dinner')}</span>
                                        <button onClick={() => handleEdit(day, 'dinner')} className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800 p-1 rounded"><Edit3 size={16} /></button>
                                    </div>
                                    <div className="space-y-1">
                                        {renderMealItem('starter', dayData.dinner.starter, dayData.dinner.starterUrl, 'starter')}
                                        {renderMealItem('main_dish', dayData.dinner.main, dayData.dinner.mainUrl, 'main')}
                                        {renderMealItem('dessert', dayData.dinner.dessert, dayData.dinner.dessertUrl, 'dessert')}
                                        {!hasDinner && <div className="text-sm italic text-gray-400 px-1">{t('nothing_planned')}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Modal */}
            {editingDay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-pop">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white capitalize">
                                {t(editingDay as any)} - {t(editingType as any)}
                            </h3>
                            <button onClick={() => { setEditingDay(null); setEditingType(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">Fermer</button>
                        </div>

                        <div className="space-y-4">
                            {['starter', 'main', 'dessert'].map((course) => {
                                const courseKey = course as 'starter' | 'main' | 'dessert';
                                const urlKey = `${course}Url` as 'starterUrl' | 'mainUrl' | 'dessertUrl';
                                const labelKey = course === 'main' ? 'main_dish' : course;

                                return (
                                    <div key={course} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t(labelKey as any)}</label>
                                        <input 
                                            type="text"
                                            value={formData[courseKey]}
                                            onChange={e => setFormData(prev => ({ ...prev, [courseKey]: e.target.value }))}
                                            placeholder={t('name')}
                                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 outline-none"
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                type="url"
                                                value={formData[urlKey] || ''}
                                                onChange={e => setFormData(prev => ({ ...prev, [urlKey]: e.target.value }))}
                                                placeholder={t('link_placeholder')}
                                                className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 outline-none text-xs"
                                            />
                                            {formData[urlKey] && (
                                                <button 
                                                    onClick={() => handleAnalyzeUrl(courseKey)}
                                                    disabled={analyzingField === courseKey}
                                                    className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg"
                                                    title="Analyser avec l'IA"
                                                >
                                                    {analyzingField === courseKey ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                                                </button>
                                            )}
                                            {formData[urlKey] && (
                                                <a 
                                                    href={formData[urlKey]} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg"
                                                >
                                                    <ExternalLink size={16}/>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setEditingDay(null); setEditingType(null); }} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700">{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Recipe Create/Edit Modal (from Menu) --- */}
            {isRecipeModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-pop max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('new_recipe')}</h3>
                            <button onClick={() => setIsRecipeModalOpen(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_name')}</label>
                                <input 
                                    type="text" 
                                    value={recipeFormData.name}
                                    onChange={(e) => setRecipeFormData({...recipeFormData, name: e.target.value})}
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Type */}
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
                                {/* Season */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('season')}</label>
                                    <select 
                                        value={recipeFormData.season}
                                        onChange={(e) => setRecipeFormData({...recipeFormData, season: e.target.value as Season})}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                                    >
                                        <option value="">{t('none_season')}</option>
                                        <option value="all">{t('all_seasons')}</option>
                                        <option value="spring">{t('spring')}</option>
                                        <option value="summer">{t('summer')}</option>
                                        <option value="autumn">{t('autumn')}</option>
                                        <option value="winter">{t('winter')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Category */}
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

                            {/* Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_link')}</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="url" 
                                        value={recipeFormData.link}
                                        onChange={(e) => setRecipeFormData({...recipeFormData, link: e.target.value})}
                                        placeholder="https://..."
                                        className="flex-1 w-full min-w-0 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                                    />
                                    {recipeFormData.link && (
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={handleAnalyzeRecipeInModal}
                                                disabled={isAnalyzingRecipe}
                                                className="p-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center disabled:opacity-50"
                                                title="Analyser le site"
                                            >
                                                {isAnalyzingRecipe ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                            </button>
                                            <button
                                                onClick={handleCreateListFromRecipe}
                                                disabled={loadingRecipeUrl === recipeFormData.link || (recipeFormData.name ? shoppingLists.some(l => l.name === recipeFormData.name) : false)}
                                                className={`p-0 w-10 h-10 rounded-lg transition-colors flex items-center justify-center ${recipeFormData.name && shoppingLists.some(l => l.name === recipeFormData.name) ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-default' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60'}`}
                                                title="Créer une liste de courses"
                                            >
                                                {loadingRecipeUrl === recipeFormData.link ? <Loader2 size={20} className="animate-spin" /> : (recipeFormData.name && shoppingLists.some(l => l.name === recipeFormData.name) ? <Check size={20} /> : <ListPlus size={20} />)}
                                            </button>
                                            <a 
                                                href={recipeFormData.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center"
                                                title={t('link_open')}
                                            >
                                                <ExternalLink size={20} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('recipe_note')}</label>
                                <textarea 
                                    rows={3}
                                    value={recipeFormData.note}
                                    onChange={(e) => setRecipeFormData({...recipeFormData, note: e.target.value})}
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsRecipeModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                            <button onClick={handleSaveRecipe} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuDetailView;