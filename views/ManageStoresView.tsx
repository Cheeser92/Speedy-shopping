import React, { useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { Store } from '../types';
import { IconComponent } from '../components/IconComponent';
import { Plus, Star, Trash2, ArrowUp, ArrowDown, Settings } from 'lucide-react';

const ManageStoresView: React.FC = () => {
  const { stores, addStore, updateStore, deleteStore, toggleFavoriteStore, categories } = useAppContext();
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // Categories present in the store config
  const activeCategories = selectedStore ? selectedStore.categoryOrder.map(id => categories.find(c => c.id === id)).filter(Boolean) as typeof categories : [];
  
  // Categories NOT in the store config
  const availableCategories = selectedStore ? categories.filter(c => !selectedStore.categoryOrder.includes(c.id)) : [];

  const handleCreate = () => {
    if (newStoreName.trim()) {
      addStore(newStoreName.trim());
      setNewStoreName('');
      setIsCreating(false);
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (!selectedStore) return;
    const newOrder = [...selectedStore.categoryOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    updateStore({ ...selectedStore, categoryOrder: newOrder });
  };

  const removeCategoryFromStore = (catId: string) => {
    if (!selectedStore) return;
    updateStore({ ...selectedStore, categoryOrder: selectedStore.categoryOrder.filter(id => id !== catId) });
  };

  const addCategoryToStore = (catId: string) => {
    if (!selectedStore) return;
    updateStore({ ...selectedStore, categoryOrder: [...selectedStore.categoryOrder, catId] });
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 flex flex-col h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Magasins</h1>
      
      {/* Store Selector & Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {stores.map(s => (
                <button 
                    key={s.id} 
                    onClick={() => setSelectedStoreId(s.id)}
                    className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full border transition-colors ${selectedStoreId === s.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    {s.name}
                    {s.isFavorite && <Star size={12} fill="currentColor" className="ml-2 text-yellow-300" />}
                </button>
            ))}
            <button onClick={() => setIsCreating(true)} className="px-3 py-2 rounded-full border border-dashed border-indigo-400 text-indigo-500 hover:bg-indigo-50">+</button>
        </div>
        
        {isCreating && (
            <div className="flex gap-2 mb-4 animate-fade-in">
                <input 
                    type="text" 
                    placeholder="Nom du magasin" 
                    className="flex-1 p-2 border rounded-lg" 
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                />
                <button onClick={handleCreate} className="bg-green-500 text-white px-3 rounded-lg">OK</button>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 px-2">X</button>
            </div>
        )}

        {selectedStore && (
            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <button 
                    onClick={() => toggleFavoriteStore(selectedStore.id)}
                    className={`flex items-center gap-2 text-sm font-medium ${selectedStore.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                >
                    <Star size={18} fill={selectedStore.isFavorite ? "currentColor" : "none"} /> 
                    {selectedStore.isFavorite ? 'Magasin favori' : 'Définir comme favori'}
                </button>
                <button 
                    onClick={() => {if(window.confirm('Supprimer ce magasin ?')) deleteStore(selectedStore.id)}}
                    className="text-red-400 hover:text-red-600"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        )}
      </div>

      {/* Category Ordering */}
      {selectedStore && (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                 <h2 className="font-semibold text-gray-700">Ordre des rayons ({activeCategories.length})</h2>
                 {availableCategories.length > 0 && (
                     <div className="relative group">
                         <button className="text-sm text-indigo-600 font-medium flex items-center">+ Ajouter rayon</button>
                         <div className="absolute right-0 mt-2 w-48 bg-white shadow-xl rounded-lg border p-1 hidden group-hover:block z-10 max-h-48 overflow-y-auto">
                             {availableCategories.map(c => (
                                 <button key={c.id} onClick={() => addCategoryToStore(c.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                                     {c.name}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-inner border border-gray-200 p-2 space-y-2">
                {activeCategories.map((cat, index) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                            <IconComponent name={cat.iconName} size={18} className="text-gray-500" />
                            <span className="font-medium text-slate-700">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp size={16}/></button>
                            <button onClick={() => moveCategory(index, 'down')} disabled={index === activeCategories.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown size={16}/></button>
                            <button onClick={() => removeCategoryFromStore(cat.id)} className="p-1 text-gray-400 hover:text-red-500 ml-2"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageStoresView;
