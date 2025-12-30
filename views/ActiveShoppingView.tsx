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

  // Derived state
  const currentStoreId = list?.storeId;
  const currentStore = stores.find(s => s.id === currentStoreId);

  const toggleCheck = (productId: string) => {
    if (!list) return;
    const updatedItems = list.items.map(i => 
      i.productId === productId ? { ...i, isChecked: !i.isChecked } : i
    );
    
    // Check for completion
    const allChecked = updatedItems.every(i => i.isChecked);
    if (allChecked && !list.items.every(i => i.isChecked)) {
       setShowFireworks(true);
    }

    updateShoppingList({ ...list, items: updatedItems });
  };

  const clearChecked = () => {
    if (!list) return;
    if(window.confirm("Supprimer définitivement les articles barrés ?")) {
        const remainingItems = list.items.filter(i => !i.isChecked);
        updateShoppingList({ ...list, items: remainingItems });
    }
  };

  // Grouping logic (similar to Detail view but strictly separating Checked items)
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


  // Progress
  const progress = useMemo(() => {
     if(!list || list.items.length === 0) return 0;
     const checked = list.items.filter(i => i.isChecked).length;
     return Math.round((checked / list.items.length) * 100);
  }, [list]);
  
  const itemsRemaining = list ? list.items.filter(i => !i.isChecked).length : 0;


  if (!list) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      {/* Immersive Header */}
      <div className="bg-white p-4 shadow-md flex justify-between items-center z-20">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
           <ArrowLeft size={24} className="text-gray-700"/>
        </button>
        <div className="flex-1 px-4">
             {/* Progress Bar */}
             <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
                 <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                 />
                 <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {itemsRemaining === 0 ? 'Terminé !' : `${itemsRemaining} restant(s)`}
                 </span>
             </div>
        </div>
        <button onClick={clearChecked} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100" title="Effacer les articles barrés">
           <Eraser size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 scroll-smooth">
         
         {/* Active Items */}
         <div className="space-y-6">
            {activeGroups.map(({ category, items }) => (
                <div key={category.id}>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-indigo-700 mb-3 border-b-2 border-indigo-100 pb-1">
                        <IconComponent name={category.iconName} size={28} />
                        {category.name}
                    </h3>
                    <div className="space-y-3">
                        {items.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if(!product) return null;
                            return (
                                <div 
                                    key={item.productId}
                                    onClick={() => toggleCheck(item.productId)}
                                    className="bg-white p-4 rounded-xl shadow-md border-l-8 border-indigo-500 flex justify-between items-center active:scale-95 transition-transform cursor-pointer"
                                >
                                    <span className="text-xl font-medium text-slate-800">{product.name}</span>
                                    <span className="text-2xl font-bold text-indigo-600">{item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
         </div>

         {/* Separator if needed */}
         {activeGroups.length > 0 && checkedGroups.length > 0 && (
             <div className="my-8 flex items-center justify-center text-gray-300">
                 <span className="border-t border-gray-300 w-full"></span>
                 <span className="px-4 text-sm font-medium uppercase tracking-widest">Terminé</span>
                 <span className="border-t border-gray-300 w-full"></span>
             </div>
         )}

         {/* Checked Items (Moved to bottom) */}
         <div className="space-y-4 opacity-60 grayscale transition-all duration-500">
            {checkedGroups.map(({ category, items }) => (
                <div key={category.id + '-checked'}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 pl-2">{category.name}</h3>
                     <div className="space-y-2">
                        {items.map(item => {
                             const product = products.find(p => p.id === item.productId);
                             if(!product) return null;
                             return (
                                 <div 
                                     key={item.productId}
                                     onClick={() => toggleCheck(item.productId)}
                                     className="bg-gray-100 p-3 rounded-lg flex justify-between items-center cursor-pointer border border-transparent hover:border-gray-300"
                                 >
                                     <span className="text-lg line-through text-gray-500">{product.name}</span>
                                     <RotateCcw size={16} className="text-gray-400" />
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
                    className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-indigo-50 shadow-xl transform transition hover:scale-105"
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
