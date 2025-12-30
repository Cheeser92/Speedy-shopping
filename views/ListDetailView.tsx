import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../services/AppContext';
import { IconComponent } from '../components/IconComponent';
import { ArrowLeft, Play, ChevronDown, ChevronUp, Plus, Minus, Search } from 'lucide-react';
import { ShoppingListItem } from '../types';

const ListDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shoppingLists, updateShoppingList, products, categories, stores } = useAppContext();
  
  const list = shoppingLists.find(l => l.id === id);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [collapsedCats, setCollapsedCats] = useState<string[]>([]);

  // Derived state: Current Store Config
  const currentStoreId = list?.storeId || stores.find(s => s.isFavorite)?.id;
  const currentStore = stores.find(s => s.id === currentStoreId);

  // Helper to change store
  const handleStoreChange = (storeId: string) => {
    if (list) updateShoppingList({ ...list, storeId });
  };

  // Organize items by Store Category Order
  const organizedItems = useMemo(() => {
    if (!list || !currentStore) return [];

    const itemsByCat = new Map<string, ShoppingListItem[]>();
    
    // Group items
    list.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const catId = product.categoryId;
        const current = itemsByCat.get(catId) || [];
        itemsByCat.set(catId, [...current, item]);
      }
    });

    // Sort categories based on store order
    const sortedCats = [...currentStore.categoryOrder];
    // Add any categories not in the store definition at the end
    categories.forEach(c => {
      if (!sortedCats.includes(c.id)) sortedCats.push(c.id);
    });

    return sortedCats.map(catId => {
      const category = categories.find(c => c.id === catId);
      const items = itemsByCat.get(catId) || [];
      if (items.length === 0) return null; // Don't show empty categories
      return { category, items };
    }).filter(g => g !== null) as { category: any, items: ShoppingListItem[] }[];

  }, [list, products, currentStore, categories]);

  // Suggestions for Autocomplete
  const productSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    // Exclude items already in list
    const existingIds = list?.items.map(i => i.productId) || [];
    return products
      .filter(p => !existingIds.includes(p.id) && p.name.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [searchTerm, products, list]);

  const handleAddItem = (productId: string) => {
    if (list) {
      updateShoppingList({
        ...list,
        items: [...list.items, { productId, quantity, isChecked: false }]
      });
      setSearchTerm('');
      setQuantity(1);
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

  const toggleCatCollapse = (catId: string) => {
    setCollapsedCats(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);
  };

  if (!list) return <div>Liste introuvable</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600"><ArrowLeft /></button>
          <h1 className="font-bold text-lg truncate flex-1 text-center">{list.name}</h1>
          <div className="w-8"></div> {/* Spacer */}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Magasin :</span>
          <select 
            value={currentStoreId} 
            onChange={(e) => handleStoreChange(e.target.value)}
            className="flex-1 p-2 bg-indigo-50 border-none rounded-lg text-indigo-700 font-semibold focus:ring-2 focus:ring-indigo-300 outline-none"
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
          <div className="text-center text-gray-400 mt-10">
            <p>La liste est vide.</p>
            <p className="text-sm">Ajoutez des produits ci-dessous.</p>
          </div>
        ) : (
          organizedItems.map(({ category, items }) => (
            <div key={category.id} className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div 
                onClick={() => toggleCatCollapse(category.id)}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <IconComponent name={category.iconName} size={18} className="text-indigo-500" />
                  {category.name}
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                {collapsedCats.includes(category.id) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </div>
              
              {!collapsedCats.includes(category.id) && (
                <div className="divide-y divide-gray-50">
                  {items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.productId} className="flex justify-between items-center p-3 hover:bg-slate-50">
                        <span className="text-slate-700">{product.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded">x{item.quantity}</span>
                          <button 
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Actions - Lifted to accommodate Bottom Nav */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] absolute bottom-[62px] w-full z-20">
        
        {/* Start Shopping Button */}
        <button 
            onClick={() => navigate(`/shop/${id}`)}
            className="w-full mb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all"
        >
          <Play size={20} fill="currentColor" /> Démarrer les courses
        </button>

        {/* Add Item Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ajouter un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
              />
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 text-gray-500 hover:text-indigo-600"><Minus size={16}/></button>
               <span className="w-6 text-center font-bold text-slate-700">{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)} className="p-1 text-gray-500 hover:text-indigo-600"><Plus size={16}/></button>
            </div>
          </div>
          
          {/* Autocomplete Dropdown */}
          {productSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl mb-2 overflow-hidden z-50">
              {productSuggestions.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddItem(p.id)}
                  className="w-full text-left p-3 hover:bg-indigo-50 border-b last:border-0 border-gray-50 flex justify-between items-center"
                >
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className="text-xs text-gray-400">{categories.find(c => c.id === p.categoryId)?.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListDetailView;