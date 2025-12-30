
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { IconComponent } from '../components/IconComponent';
import { ArrowLeft, Eraser, Check, RotateCcw } from 'lucide-react';
import { ShoppingListItem } from '../types';

const ActiveShoppingView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shoppingLists, updateShoppingList, products, categories, stores } = useAppContext();
  
  const list = shoppingLists.find(l => l.id === id);
  const [showFireworks, setShowFireworks] = useState(false);

  const currentStoreId = list?.storeId;
  const currentStore = stores.find(s => s.id === currentStoreId);

  const checkedCount = useMemo(() => {
      return list?.items.filter(i => i.isChecked).length || 0;
  }, [list]);

  const toggleCheck = (productId: string) => {
    if (!list) return;
    const updatedItems = list.items.map(i => 
      i.productId === productId ? { ...i, isChecked: !i.isChecked } : i
    );
    
    const allChecked = updatedItems.every(i => i.isChecked);
    if (allChecked && !list.items.every(i => i.isChecked)) {
       setShowFireworks(true);
    }

    updateShoppingList({ ...list, items: updatedItems });
  };

  const clearChecked = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!list || checkedCount === 0) return;

    const remainingItems = list.items.filter(i => !i.isChecked);
    updateShoppingList({ ...list, items: remainingItems });
  };

  const { activeGroups, checkedGroups } = useMemo(() => {
    if (!list || !currentStore) return { activeGroups: [], checkedGroups: [] };

    const itemsByCat = new Map<string, ShoppingListItem[]>();
    list.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if(product) {
            const current = itemsByCat.get(product.categoryId) || [];
            itemsByCat.set(product.categoryId, [...current, item]);
        }
    });

    const sortedCats = [...currentStore.categoryOrder];
    categories.forEach(c => {
      if (!sortedCats.includes(c.id)) sortedCats.push(c.id);
    });

    const activeRes: { category: any, items: ShoppingListItem[] }[] = [];
    const checkedRes: { category: any, items: ShoppingListItem[] }[] = [];

    sortedCats.forEach(catId => {
        const category = categories.find(c => c.id === catId);
        const allItems = itemsByCat.get(catId) || [];
        
        const activeItems = allItems.filter(i => !i.isChecked);
        const doneItems = allItems.filter(i => i.isChecked);

        if (activeItems.length > 0) activeRes.push({ category, items: activeItems });
        if (doneItems.length > 0) checkedRes.push({ category, items: doneItems });
    });

    return { activeGroups: activeRes, checkedGroups: checkedRes };

  }, [list, products, currentStore, categories]);


  const progress = useMemo(() => {
     if(!list || list.items.length === 0) return 0;
     const checked = checkedCount;
     return Math.round((checked / list.items.length) * 100);
  }, [list, checkedCount]);
  
  const itemsRemaining = list ? list.items.filter(i => !i.isChecked).length : 0;


  if (!list) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Immersive Header */}
      <div className="bg-white dark:bg-slate-900 p-4 shadow-md flex justify-between items-center z-20 gap-3 transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
           <ArrowLeft size={24} className="text-gray-700 dark:text-slate-200"/>
        </button>
        <div className="flex-1">
             {/* Progress Bar - Thicker */}
             <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden relative shadow-inner">
                 <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                 />
                 <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 drop-shadow-sm mix-blend-difference filter invert-0 dark:invert">
                    {itemsRemaining === 0 ? 'Terminé !' : `${itemsRemaining} restant(s)`}
                 </span>
             </div>
        </div>
        <button 
            type="button"
            onClick={clearChecked} 
            disabled={checkedCount === 0}
            className={`p-2 rounded-full transition-colors ${checkedCount > 0 ? 'bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50' : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed'}`} 
            title="Effacer les articles barrés"
        >
           <Eraser size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 scroll-smooth">
         
         {/* Active Items */}
         <div className="space-y-6">
            {activeGroups.map(({ category, items }) => {
                const categoryTotal = items.reduce((acc, item) => {
                    const product = products.find(p => p.id === item.productId);
                    return acc + (item.quantity * (product?.defaultPrice || 0));
                }, 0).toFixed(2);
                
                return (
                <div key={category.id}>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-primary-700 dark:text-primary-400 mb-3 border-b-2 border-primary-100 dark:border-slate-800 pb-1">
                        <IconComponent name={category.iconName} size={28} />
                        {category.name}
                        <span className="ml-auto text-sm bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">{categoryTotal} €</span>
                    </h3>
                    <div className="space-y-3">
                        {items.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if(!product) return null;
                            const displayUnit = item.unit || product.defaultUnit;
                            return (
                                <div 
                                    key={item.productId}
                                    onClick={() => toggleCheck(item.productId)}
                                    className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border-l-8 border-primary-500 dark:border-primary-400 flex justify-between items-center active:scale-95 transition-transform cursor-pointer"
                                >
                                    <span className="text-xl font-medium text-slate-800 dark:text-slate-100">{product.name}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{item.quantity}</span>
                                        <span className="text-sm font-medium text-primary-400 dark:text-primary-300">{displayUnit}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )})}
         </div>

         {/* Separator if needed */}
         {activeGroups.length > 0 && checkedGroups.length > 0 && (
             <div className="my-8 flex items-center justify-center text-gray-300 dark:text-slate-700">
                 <span className="border-t border-gray-300 dark:border-slate-700 w-full"></span>
                 <span className="px-4 text-sm font-medium uppercase tracking-widest">Terminé</span>
                 <span className="border-t border-gray-300 dark:border-slate-700 w-full"></span>
             </div>
         )}

         {/* Checked Items (Moved to bottom) */}
         <div className="space-y-4 opacity-60 grayscale transition-all duration-500">
            {checkedGroups.map(({ category, items }) => (
                <div key={category.id + '-checked'}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-500 mb-2 pl-2">{category.name}</h3>
                     <div className="space-y-2">
                        {items.map(item => {
                             const product = products.find(p => p.id === item.productId);
                             if(!product) return null;
                             return (
                                 <div 
                                     key={item.productId}
                                     onClick={() => toggleCheck(item.productId)}
                                     className="bg-gray-100 dark:bg-slate-800 p-3 rounded-lg flex justify-between items-center cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-slate-600"
                                 >
                                     <span className="text-lg line-through text-gray-500 dark:text-slate-400">{product.name}</span>
                                     <RotateCcw size={16} className="text-gray-400 dark:text-slate-500" />
                                 </div>
                             )
                        })}
                     </div>
                </div>
            ))}
         </div>
         
         {/* Success Message */}
         {showFireworks && (
            <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center animate-fade-in p-6 text-center">
                 <div className="text-6xl mb-4 animate-bounce">🎆 🎇</div>
                 <h2 className="text-3xl font-extrabold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Courses Terminées !</h2>
                 <p className="text-gray-300 mb-8">Bravo, vous avez tout trouvé.</p>
                 <button 
                    onClick={() => { setShowFireworks(false); navigate('/'); }}
                    className="bg-white text-primary-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-primary-50 shadow-xl transform transition hover:scale-105"
                 >
                    OK
                 </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default ActiveShoppingView;
