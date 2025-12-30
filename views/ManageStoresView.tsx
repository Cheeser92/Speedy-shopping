
import React, { useState, useRef } from 'react';
import { useAppContext } from '../services/AppContext';
import { Store } from '../types';
import { IconComponent } from '../components/IconComponent';
import { Plus, Star, Trash2, ArrowUp, ArrowDown, Settings, AlertTriangle, GripVertical } from 'lucide-react';

const ManageStoresView: React.FC = () => {
  const { stores, addStore, updateStore, deleteStore, toggleFavoriteStore, categories } = useAppContext();
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);

  // Favorite Confirmation State
  const [favConfirm, setFavConfirm] = useState<{id: string, name: string} | null>(null);

  // Drag & Drop State
  const dragItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

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

  const handleReorder = (fromIndex: number, toIndex: number) => {
      if (!selectedStore) return;
      const newOrder = [...selectedStore.categoryOrder];
      // Note: activeCategories represents the *filtered* list (valid IDs). 
      // We must operate on the real ID list, but assuming data integrity:
      const itemToMove = newOrder[fromIndex];
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, itemToMove);
      updateStore({ ...selectedStore, categoryOrder: newOrder });
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (!selectedStore) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < activeCategories.length) {
        handleReorder(index, newIndex);
    }
  };

  const removeCategoryFromStore = (catId: string) => {
    if (!selectedStore) return;
    updateStore({ ...selectedStore, categoryOrder: selectedStore.categoryOrder.filter(id => id !== catId) });
  };

  const addCategoryToStore = (catId: string) => {
    if (!selectedStore) return;
    updateStore({ ...selectedStore, categoryOrder: [...selectedStore.categoryOrder, catId] });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
        deleteStore(deleteConfirm.id);
        // If we deleted the selected store, select another one or reset
        if (selectedStoreId === deleteConfirm.id) {
             const remaining = stores.filter(s => s.id !== deleteConfirm.id);
             setSelectedStoreId(remaining[0]?.id || '');
        }
        setDeleteConfirm(null);
    }
  };

  const confirmSetFavorite = () => {
    if (favConfirm) {
        toggleFavoriteStore(favConfirm.id);
        setFavConfirm(null);
    }
  };

  // --- Drag & Drop Handlers ---

  // Desktop (Mouse)
  const onDragStart = (e: React.DragEvent, index: number) => {
      dragItem.current = index;
      setDraggingIndex(index);
      // Create a clean drag image
      e.dataTransfer.effectAllowed = "move";
      // Optional: set ghost image if needed, but browser default is usually ok
  };

  const onDragEnter = (e: React.DragEvent, index: number) => {
      // If we are over a different item than the one we are dragging, swap them
      if (dragItem.current !== null && dragItem.current !== index) {
          handleReorder(dragItem.current, index);
          dragItem.current = index;
          setDraggingIndex(index);
      }
  };

  const onDragEnd = () => {
      dragItem.current = null;
      setDraggingIndex(null);
  };

  // Mobile (Touch)
  const onTouchStart = (index: number) => {
      dragItem.current = index;
      setDraggingIndex(index);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      // Prevent scrolling while reordering
      if (dragItem.current === null) return;
      // Note: We don't preventDefault globally, only on the handle which calls this.
      // But to prevent scroll OF THE PAGE while dragging, we need to be careful.
      // e.preventDefault() here stops scroll if the event is passive: false (which React handles for us usually).
      
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = element?.closest('[data-sortable-index]');
      
      if (row) {
          const targetIndex = parseInt(row.getAttribute('data-sortable-index') || '-1', 10);
          if (targetIndex !== -1 && targetIndex !== dragItem.current) {
              handleReorder(dragItem.current, targetIndex);
              dragItem.current = targetIndex;
              setDraggingIndex(targetIndex);
          }
      }
  };

  const onTouchEnd = () => {
      dragItem.current = null;
      setDraggingIndex(null);
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
                    className="flex-1 p-2 border rounded-lg bg-indigo-50 text-indigo-900 placeholder-indigo-300" 
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
                    onClick={() => {
                       if(!selectedStore.isFavorite) {
                           setFavConfirm({id: selectedStore.id, name: selectedStore.name});
                       }
                    }}
                    className={`flex items-center gap-2 text-sm font-medium ${selectedStore.isFavorite ? 'text-yellow-500 cursor-default' : 'text-gray-400 hover:text-yellow-500'}`}
                >
                    <Star size={18} fill={selectedStore.isFavorite ? "currentColor" : "none"} /> 
                    {selectedStore.isFavorite ? 'Magasin favori' : 'Définir comme favori'}
                </button>
                {!selectedStore.isFavorite && (
                    <button 
                        onClick={() => setDeleteConfirm({id: selectedStore.id, name: selectedStore.name})}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
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
                    <div 
                        key={cat.id} 
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragEnter={(e) => onDragEnter(e, index)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        data-sortable-index={index}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${draggingIndex === index ? 'bg-indigo-50 border-indigo-300 opacity-50 scale-95 shadow-inner' : 'bg-gray-50 border-gray-100 hover:border-indigo-200'}`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            <div 
                                className="text-gray-300 cursor-grab active:cursor-grabbing touch-none p-1 hover:text-indigo-400"
                                onTouchStart={() => onTouchStart(index)}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                <GripVertical size={20} />
                            </div>
                            
                            <IconComponent name={cat.iconName} size={18} className="text-gray-500" />
                            <span className="font-medium text-slate-700">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-gray-400 hover:text-indigo-600"><ArrowUp size={16}/></button>
                            <button onClick={() => moveCategory(index, 'down')} disabled={index === activeCategories.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 text-gray-400 hover:text-indigo-600"><ArrowDown size={16}/></button>
                            <button onClick={() => removeCategoryFromStore(cat.id)} className="p-1 text-red-500 hover:text-red-700 ml-2"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex flex-col items-center text-center mb-4">
               <div className="bg-red-100 p-3 rounded-full mb-3 text-red-500">
                  <AlertTriangle size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-800">Supprimer le magasin ?</h3>
               <p className="text-gray-600 mt-2">
                 Êtes-vous sûr de vouloir supprimer <span className="font-semibold">"{deleteConfirm.name}"</span> ?
               </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 shadow-md"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Confirmation Modal */}
      {favConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex flex-col items-center text-center mb-4">
               <div className="bg-yellow-100 p-3 rounded-full mb-3 text-yellow-600">
                  <Star size={32} fill="currentColor" />
               </div>
               <h3 className="text-lg font-bold text-slate-800">Changer de magasin favori ?</h3>
               <p className="text-gray-600 mt-2">
                 Voulez-vous définir <span className="font-semibold">"{favConfirm.name}"</span> comme magasin principal pour vos listes ?
               </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setFavConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={confirmSetFavorite}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 shadow-md"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStoresView;
