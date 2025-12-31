
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { IconComponent } from '../components/IconComponent';
import { ArrowLeft, Play, ChevronDown, ChevronUp, Plus, Minus, Search, X, Trash2 } from 'lucide-react';
import { ShoppingListItem } from '../types';
import { UnitManager } from '../components/UnitManager';

const ListDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
      shoppingLists, updateShoppingList, products, categories, stores, addProduct,
      units, t, t_cat, t_prod, t_unit, language
  } = useAppContext();
  
  const list = shoppingLists.find(l => l.id === id);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<string[]>([]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState<{
      name: string;
      categoryId: string;
      defaultPrice: string | number;
      defaultUnit: string;
  }>({
      name: '',
      categoryId: '',
      defaultPrice: '',
      defaultUnit: 'Aucune'
  });

  const currentStoreId = list?.storeId || stores.find(s => s.isFavorite)?.id;
  const currentStore = stores.find(s => s.id === currentStoreId);

  const handleStoreChange = (storeId: string) => {
    if (list) updateShoppingList({ ...list, storeId });
  };

  const organizedItems = useMemo(() => {
    if (!list || !currentStore) return [];

    const itemsByCat = new Map<string, ShoppingListItem[]>();
    
    list.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const catId = product.categoryId;
        const current = itemsByCat.get(catId) || [];
        itemsByCat.set(catId, [...current, item]);
      }
    });

    const sortedCats = [...currentStore.categoryOrder];
    categories.forEach(c => {
      if (!sortedCats.includes(c.id)) sortedCats.push(c.id);
    });

    return sortedCats.map(catId => {
      const category = categories.find(c => c.id === catId);
      const items = itemsByCat.get(catId) || [];
      if (items.length === 0) return null;
      return { category, items };
    }).filter(g => g !== null) as { category: any, items: ShoppingListItem[] }[];

  }, [list, products, currentStore, categories]);

  const productSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    const existingIds = list?.items.map(i => i.productId) || [];
    return products
      .filter(p => !existingIds.includes(p.id) && t_prod(p.name).toLowerCase().includes(lower))
      .slice(0, 5);
  }, [searchTerm, products, list, t_prod]);

  const handleAddItem = (productId: string) => {
    if (list) {
      const product = products.find(p => p.id === productId);
      updateShoppingList({
        ...list,
        items: [...list.items, { productId, quantity: 1, unit: product?.defaultUnit || 'Aucune', isChecked: false }]
      });
      setSearchTerm('');
    }
  };

  const handleRemoveItem = (productId: string) => {
    if (list) {
      updateShoppingList({
        ...list,
        items: list.items.filter(i => i.productId !== productId)
      });
    }
  };

  const updateItemQuantity = (productId: string, delta: number) => {
      if(!list) return;
      const updatedItems = list.items.map(item => {
          if(item.productId === productId) {
              const newQty = Math.max(1, item.quantity + delta);
              return { ...item, quantity: newQty };
          }
          return item;
      });
      updateShoppingList({ ...list, items: updatedItems });
  };

  const updateItemUnit = (productId: string, newUnit: string) => {
      if(!list) return;
      const updatedItems = list.items.map(item => {
          if(item.productId === productId) {
              return { ...item, unit: newUnit };
          }
          return item;
      });
      updateShoppingList({ ...list, items: updatedItems });
  };

  const toggleCatCollapse = (catId: string) => {
    setCollapsedCats(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);
  };

  const openCreateModal = () => {
    setNewProductData({
        name: searchTerm,
        categoryId: categories[0]?.id || '',
        defaultPrice: '',
        defaultUnit: units.includes('Aucune') ? 'Aucune' : (units[0] || '')
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateAndAdd = () => {
     if(!newProductData.name || !newProductData.categoryId) return;
     
     let parsedPrice = 0;
     if (typeof newProductData.defaultPrice === 'number') {
         parsedPrice = newProductData.defaultPrice;
     } else if (newProductData.defaultPrice) {
         const normalized = newProductData.defaultPrice.replace(',', '.');
         parsedPrice = parseFloat(normalized);
         if (isNaN(parsedPrice)) parsedPrice = 0;
     }

     const newId = addProduct({
         name: newProductData.name,
         categoryId: newProductData.categoryId,
         defaultPrice: parsedPrice,
         defaultUnit: newProductData.defaultUnit
     });

     if (list) {
        updateShoppingList({
            ...list,
            items: [...list.items, { 
                productId: newId, 
                quantity: 1, 
                unit: newProductData.defaultUnit, 
                isChecked: false 
            }]
        });
        setSearchTerm('');
     }

     setIsCreateModalOpen(false);
  };

  if (!list) return <div className="text-center p-10 dark:text-white">Liste introuvable</div>;

  return (
    <div className="flex flex-col h-screen bg-primary-50 dark:bg-slate-950 relative transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-sm z-10 flex flex-col gap-3 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 dark:text-slate-300"><ArrowLeft /></button>
          <h1 className="font-bold text-lg truncate flex-1 text-center text-slate-800 dark:text-white">{list.name}</h1>
          <div className="w-8"></div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">{t('store')} :</span>
          <select 
            value={currentStoreId} 
            onChange={(e) => handleStoreChange(e.target.value)}
            className="flex-1 p-2 bg-primary-50 dark:bg-slate-800 border-none rounded-lg text-primary-700 dark:text-primary-300 font-semibold focus:ring-2 focus:ring-primary-300 outline-none"
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.isFavorite ? '★' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-52">
        {organizedItems.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-slate-500 mt-10">
            <p>{t('list_empty')}</p>
            <p className="text-sm">{t('add_items_below')}</p>
          </div>
        ) : (
          organizedItems.map(({ category, items }) => {
            const categoryTotal = items.reduce((acc, item) => {
                const product = products.find(p => p.id === item.productId);
                return acc + (item.quantity * (product?.defaultPrice || 0));
            }, 0).toFixed(2);

            return (
            <div key={category.id} className="mb-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary-100 dark:border-slate-800 overflow-hidden">
              <div 
                onClick={() => toggleCatCollapse(category.id)}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <IconComponent name={category.iconName} size={18} className="text-primary-500 dark:text-primary-400" />
                  {t_cat(category.name)}
                  <div className="flex gap-2 ml-1">
                    <span className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{items.length}</span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">{categoryTotal} €</span>
                  </div>
                </div>
                <div className="text-gray-500 dark:text-slate-400">
                  {collapsedCats.includes(category.id) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
              </div>
              
              {!collapsedCats.includes(category.id) && (
                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    const currentUnit = item.unit || product.defaultUnit || 'Aucune';

                    return (
                      <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 gap-2">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{t_prod(product.name)}</span>
                        
                        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                           {/* Quantity Controls - Resized Smaller */}
                           <div className="flex items-center bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 h-10 shadow-sm">
                               <button 
                                   onClick={() => updateItemQuantity(item.productId, -1)} 
                                   className="h-full px-3 text-gray-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
                               >
                                   <Minus size={18}/>
                               </button>
                               <span className="min-w-[40px] text-center font-bold text-base text-slate-700 dark:text-slate-200">{item.quantity}</span>
                               <button 
                                   onClick={() => updateItemQuantity(item.productId, 1)} 
                                   className="h-full px-3 text-gray-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
                               >
                                   <Plus size={18}/>
                               </button>
                           </div>

                           {/* Unit Selector - Resized Smaller */}
                           <select 
                               value={currentUnit}
                               onChange={(e) => updateItemUnit(item.productId, e.target.value)}
                               className="h-10 px-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-base text-gray-600 dark:text-slate-300 focus:border-primary-500 outline-none max-w-[120px] shadow-sm"
                           >
                               {units.map(u => (
                                   <option key={u} value={u}>{t_unit(u)}</option>
                               ))}
                           </select>

                           {/* Remove Button - Red Trash Can */}
                           <button 
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-red-500 hover:text-red-700 ml-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] absolute bottom-[62px] w-full z-20 transition-colors duration-300">
        
        {/* Start Shopping Button */}
        <button 
            onClick={() => navigate(`/shop/${id}`)}
            className="w-full mb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all"
        >
          <Play size={20} fill="currentColor" /> {t('start_shopping')}
        </button>

        {/* Add Item Input */}
        <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('add_item')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-primary-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none shadow-inner text-primary-900 dark:text-primary-100 placeholder-primary-400 dark:placeholder-slate-500"
              />
            </div>
          
          {/* Autocomplete & Create Dropdown */}
          {(productSuggestions.length > 0 || searchTerm.trim().length > 0) && (
            <div className="absolute bottom-full left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl mb-2 overflow-hidden z-50">
              {productSuggestions.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddItem(p.id)}
                  className="w-full text-left p-3 hover:bg-primary-50 dark:hover:bg-slate-700 border-b last:border-0 border-gray-50 dark:border-slate-700 flex items-center justify-start gap-2"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t_prod(p.name)}</span>
                  <span className="text-sm text-gray-500 dark:text-slate-400">({t_cat(categories.find(c => c.id === p.categoryId)?.name || '')})</span>
                </button>
              ))}
              
              {searchTerm.trim().length > 0 && !productSuggestions.some(p => t_prod(p.name).toLowerCase() === searchTerm.toLowerCase()) && (
                  <button 
                     onClick={openCreateModal}
                     className="w-full text-left p-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold border-t border-gray-100 dark:border-slate-700 flex items-center gap-2"
                  >
                      <Plus size={18} />
                      {t('create_item')} "{searchTerm}"
                  </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create New Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-pop">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('new_article')}</h3>
                    <button onClick={() => setIsCreateModalOpen(false)}><X className="text-gray-400 hover:text-red-500"/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('name')}</label>
                        <input 
                            type="text" 
                            value={newProductData.name} 
                            onChange={e => setNewProductData({...newProductData, name: e.target.value})}
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('aisle')}</label>
                        <select 
                            value={newProductData.categoryId} 
                            onChange={e => setNewProductData({...newProductData, categoryId: e.target.value})}
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                        >
                            {categories.map(c => <option key={c.id} value={c.id}>{t_cat(c.name)}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('price')}</label>
                        <div className="w-1/2">
                            <input 
                                type="number" step="0.01" inputMode="decimal" placeholder="0.00"
                                value={newProductData.defaultPrice} 
                                onChange={e => setNewProductData({...newProductData, defaultPrice: e.target.value})}
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('unit')}</label>
                        <UnitManager 
                            value={newProductData.defaultUnit}
                            onChange={(val) => setNewProductData({...newProductData, defaultUnit: val})}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleCreateAndAdd}
                    className="w-full mt-6 bg-primary-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary-700"
                >
                    {t('create_and_add')}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ListDetailView;
