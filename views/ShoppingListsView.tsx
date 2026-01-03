
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, createEmptyDayMenu } from '../services/AppContext';
import { IconComponent } from '../components/IconComponent';
import { 
  Plus, Trash2, Edit2, Calendar, ShoppingBag, Euro, Search, Utensils, ChevronRight, X, Shuffle, Sparkles, Link, ExternalLink, Loader2, Clock, ArrowUpNarrowWide, ArrowDownWideNarrow, Mail, Send, Settings2, Eye, Copy, AlertTriangle
} from 'lucide-react';
import { WeeklyMenu, Recipe, DishType, Season, ShoppingListItem } from '../types';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ShoppingListsView: React.FC = () => {
  const { 
    shoppingLists, addShoppingList, deleteShoppingList, duplicateShoppingList, updateShoppingList, products,
    weeklyMenus, addWeeklyMenu, deleteWeeklyMenu, duplicateWeeklyMenu, updateWeeklyMenu, generateAIWeeklyMenu,
    recipes, addRecipe, updateRecipe, deleteRecipe, analyzeRecipeUrl, recipeCategories, addRecipeCategory, deleteRecipeCategory,
    t
  } = useAppContext();
  
  const navigate = useNavigate();

  // Initialize viewMode
  const [viewMode, setViewMode] = useState<'shopping' | 'menus' | 'recipes'>('shopping');

  const [searchTerm, setSearchTerm] = useState('');
  const [randomMenuId, setRandomMenuId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // States for List Creation/Edition
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // States for Menu Creation/Edition
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuFormData, setMenuFormData] = useState<Omit<WeeklyMenu, 'id' | 'createdAt'>>({
    name: '',
    days: {
      monday: createEmptyDayMenu(),
      tuesday: createEmptyDayMenu(),
      wednesday: createEmptyDayMenu(),
      thursday: createEmptyDayMenu(),
      friday: createEmptyDayMenu(),
      saturday: createEmptyDayMenu(),
      sunday: createEmptyDayMenu(),
    }
  });
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [activeMenuDayTab, setActiveMenuDayTab] = useState<string>('monday');
  
  // States for Recipe Creation/Edition
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeFormData, setRecipeFormData] = useState<Omit<Recipe, 'id'>>({
      name: '',
      link: '',
      note: '',
      type: '',
      categoryId: '',
      season: ''
  });
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // States for Recipe Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteModalData, setNoteModalData] = useState<{id: string, note: string}>({id: '', note: ''});

  // States for Recipe Category Management
  const [isRecCatModalOpen, setIsRecCatModalOpen] = useState(false);
  const [newRecCatName, setNewRecCatName] = useState('');

  // States for AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfig, setAiConfig] = useState({
      restriction: 'none',
      dietetic: false,
      time: 'no',
      includeStarter: false,
      includeMain: true,
      includeDessert: false
  });

  // States for Link Editing (Menu)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkEditData, setLinkEditData] = useState<{ day: string, type: 'lunch'|'dinner', field: 'starterUrl'|'mainUrl'|'dessertUrl', url: string } | null>(null);

  // State for Email Configuration
  const [emailMenu, setEmailMenu] = useState<WeeklyMenu | null>(null);
  const [emailStartDay, setEmailStartDay] = useState<string>('monday');

  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string, type: 'list' | 'menu' | 'recipe'} | null>(null);
  
  // Recipe Filters
  const [recipeFilterType, setRecipeFilterType] = useState<DishType | 'all'>('all');
  const [recipeFilterSeason, setRecipeFilterSeason] = useState<Season | 'all'>('all');
  const [recipeFilterCategory, setRecipeFilterCategory] = useState<string>('all');

  // Helper to parse DD/MM/YYYY
  const parseDate = (dateStr: string): number => {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
      }
      return 0;
  };

  // --- Handlers for Shopping Lists ---
  const openListModal = (list?: typeof shoppingLists[0]) => {
    if (list) {
      setEditingListId(list.id);
      setListName(list.name);
    } else {
      setEditingListId(null);
      setListName('');
    }
    setIsListModalOpen(true);
  };

  const handleSaveList = () => {
    if (listName.trim()) {
      if (editingListId) {
        const list = shoppingLists.find(l => l.id === editingListId);
        if (list) updateShoppingList({ ...list, name: listName.trim() });
      } else {
        addShoppingList(listName.trim());
      }
      setIsListModalOpen(false);
    }
  };

  // --- Handlers for Menus ---
  const openMenuModal = (menu?: WeeklyMenu) => {
    if (menu) {
      setEditingMenuId(menu.id);
      setMenuFormData({ name: menu.name, days: JSON.parse(JSON.stringify(menu.days)) }); // Deep copy days
    } else {
      setEditingMenuId(null);
      setMenuFormData({
        name: '',
        days: {
            monday: createEmptyDayMenu(),
            tuesday: createEmptyDayMenu(),
            wednesday: createEmptyDayMenu(),
            thursday: createEmptyDayMenu(),
            friday: createEmptyDayMenu(),
            saturday: createEmptyDayMenu(),
            sunday: createEmptyDayMenu(),
        }
      });
    }
    setActiveMenuDayTab('monday');
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = () => {
    const finalName = menuFormData.name.trim() ? menuFormData.name.trim() : `Menu du ${new Date().toLocaleDateString()}`;

    if (editingMenuId) {
      const original = weeklyMenus.find(m => m.id === editingMenuId);
      if (original) {
          updateWeeklyMenu({
              ...original,
              name: finalName,
              days: menuFormData.days
          });
      }
    } else {
      addWeeklyMenu({ ...menuFormData, name: finalName });
    }
    setIsMenuModalOpen(false);
  };

  const updateMenuDay = (day: string, type: 'lunch' | 'dinner', field: string, value: string) => {
      setMenuFormData(prev => ({
          ...prev,
          days: {
              ...prev.days,
              [day]: {
                  ...prev.days[day as keyof typeof prev.days],
                  [type]: {
                      ...prev.days[day as keyof typeof prev.days][type],
                      [field]: value
                  }
              }
          }
      }));
  };

  // --- Handlers for Recipes ---
  const openRecipeModal = (recipe?: Recipe) => {
      if (recipe) {
          setEditingRecipeId(recipe.id);
          setRecipeFormData({
              name: recipe.name,
              link: recipe.link || '',
              note: recipe.note || '',
              type: recipe.type,
              categoryId: recipe.categoryId,
              season: recipe.season
          });
      } else {
          setEditingRecipeId(null);
          setRecipeFormData({
              name: '',
              link: '',
              note: '',
              type: '', 
              categoryId: '', 
              season: '' 
          });
      }
      setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = () => {
      if (!recipeFormData.name.trim()) return;
      
      const categoryId = recipeFormData.categoryId; 

      if (editingRecipeId) {
          updateRecipe({ 
              id: editingRecipeId, 
              ...recipeFormData,
              name: recipeFormData.name.trim(),
              categoryId
          });
      } else {
          addRecipe({
              ...recipeFormData,
              name: recipeFormData.name.trim(),
              categoryId
          });
      }
      setIsRecipeModalOpen(false);
  };

  const handleAnalyzeUrl = async () => {
      if (!recipeFormData.link) return;
      setIsAnalyzing(true);
      try {
          const result = await analyzeRecipeUrl(recipeFormData.link);
          
          if (!result.name && !result.note) {
              alert("L'IA n'a pas pu extraire le contenu de ce lien. Il est possible que le site bloque l'accès ou que le contenu ne soit pas une recette standard.");
          } else {
              setRecipeFormData(prev => ({
                  ...prev,
                  name: result.name || prev.name,
                  note: result.note || prev.note
              }));
          }
      } catch (error) {
          console.error(error);
          alert("Erreur technique lors de l'analyse de la recette. Vérifiez votre clé API ou votre connexion.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  // --- Note Modal ---
  const openNoteModal = (e: React.MouseEvent, recipe: Recipe) => {
      e.stopPropagation();
      setNoteModalData({ id: recipe.id, note: recipe.note || '' });
      setIsNoteModalOpen(true);
  };

  const handleSaveNote = () => {
      const recipe = recipes.find(r => r.id === noteModalData.id);
      if (recipe) {
          updateRecipe({ ...recipe, note: noteModalData.note });
      }
      setIsNoteModalOpen(false);
  };

  // --- Link Editing (Menu) ---
  const openLinkEditor = (day: string, type: 'lunch'|'dinner', field: 'starterUrl'|'mainUrl'|'dessertUrl', currentUrl?: string) => {
      setLinkEditData({ day, type, field, url: currentUrl || '' });
      setIsLinkModalOpen(true);
  };

  const saveLink = () => {
      if (linkEditData) {
          updateMenuDay(linkEditData.day, linkEditData.type, linkEditData.field, linkEditData.url);
          setIsLinkModalOpen(false);
          setLinkEditData(null);
      }
  };

  const handleAiGenerate = async () => {
      setAiLoading(true);
      try {
          const generatedDays = await generateAIWeeklyMenu({
              restriction: aiConfig.restriction,
              dietetic: aiConfig.dietetic,
              time: aiConfig.time,
              includeStarter: aiConfig.includeStarter,
              includeMain: aiConfig.includeMain,
              includeDessert: aiConfig.includeDessert
          });
          setMenuFormData(prev => ({ ...prev, days: generatedDays }));
          setIsAiModalOpen(false);
      } catch (error) {
          alert("Erreur lors de la génération (Vérifiez votre clé API).");
      } finally {
          setAiLoading(false);
      }
  };

  const toggleRandomMenu = () => {
    if (randomMenuId) {
        setRandomMenuId(null);
    } else {
        if (weeklyMenus.length > 0) {
            const randomIndex = Math.floor(Math.random() * weeklyMenus.length);
            setRandomMenuId(weeklyMenus[randomIndex].id);
            setSearchTerm(''); 
        }
    }
  };

  const toggleSortOrder = () => {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const handleOpenEmailModal = (e: React.MouseEvent, menu: WeeklyMenu) => {
    e.stopPropagation();
    setEmailMenu(menu);
    setEmailStartDay('monday'); 
  };

  const proceedSendEmail = () => {
    if (!emailMenu) return;
    const startIndex = DAYS_ORDER.indexOf(emailStartDay);
    const reorderedDays = [...DAYS_ORDER.slice(startIndex), ...DAYS_ORDER.slice(0, startIndex)];
    const subject = encodeURIComponent(`🍽️ Menu : ${emailMenu.name}`);
    let bodyContent = `Voici le menu "${emailMenu.name}" :\n\n`;
    bodyContent += `📅  PLANNING DE LA SEMAINE\n\n`;
    reorderedDays.forEach(dayKey => {
      const dayMenu = emailMenu.days[dayKey as keyof typeof emailMenu.days];
      const hasLunch = dayMenu.lunch.starter || dayMenu.lunch.main || dayMenu.lunch.dessert;
      const hasDinner = dayMenu.dinner.starter || dayMenu.dinner.main || dayMenu.dinner.dessert;
      if (hasLunch || hasDinner) {
          bodyContent += `🔶 ${t(dayKey as any).toUpperCase()}\n`;
          if (hasLunch) {
             bodyContent += `   ☀️ MIDI\n`;
             if (dayMenu.lunch.starter) bodyContent += `      • ${t('starter')} : ${dayMenu.lunch.starter}\n`;
             if (dayMenu.lunch.main) bodyContent += `      • ${t('main_dish')} : ${dayMenu.lunch.main}\n`;
             if (dayMenu.lunch.dessert) bodyContent += `      • ${t('dessert')} : ${dayMenu.lunch.dessert}\n`;
          }
          if (hasDinner) {
             bodyContent += `   🌙 SOIR\n`;
             if (dayMenu.dinner.starter) bodyContent += `      • ${t('starter')} : ${dayMenu.dinner.starter}\n`;
             if (dayMenu.dinner.main) bodyContent += `      • ${t('main_dish')} : ${dayMenu.dinner.main}\n`;
             if (dayMenu.dinner.dessert) bodyContent += `      • ${t('dessert')} : ${dayMenu.dinner.dessert}\n`;
          }
          bodyContent += `\n`;
      }
    });
    const body = encodeURIComponent(bodyContent);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setEmailMenu(null);
  };

  // --- Generic Delete ---
  const requestDelete = (e: React.MouseEvent, id: string, name: string, type: 'list' | 'menu' | 'recipe') => {
    e.stopPropagation();
    setDeleteConfirm({ id, name, type });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === 'list') {
        deleteShoppingList(deleteConfirm.id);
      } else if (deleteConfirm.type === 'menu') {
        deleteWeeklyMenu(deleteConfirm.id);
        if (randomMenuId === deleteConfirm.id) setRandomMenuId(null);
      } else if (deleteConfirm.type === 'recipe') {
          deleteRecipe(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    }
  };

  // --- Data Preparation ---
  const calculateListTotal = (items: typeof shoppingLists[0]['items']) => {
    return items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      return acc + (item.quantity * (product?.defaultPrice || 0));
    }, 0).toFixed(2);
  };

  // Filter and Sort
  const filteredLists = useMemo(() => {
    const filtered = shoppingLists.filter(list => list.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered.sort((a, b) => {
        const dateA = parseDate(a.createdAt);
        const dateB = parseDate(b.createdAt);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [shoppingLists, searchTerm, sortOrder]);
  
  const filteredMenus = useMemo(() => {
      if (randomMenuId) return weeklyMenus.filter(m => m.id === randomMenuId);
      const filtered = weeklyMenus.filter(menu => menu.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return filtered.sort((a, b) => {
        const dateA = parseDate(a.createdAt);
        const dateB = parseDate(b.createdAt);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [weeklyMenus, searchTerm, randomMenuId, sortOrder]);

  const filteredRecipes = useMemo(() => {
      return recipes.filter(recipe => {
          const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesType = recipeFilterType === 'all' || recipe.type === recipeFilterType;
          const matchesSeason = recipeFilterSeason === 'all' || recipe.season === recipeFilterSeason;
          const matchesCategory = recipeFilterCategory === 'all' || recipe.categoryId === recipeFilterCategory;
          return matchesSearch && matchesType && matchesSeason && matchesCategory;
      }).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, searchTerm, recipeFilterType, recipeFilterSeason, recipeFilterCategory]);


  // Common input class
  const inputClass = "flex-1 w-full text-sm p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 placeholder-primary-300 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";

  // Render input with link button
  const renderMealInput = (day: string, type: 'lunch'|'dinner', fieldName: 'starter'|'main'|'dessert', placeholder: string, isBold = false) => {
      const dayData = menuFormData.days[day as keyof typeof menuFormData.days];
      const mealData = dayData[type];
      const value = mealData[fieldName];
      const urlField = `${fieldName}Url` as 'starterUrl'|'mainUrl'|'dessertUrl';
      const urlValue = mealData[urlField];

      return (
          <div className="flex gap-2 items-center">
              <input 
                  placeholder={placeholder} 
                  value={value} 
                  onChange={(e) => updateMenuDay(day, type, fieldName, e.target.value)} 
                  className={`${inputClass} ${isBold ? 'font-medium' : ''}`} 
              />
              <button
                 type="button"
                 onClick={(e) => {
                     e.stopPropagation();
                     if (urlValue) {
                         openLinkEditor(day, type, urlField, urlValue);
                     } else {
                         openLinkEditor(day, type, urlField, '');
                     }
                 }}
                 className={`p-2 rounded-lg transition-colors ${urlValue ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-primary-500'}`}
              >
                  <Link size={16} />
              </button>
          </div>
      )
  };

  const getSeasonIcon = (season: Season) => {
      // Assuming icons would be here, simplifying for brevity or use imported ones
      return null; 
  };

  const getTypeIcon = (type: DishType) => {
      switch(type) {
          case 'starter': return <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">E</span>;
          case 'main': return <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">P</span>;
          case 'dessert': return <span className="text-xs font-bold text-pink-600 bg-pink-100 px-1.5 py-0.5 rounded">D</span>;
          default: return null;
      }
  };

  const showTimeWarning = aiConfig.includeStarter && aiConfig.includeMain && aiConfig.includeDessert;

  return (
    <div className="p-4 pb-24 min-h-screen bg-primary-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Title Header & Add Button */}
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-3xl font-extrabold text-primary-800 dark:text-primary-100 drop-shadow-sm leading-tight">
          {t('my_lists')}
        </h1>
        
        {/* Add Button */}
        <button
            onClick={() => {
                if (viewMode === 'menus') openMenuModal();
                else if (viewMode === 'recipes') openRecipeModal();
                else openListModal();
            }}
            className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 font-medium transition-colors"
        >
            <Plus size={18} className="mr-1" /> 
            {viewMode === 'menus' ? t('btn_add_menu') : viewMode === 'recipes' ? t('btn_add_recipe') : t('btn_add_list')}
        </button>
      </div>

      <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-6">
          {viewMode === 'menus' ? t('menus') : viewMode === 'recipes' ? t('recipes') : t('shopping')}
      </p>

      {/* Controls & Filters Container */}
      <div className="flex flex-col gap-4 mb-6">
          
          {/* Row 1: Search & Sort */}
          <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                  <input 
                      type="text" 
                      placeholder={viewMode === 'menus' ? t('search_menu') : viewMode === 'recipes' ? t('search_recipe') : t('search_list')}
                      value={searchTerm}
                      onChange={e => {
                          setSearchTerm(e.target.value);
                          if (randomMenuId) setRandomMenuId(null); 
                      }}
                      className="w-full pl-10 p-2 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 text-primary-900 dark:text-primary-100 placeholder-primary-300 dark:placeholder-slate-500"
                  />
              </div>

              {viewMode !== 'recipes' && (
                  <button 
                    onClick={toggleSortOrder}
                    className="p-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:border-primary-400 transition-all shadow-sm"
                    title={t('sort_date')}
                  >
                      {sortOrder === 'desc' ? <ArrowDownWideNarrow size={18} /> : <ArrowUpNarrowWide size={18} />}
                  </button>
              )}

              {viewMode === 'menus' && (
                  <button 
                    onClick={toggleRandomMenu}
                    className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center gap-2 font-medium ${randomMenuId ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:border-primary-400'}`}
                    title={t('random')}
                  >
                      <Shuffle size={18} />
                  </button>
              )}
          </div>
          
          {/* Row 2: Recipe Filters */}
          {viewMode === 'recipes' && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <select 
                      value={recipeFilterType} 
                      onChange={(e) => setRecipeFilterType(e.target.value as DishType | 'all')}
                      className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200"
                  >
                      <option value="all">{t('all_seasons')}</option>
                      <option value="starter">{t('starter')}</option>
                      <option value="main">{t('main_dish')}</option>
                      <option value="dessert">{t('dessert')}</option>
                  </select>
                  
                  <select 
                      value={recipeFilterSeason} 
                      onChange={(e) => setRecipeFilterSeason(e.target.value as Season | 'all')}
                      className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200"
                  >
                      <option value="all">{t('all_seasons')}</option>
                      <option value="spring">{t('spring')}</option>
                      <option value="summer">{t('summer')}</option>
                      <option value="autumn">{t('autumn')}</option>
                      <option value="winter">{t('winter')}</option>
                  </select>

                   <div className="flex items-center gap-1">
                      <select 
                          value={recipeFilterCategory} 
                          onChange={(e) => setRecipeFilterCategory(e.target.value)}
                          className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-gray-200"
                      >
                          <option value="all">Toutes Cat.</option>
                          {recipeCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                      <button onClick={() => setIsRecCatModalOpen(true)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300" title={t('manage_recipe_categories')}>
                          <Settings2 size={18} />
                      </button>
                  </div>
              </div>
          )}

          {/* Row 3: Navigation Pills */}
          <div className="flex flex-col justify-center items-center gap-3">
              <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode('menus')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'menus' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'}`}
                  >
                    {t('menus')}
                  </button>
                  <button 
                    onClick={() => setViewMode('shopping')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'shopping' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'}`}
                  >
                    {t('shopping')}
                  </button>
                  <button 
                    onClick={() => setViewMode('recipes')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${viewMode === 'recipes' ? 'bg-primary-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700'}`}
                  >
                    {t('recipes')}
                  </button>
              </div>
              
              {viewMode === 'menus' && randomMenuId && (
                  <p className="text-center text-sm font-semibold text-primary-600 dark:text-primary-400 animate-fade-in">
                      {t('random_hint')}
                  </p>
              )}
          </div>
      </div>

      {/* Grid Content */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* --- MENUS VIEW --- */}
        {viewMode === 'menus' && filteredMenus.map((menu) => (
           <div key={menu.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-primary-100 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between min-h-[100px]">
               <div className="absolute -right-6 -top-6 w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full opacity-50 transition-colors pointer-events-none"></div>
               
               <div className="relative z-10 cursor-pointer" onClick={() => navigate(`/menu/${menu.id}`)}>
                    <div className="flex justify-between items-start">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate pr-2">{menu.name}</h2>
                        <ChevronRight size={20} className="text-gray-300 dark:text-slate-600" />
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                        <span className="flex items-center text-xs text-gray-400 dark:text-slate-500">
                            <Calendar size={12} className="mr-1" /> {t('created_at')} {menu.createdAt}
                        </span>
                        
                        <div className="flex items-center gap-1 pl-2 border-l border-gray-100 dark:border-slate-700 ml-1">
                            <button onClick={(e) => handleOpenEmailModal(e, menu)} className="text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title="Envoyer par email">
                                <Mail size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openMenuModal(menu); }} className="text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); duplicateWeeklyMenu(menu.id); }} className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                <Copy size={16} />
                            </button>
                            <button onClick={(e) => requestDelete(e, menu.id, menu.name, 'menu')} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
               </div>
           </div>
        ))}

        {/* --- RECIPES VIEW --- */}
        {viewMode === 'recipes' && filteredRecipes.map((recipe) => (
            <div key={recipe.id} onClick={() => openRecipeModal(recipe)} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-primary-100 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer">
                
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{recipe.name}</h2>
                    </div>
                    {recipe.link && (
                        <a href={recipe.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg transition-colors">
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
                
                <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-wrap gap-2">
                        {recipe.categoryId && (
                            <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {recipeCategories.find(c => c.id === recipe.categoryId)?.name || 'Sans cat.'}
                            </span>
                        )}
                        {recipe.type && (
                            <span className="text-xs">
                                {getTypeIcon(recipe.type)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={(e) => openNoteModal(e, recipe)} className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <Eye size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openRecipeModal(recipe); }} className="text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => requestDelete(e, recipe.id, recipe.name, 'recipe')} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        ))}

        {/* --- SHOPPING LISTS VIEW --- */}
        {viewMode === 'shopping' && filteredLists.map((list) => (
          <div key={list.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-primary-100 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group">
             <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary-50 dark:bg-slate-700 rounded-full opacity-30 group-hover:bg-primary-100 dark:group-hover:bg-slate-600 transition-colors pointer-events-none"></div>

            <div className="relative z-10 cursor-pointer" onClick={() => navigate(`/list/${list.id}`)}>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate mb-2 pr-4">{list.name}</h2>
                
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center text-xs text-gray-400 dark:text-slate-500">
                        <Calendar size={12} className="mr-1" /> {list.createdAt}
                      </span>
                      <span className="flex items-center bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md font-medium text-xs border border-primary-100 dark:border-primary-900">
                          <ShoppingBag size={12} className="mr-1" /> {list.items.length}
                      </span>
                      <span className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-md font-medium text-xs border border-green-100 dark:border-green-900">
                          <Euro size={12} className="mr-1" /> {calculateListTotal(list.items)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-gray-100 dark:border-slate-700 ml-1">
                        <button onClick={(e) => { e.stopPropagation(); openListModal(list); }} className="text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateShoppingList(list.id); }} className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                          <Copy size={16} />
                        </button>
                        <button onClick={(e) => requestDelete(e, list.id, list.name, 'list')} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Shopping List Create/Edit Modal --- */}
      {isListModalOpen && (
           <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{editingListId ? t('edit_list') : t('new_list')}</h3>
                 <input
                  type="text"
                  placeholder={t('list_name')}
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full p-2 mb-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsListModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                    <button onClick={handleSaveList} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('save')}</button>
                </div>
             </div>
           </div>
        )}

      {/* --- Menu Create/Edit Modal --- */}
      {isMenuModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-pop relative">
                {/* Header */}
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900 rounded-t-xl">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Utensils size={18} />
                        {editingMenuId ? t('edit_menu') : t('new_menu')}
                    </h3>
                    <button onClick={() => setIsMenuModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
                </div>
                
                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Name Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('menu_name')}</label>
                        <input
                            type="text"
                            placeholder={t('menu_placeholder')}
                            value={menuFormData.name}
                            onChange={(e) => setMenuFormData({...menuFormData, name: e.target.value})}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                        />
                    </div>

                    {/* Day Tabs */}
                    <div className="flex overflow-x-auto gap-1 mb-4 pb-1 scrollbar-hide border-b border-gray-100 dark:border-slate-700">
                        {DAYS_ORDER.map(dayKey => (
                            <button
                                key={dayKey}
                                onClick={() => setActiveMenuDayTab(dayKey)}
                                className={`px-3 py-1.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeMenuDayTab === dayKey ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-700' : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
                            >
                                {t(dayKey as any).substring(0, 3)}.
                            </button>
                        ))}
                    </div>

                    {/* Meal Inputs for Active Day */}
                    <div className="space-y-6 animate-fade-in">
                         {/* Lunch */}
                         <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                             <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1 text-sm uppercase">{t('lunch')}</h4>
                             <div className="space-y-2">
                                {renderMealInput(activeMenuDayTab, 'lunch', 'starter', t('starter'))}
                                {renderMealInput(activeMenuDayTab, 'lunch', 'main', t('main_dish'), true)}
                                {renderMealInput(activeMenuDayTab, 'lunch', 'dessert', t('dessert'))}
                             </div>
                         </div>

                         {/* Dinner */}
                         <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                             <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1 text-sm uppercase">{t('dinner')}</h4>
                             <div className="space-y-2">
                                {renderMealInput(activeMenuDayTab, 'dinner', 'starter', t('starter'))}
                                {renderMealInput(activeMenuDayTab, 'dinner', 'main', t('main_dish'), true)}
                                {renderMealInput(activeMenuDayTab, 'dinner', 'dessert', t('dessert'))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-xl flex justify-between gap-3 items-center">
                    <button 
                        onClick={() => setIsAiModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                    >
                        {t('ai_fill')}
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                        <button onClick={handleSaveMenu} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow">{t('save')}</button>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* --- Recipe Create/Edit Modal --- */}
      {isRecipeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-pop max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingRecipeId ? t('edit_recipe') : t('new_recipe')}</h3>
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
                             autoFocus
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
                                 <option value="">{t('none_season')}</option>
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
                             {recipeFormData.link && (
                                <button
                                    onClick={handleAnalyzeUrl}
                                    disabled={isAnalyzing}
                                    className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors flex items-center justify-center disabled:opacity-50"
                                    title="Analyser le site pour extraire la recette"
                                >
                                    {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                </button>
                             )}
                             {recipeFormData.link && (
                                 <a 
                                     href={recipeFormData.link} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center"
                                     title={t('link_open')}
                                 >
                                     <ExternalLink size={20} />
                                 </a>
                             )}
                         </div>
                     </div>

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

      {/* --- Recipe Note Modal --- */}
      {isNoteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl h-[90vh] flex flex-col animate-pop">
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Settings2 size={20} />
                          {t('recipe_note')}
                      </h3>
                      <button onClick={() => setIsNoteModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                  
                  <textarea 
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 flex-1 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={noteModalData.note}
                      onChange={(e) => setNoteModalData({...noteModalData, note: e.target.value})}
                      placeholder="Ajoutez vos notes ici..."
                  />

                  <div className="flex justify-end gap-3 mt-4 flex-shrink-0">
                      <button onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                      <button onClick={handleSaveNote} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow">{t('save')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- Recipe Categories Modal --- */}
      {isRecCatModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('manage_recipe_categories')}</h3>
                      <button onClick={() => setIsRecCatModalOpen(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                      <input 
                          type="text"
                          placeholder={t('new_recipe_category')}
                          value={newRecCatName}
                          onChange={(e) => setNewRecCatName(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                      />
                      <button 
                          onClick={() => {
                              if(newRecCatName.trim()){
                                  addRecipeCategory(newRecCatName.trim());
                                  setNewRecCatName('');
                              }
                          }}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                          <Plus size={20} />
                      </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                      {recipeCategories.map(cat => (
                          <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                              <span className="text-slate-700 dark:text-slate-200">{cat.name}</span>
                              <button 
                                  onClick={() => deleteRecipeCategory(cat.id)}
                                  className="text-red-400 hover:text-red-600"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- AI Config Modal --- */}
      {isAiModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Sparkles className="text-purple-500" size={20} />
                          {t('ai_config_title')}
                      </h3>
                      <button onClick={() => setIsAiModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
                  </div>

                  {/* AI Options */}
                  <div className="space-y-4 mb-6">
                      
                      {/* Course Selection */}
                      <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                          <p className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">{t('ai_courses_title')}</p>
                          <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      checked={aiConfig.includeStarter}
                                      onChange={(e) => setAiConfig({...aiConfig, includeStarter: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500 bg-white border-gray-300 shadow-sm"
                                  />
                                  <span className="text-slate-700 dark:text-slate-200 text-sm">{t('starter')}</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      checked={aiConfig.includeMain}
                                      onChange={(e) => setAiConfig({...aiConfig, includeMain: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500 bg-white border-gray-300 shadow-sm"
                                  />
                                  <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">{t('main_dish')}</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="checkbox" 
                                      checked={aiConfig.includeDessert}
                                      onChange={(e) => setAiConfig({...aiConfig, includeDessert: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500 bg-white border-gray-300 shadow-sm"
                                  />
                                  <span className="text-slate-700 dark:text-slate-200 text-sm">{t('dessert')}</span>
                              </label>
                          </div>
                      </div>

                      {/* Restrictions */}
                      <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Restriction</p>
                          <div className="flex flex-col gap-2">
                              {['none', 'veg', 'nopork'].map(r => (
                                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                          type="radio" 
                                          name="restriction" 
                                          value={r} 
                                          checked={aiConfig.restriction === r}
                                          onChange={(e) => setAiConfig({...aiConfig, restriction: e.target.value})}
                                          className="text-primary-600 focus:ring-primary-500"
                                      />
                                      <span className="text-slate-700 dark:text-slate-200">
                                          {r === 'none' && t('ai_restriction_none')}
                                          {r === 'veg' && t('ai_restriction_veg')}
                                          {r === 'nopork' && t('ai_restriction_nopork')}
                                      </span>
                                  </label>
                              ))}
                          </div>
                      </div>

                      {/* Dietetic */}
                      <div>
                          <label className="flex items-center gap-2 cursor-pointer bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-900/30">
                              <input 
                                  type="checkbox" 
                                  checked={aiConfig.dietetic}
                                  onChange={(e) => setAiConfig({...aiConfig, dietetic: e.target.checked})}
                                  className="rounded text-green-600 focus:ring-green-500 w-5 h-5 bg-white border-gray-300 shadow-sm"
                              />
                              <span className="text-green-800 dark:text-green-300 font-medium">{t('ai_dietetic')}</span>
                          </label>
                      </div>

                      {/* Time */}
                      <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Temps</p>
                          <div className="flex flex-col gap-2">
                               <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="radio" 
                                      name="time" 
                                      value="yes"
                                      checked={aiConfig.time === 'yes'}
                                      onChange={(e) => setAiConfig({...aiConfig, time: e.target.value})}
                                  />
                                  <span className="text-slate-700 dark:text-slate-200">{t('ai_time_yes')}</span>
                               </label>
                               <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="radio" 
                                      name="time" 
                                      value="no"
                                      checked={aiConfig.time === 'no'}
                                      onChange={(e) => setAiConfig({...aiConfig, time: e.target.value})}
                                  />
                                  <span className="text-slate-700 dark:text-slate-200">{t('ai_time_no')}</span>
                               </label>
                          </div>
                      </div>
                  </div>

                  {/* Warnings */}
                  <div className="space-y-2 mb-6">
                       {/* General AI Warning */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-xs text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30 flex items-start gap-2">
                          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                          <span>{t('ai_warning')}</span>
                      </div>

                      {/* Time Warning for Full Search */}
                      {showTimeWarning && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-xs text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 flex items-start gap-2 animate-fade-in">
                            <Clock size={14} className="flex-shrink-0 mt-0.5" />
                            <span className="font-semibold">{t('ai_warning_long')}</span>
                        </div>
                      )}
                  </div>

                  <button 
                      onClick={handleAiGenerate}
                      disabled={aiLoading}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                      {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      {aiLoading ? t('ai_generating') : t('ai_search')}
                  </button>
              </div>
          </div>
      )}

      {/* --- Email Configuration Modal --- */}
      {emailMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[65] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <Mail size={18} /> Envoyer le menu
                 </h3>
                 <button onClick={() => setEmailMenu(null)}><X className="text-gray-400 hover:text-red-500" /></button>
             </div>
             
             <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
               Choisissez le jour de début de la semaine pour l'affichage dans l'email.
             </p>

             <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Commencer par</label>
                 <select 
                    value={emailStartDay} 
                    onChange={(e) => setEmailStartDay(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 outline-none focus:ring-2 focus:ring-primary-500"
                 >
                     {DAYS_ORDER.map(day => (
                         <option key={day} value={day}>{t(day as any)}</option>
                     ))}
                 </select>
             </div>

             <button 
                 onClick={proceedSendEmail}
                 className="w-full py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
             >
                 <Send size={16} /> Envoyer
             </button>
          </div>
        </div>
      )}

      {/* --- Link Editor Modal --- */}
      {isLinkModalOpen && linkEditData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('link_edit')}</h3>
                  
                  <div className="flex gap-2 mb-4">
                      <input 
                          type="url"
                          placeholder={t('link_placeholder')}
                          value={linkEditData.url}
                          onChange={(e) => setLinkEditData({...linkEditData, url: e.target.value})}
                          className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                          autoFocus
                      />
                      {linkEditData.url && (
                          <button 
                              onClick={() => window.open(linkEditData.url, '_blank')}
                              className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg"
                              title={t('link_open')}
                          >
                              <ExternalLink size={20} />
                          </button>
                      )}
                  </div>

                  <div className="flex justify-end gap-3">
                      <button onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                      <button onClick={saveLink} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{t('validate')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex flex-col items-center text-center mb-4">
               <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-3 text-red-500">
                  <AlertTriangle size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('delete_confirm')}</h3>
               <p className="text-gray-600 dark:text-slate-300 mt-2">
                 {t('sure_delete')} <span className="font-semibold">"{deleteConfirm.name}"</span> ?
                 <br/><span className="text-xs text-red-400 mt-1 block">{t('delete_irreversible')}</span>
               </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 shadow-md"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListsView;
