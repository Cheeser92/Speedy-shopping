
import React, { useState } from 'react';
import { useAppContext, createEmptyDayMenu } from '../services/AppContext';
import { Plus, Trash2, Copy, Edit2, Calendar, ShoppingBag, AlertTriangle, Euro, Search, Utensils, ChevronRight, X, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WeeklyMenu } from '../types';

type ViewMode = 'menus' | 'shopping';

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ShoppingListsView: React.FC = () => {
  const { 
    shoppingLists, addShoppingList, deleteShoppingList, duplicateShoppingList, updateShoppingList, products,
    weeklyMenus, addWeeklyMenu, deleteWeeklyMenu, duplicateWeeklyMenu, updateWeeklyMenu,
    t
  } = useAppContext();
  
  const [viewMode, setViewMode] = useState<ViewMode>('menus'); // Default to menus
  const [searchTerm, setSearchTerm] = useState('');
  const [randomMenuId, setRandomMenuId] = useState<string | null>(null);
  
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
  
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string, type: 'list' | 'menu'} | null>(null);
  
  const navigate = useNavigate();

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
    if (menuFormData.name.trim()) {
      if (editingMenuId) {
        const original = weeklyMenus.find(m => m.id === editingMenuId);
        if (original) {
            updateWeeklyMenu({
                ...original,
                name: menuFormData.name,
                days: menuFormData.days
            });
        }
      } else {
        addWeeklyMenu(menuFormData);
      }
      setIsMenuModalOpen(false);
    }
  };

  const updateMenuDay = (day: string, type: 'lunch' | 'dinner', field: 'starter' | 'main' | 'dessert', value: string) => {
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

  const toggleRandomMenu = () => {
    if (randomMenuId) {
        setRandomMenuId(null);
    } else {
        if (weeklyMenus.length > 0) {
            const randomIndex = Math.floor(Math.random() * weeklyMenus.length);
            setRandomMenuId(weeklyMenus[randomIndex].id);
            setSearchTerm(''); // Clear search to show the random item
        }
    }
  };

  // --- Generic Delete ---
  const requestDelete = (e: React.MouseEvent, id: string, name: string, type: 'list' | 'menu') => {
    e.stopPropagation();
    setDeleteConfirm({ id, name, type });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === 'list') {
        deleteShoppingList(deleteConfirm.id);
      } else {
        deleteWeeklyMenu(deleteConfirm.id);
        if (randomMenuId === deleteConfirm.id) setRandomMenuId(null);
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

  const filteredLists = shoppingLists.filter(list => 
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Logic: If random mode is active, show only that menu. Otherwise, follow search term.
  const filteredMenus = randomMenuId 
    ? weeklyMenus.filter(m => m.id === randomMenuId)
    : weeklyMenus.filter(menu => menu.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Common input class for consistent styling
  const inputClass = "w-full text-sm p-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 placeholder-primary-300 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";

  return (
    <div className="p-4 pb-24 min-h-screen bg-primary-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Title Header & Add Button */}
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-3xl font-extrabold text-primary-800 dark:text-primary-100 drop-shadow-sm leading-tight">
          {t('my_lists')}
        </h1>
        
        {/* Add Button */}
        <button
            onClick={() => viewMode === 'menus' ? openMenuModal() : openListModal()}
            className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 font-medium transition-colors"
        >
            <Plus size={18} className="mr-1" /> {viewMode === 'menus' ? t('new_menu') : t('new_list')}
        </button>
      </div>

      <p className="text-lg font-medium text-primary-600 dark:text-primary-400 mb-6">
          {viewMode === 'menus' ? t('menus') : t('shopping')}
      </p>

      {/* Controls & Filters */}
      <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                  <input 
                      type="text" 
                      placeholder={viewMode === 'menus' ? t('search_menu') : t('search_list')}
                      value={searchTerm}
                      onChange={e => {
                          setSearchTerm(e.target.value);
                          if (randomMenuId) setRandomMenuId(null); // Disable random if user types
                      }}
                      className="w-full pl-10 p-2 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 text-primary-900 dark:text-primary-100 placeholder-primary-300 dark:placeholder-slate-500"
                  />
              </div>
              {viewMode === 'menus' && (
                  <button 
                    onClick={toggleRandomMenu}
                    className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center gap-2 font-medium ${randomMenuId ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:border-primary-400'}`}
                    title={t('random')}
                  >
                      <Shuffle size={18} />
                      <span className="hidden sm:inline">{t('random')}</span>
                  </button>
              )}
          </div>

          <div className="flex flex-col justify-center items-center gap-3">
              {/* Filter Pills */}
              <div className="flex gap-2">
                  <button 
                    onClick={() => { setViewMode('menus'); setRandomMenuId(null); }}
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
              </div>
              
              {/* Random Selection Hint Text */}
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-pop">
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
                            className={inputClass}
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
                                <input placeholder={t('starter')} value={menuFormData.days[activeMenuDayTab as keyof typeof menuFormData.days].lunch.starter} onChange={(e) => updateMenuDay(activeMenuDayTab, 'lunch', 'starter', e.target.value)} className={inputClass} />
                                <input placeholder={t('main_dish')} value={menuFormData.days[activeMenuDayTab as keyof typeof menuFormData.days].lunch.main} onChange={(e) => updateMenuDay(activeMenuDayTab, 'lunch', 'main', e.target.value)} className={`${inputClass} font-medium`} />
                                <input placeholder={t('dessert')} value={menuFormData.days[activeMenuDayTab as keyof typeof menuFormData.days].lunch.dessert} onChange={(e) => updateMenuDay(activeMenuDayTab, 'lunch', 'dessert', e.target.value)} className={inputClass} />
                             </div>
                         </div>

                         {/* Dinner */}
                         <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                             <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1 text-sm uppercase">{t('dinner')}</h4>
                             <div className="space-y-2">
                                <input placeholder={t('starter')} value={menuFormData.days[activeMenuDayTab as keyof typeof menuFormData.days].dinner.starter} onChange={(e) => updateMenuDay(activeMenuDayTab, 'dinner', 'starter', e.target.value)} className={inputClass} />
                                <input placeholder={t('main_dish')} value={menuFormData.days[activeMenuDayTab as keyof typeof menuFormData.days].dinner.main} onChange={(e) => updateMenuDay(activeMenuDayTab, 'dinner', 'main', e.target.value)} className={`${inputClass} font-medium`} />
                                <input placeholder={t('dessert')} value={menuFormData.days[activeMenuDayTab as keyof typeof menuFormData.days].dinner.dessert} onChange={(e) => updateMenuDay(activeMenuDayTab, 'dinner', 'dessert', e.target.value)} className={inputClass} />
                             </div>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-xl flex justify-end gap-3">
                    <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                    <button onClick={handleSaveMenu} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow">{t('save')}</button>
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
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('delete_confirm')}</h3>
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
