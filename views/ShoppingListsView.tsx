
import React, { useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { Plus, Trash2, Copy, Edit2, Calendar, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShoppingListsView: React.FC = () => {
  const { shoppingLists, addShoppingList, deleteShoppingList, duplicateShoppingList, updateShoppingList } = useAppContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);
  
  const navigate = useNavigate();

  const handleCreate = () => {
    if (newListName.trim()) {
      addShoppingList(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const handleUpdate = () => {
    if (editingId && editName.trim()) {
      const list = shoppingLists.find(l => l.id === editingId);
      if (list) {
        updateShoppingList({ ...list, name: editName.trim() });
      }
      setEditingId(null);
      setEditName('');
    }
  };

  const requestDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteShoppingList(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 drop-shadow-sm">
          Mes Listes
        </h1>
        <button
            onClick={() => setIsCreating(true)}
            className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 font-medium transition-colors"
        >
            <Plus size={20} className="mr-1" /> Nouvelle liste
        </button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isCreating && (
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border-l-4 border-primary-500 animate-pulse">
             <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Nouvelle Liste</h3>
             <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom de la liste..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 shadow-inner bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100 placeholder-primary-300 dark:placeholder-slate-400"
                  autoFocus
                />
                <button onClick={handleCreate} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700">Créer</button>
                <button onClick={() => setIsCreating(false)} className="text-gray-500 dark:text-gray-400 px-2">X</button>
             </div>
           </div>
        )}

        {shoppingLists.map((list) => (
          <div key={list.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-primary-50 dark:border-slate-700 hover:shadow-lg transition-all relative overflow-hidden group">
             {/* Decorative background circle */}
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-50 dark:bg-slate-700 rounded-full opacity-50 group-hover:bg-primary-100 dark:group-hover:bg-slate-600 transition-colors pointer-events-none"></div>

            <div className="relative z-10">
              {editingId === list.id ? (
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 p-2 border border-primary-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100"
                    autoFocus
                  />
                  <button onClick={handleUpdate} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold">OK</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 dark:text-gray-400 px-2">Annuler</button>
                </div>
              ) : (
                <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => navigate(`/list/${list.id}`)}>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{list.name}</h2>
                    <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mt-1 space-x-3">
                      <span className="flex items-center"><Calendar size={12} className="mr-1" /> {list.createdAt}</span>
                      <span className="flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded-full font-medium">
                        <ShoppingBag size={12} className="mr-1" /> {list.items.length} produits
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-slate-700 pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(list.id); setEditName(list.name); }}
                  className="text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1"
                  title="Modifier"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateShoppingList(list.id); }}
                  className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                  title="Dupliquer"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={(e) => requestDelete(e, list.id, list.name)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1 z-20"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex flex-col items-center text-center mb-4">
               <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-3 text-red-500">
                  <AlertTriangle size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Supprimer la liste ?</h3>
               <p className="text-gray-600 dark:text-slate-300 mt-2">
                 Êtes-vous sûr de vouloir supprimer la liste <span className="font-semibold">"{deleteConfirm.name}"</span> ?
                 <br/><span className="text-xs text-red-400 mt-1 block">Cette action est irréversible.</span>
               </p>
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
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListsView;
