
import React, { useState, useRef } from 'react';
import { useAppContext } from '../services/AppContext';
import { Store } from '../types';
import { IconComponent } from '../components/IconComponent';
import { Star, Trash2, ArrowUp, ArrowDown, AlertTriangle, GripVertical } from 'lucide-react';

const ManageStoresView: React.FC = () => {
  const { 
    stores, addStore, updateStore, deleteStore, toggleFavoriteStore, 
    categories, shoppingLists, deleteShoppingList 
  } = useAppContext();
  
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  // Modification de l'état pour inclure le nombre de listes impactées
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string, count: number} | null>(null);
  const [favConfirm, setFavConfirm] = useState<{id: string, name: string} | null>(null);

  const dragItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const activeCategories = selectedStore ? selectedStore.categoryOrder.map(id => categories.find(c => c.id === id)).filter(Boolean) as typeof categories : [];
  
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

  const requestDelete = (e: React.MouseEvent, store: Store) => {
    e.stopPropagation();
    // Compter les listes associées à ce magasin
    const count = shoppingLists.filter(l => l.storeId === store.id).length;
    setDeleteConfirm({ id: store.id, name: store.name, count });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
        // 1. Supprimer les listes associées
        const listsToDelete = shoppingLists.filter(l => l.storeId === deleteConfirm.id);
        listsToDelete.forEach(l => deleteShoppingList(l.id));

        // 2. Supprimer le magasin
        deleteStore(deleteConfirm.id);
        
        // 3. Gestion de l'interface
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
  const onDragStart = (e: React.DragEvent, index: number) => {
      dragItem.current = index;
      setDraggingIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: React.DragEvent, index: number) => {
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

  const onTouchStart = (index: number) => {
      dragItem.current = index;
      setDraggingIndex(index);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      if (dragItem.current === null) return;
      
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
    <div className="p-4 pb-24 min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col h-screen transition-colors duration-300">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white drop-shadow-sm mb-4">Magasins</h1>
      
      {/* Store Selector & Actions */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 mb-4 transition-colors">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {stores.map(s => (
                <div 
                    key={s.id} 
                    onClick={() => setSelectedStoreId(s.id)}
                    className={`flex items-center whitespace-nowrap pl-4 pr-2 py-2 rounded-full border transition-all cursor-pointer gap-2 ${selectedStoreId === s.id ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                >
                    <span className="font-medium">{s.name}</span>
                    {s.isFavorite && <Star size={14} fill="currentColor" className="text-yellow-300" />}
                    
                    {!s.isFavorite && (
                         <button
                            onClick={(e) => requestDelete(e, s)}
                            className={`p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors ${selectedStoreId === s.id ? 'text-red-200 hover:text-white' : 'text-red-500 dark:text-red-400'}`}
                            title="Supprimer le magasin"
                         >
                            <Trash2 size={14} />
                         </button>
                    )}
                </div>
            ))}
            <button onClick={() => setIsCreating(true)} className="px-3 py-2 rounded-full border border-dashed border-primary-400 text-primary-500 hover:bg-primary-50 dark:hover:bg-slate-800 flex-shrink-0 flex items-center justify-center h-[42px] w-[42px]">+</button>
        </div>
        
        {isCreating && (
            <div className="flex gap-2 mb-4 animate-fade-in">
                <input 
                    type="text" 
                    placeholder="Nom du magasin" 
                    className="flex-1 p-2 border rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 placeholder-primary-300 border-gray-200 dark:border-slate-600" 
                    value={newStoreName}
                    onChange={e => setNewStoreName(e.target.value)}
                />
                <button onClick={handleCreate} className="bg-green-500 text-white px-3 rounded-lg">OK</button>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 dark:text-gray-400 px-2">X</button>
            </div>
        )}

        {selectedStore && (
            <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-800 pt-3">
                <button 
                    onClick={() => {
                       if(!selectedStore.isFavorite) {
                           setFavConfirm({id: selectedStore.id, name: selectedStore.name});
                       }
                    }}
                    className={`flex items-center gap-2 text-sm font-medium ${selectedStore.isFavorite ? 'text-yellow-500 cursor-default' : 'text-gray-400 dark:text-slate-500 hover:text-yellow-500'}`}
                >
                    <Star size={18} fill={selectedStore.isFavorite ? "currentColor" : "none"} /> 
                    {selectedStore.isFavorite ? 'Magasin favori' : 'Définir comme favori'}
                </button>
                {/* L'ancien bouton poubelle a été retiré d'ici car il est maintenant dans la liste horizontale */}
            </div>
        )}
      </div>

      {/* Category Ordering */}
      {selectedStore && (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                 <h2 className="font-semibold text-gray-700 dark:text-slate-300">Ordre des rayons ({activeCategories.length})</h2>
                 {availableCategories.length > 0 && (
                     <div className="relative group">
                         <button className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center">+ Ajouter rayon</button>
                         <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border dark:border-slate-700 p-1 hidden group-hover:block z-10 max-h-48 overflow-y-auto">
                             {availableCategories.map(c => (
                                 <button key={c.id} onClick={() => addCategoryToStore(c.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-200">
                                     {c.name}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-inner border border-gray-200 dark:border-slate-800 p-2 space-y-2">
                {activeCategories.map((cat, index) => (
                    <div 
                        key={cat.id} 
                        draggable
                        onDragStart={(e) => onDragStart(e, index)}
                        onDragEnter={(e) => onDragEnter(e, index)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        data-sortable-index={index}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${draggingIndex === index ? 'bg-primary-50 dark:bg-slate-800 border-primary-300 dark:border-primary-500 opacity-50 scale-95 shadow-inner' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800'}`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Drag Handle */}
                            <div 
                                className="text-gray-300 dark:text-slate-600 cursor-grab active:cursor-grabbing touch-none p-1 hover:text-primary-400"
                                onTouchStart={() => onTouchStart(index)}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                <GripVertical size={20} />
                            </div>
                            
                            <IconComponent name={cat.iconName} size={18} className="text-gray-500 dark:text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => moveCategory(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 text-gray-400 dark:text-slate-500 hover:text-primary-600"><ArrowUp size={16}/></button>
                            <button onClick={() => moveCategory(index, 'down')} disabled={index === activeCategories.length - 1} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 text-gray-400 dark:text-slate-500 hover:text-primary-600"><ArrowDown size={16}/></button>
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
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex flex-col items-center text-center mb-4">
               <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-3 text-red-500">
                  <AlertTriangle size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">Supprimer le magasin ?</h3>
               <p className="text-gray-600 dark:text-slate-300 mt-2">
                 Vous êtes sur le point de supprimer <span className="font-semibold">"{deleteConfirm.name}"</span>.
               </p>
               
               {deleteConfirm.count > 0 ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 p-3 rounded-lg mt-3 w-full">
                        <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
                            Attention :
                        </p>
                        <p className="text-red-600 dark:text-red-400 text-sm">
                            {deleteConfirm.count} liste{deleteConfirm.count > 1 ? 's' : ''} de courses associée{deleteConfirm.count > 1 ? 's' : ''} ser{deleteConfirm.count > 1 ? 'ont' : 'a'} également supprimée{deleteConfirm.count > 1 ? 's' : ''}.
                        </p>
                    </div>
               ) : (
                   <p className="text-sm text-gray-400 mt-2">Aucune liste n'est associée à ce magasin.</p>
               )}
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 shadow-md"
              >
                Tout supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorite Confirmation Modal */}
      {favConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex flex-col items-center text-center mb-4">
               <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mb-3 text-yellow-600 dark:text-yellow-500">
                  <Star size={32} fill="currentColor" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">Changer de magasin favori ?</h3>
               <p className="text-gray-600 dark:text-slate-300 mt-2">
                 Voulez-vous définir <span className="font-semibold">"{favConfirm.name}"</span> comme magasin principal pour vos listes ?
               </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setFavConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
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
    