
import React, { useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { IconComponent } from '../components/IconComponent';
import { IconPickerModal } from '../components/IconPickerModal';
import { Edit2, Plus, Trash2, AlertTriangle } from 'lucide-react';

const ManageCategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('HelpCircle');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const startEdit = (cat?: typeof categories[0]) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
      setIconName(cat.iconName);
    } else {
      setEditingId(null);
      setName('');
      setIconName('ShoppingBasket');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateCategory(editingId, name, iconName);
    } else {
      addCategory(name, iconName);
    }
    setIsModalOpen(false);
  };

  const requestDelete = (id: string, catName: string) => {
    setDeleteConfirm({ id, name: catName });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
        deleteCategory(deleteConfirm.id);
        setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold text-slate-800">Catégories</h1>
         <button onClick={() => startEdit()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-indigo-700">
            <Plus size={18} className="mr-1" /> Nouvelle Catégorie
         </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map(cat => (
            <div key={cat.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-indigo-50 p-2 rounded-full text-indigo-600 flex-shrink-0">
                        <IconComponent name={cat.iconName} size={20} />
                    </div>
                    <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(cat)} className="text-gray-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                        <Edit2 size={18} />
                    </button>
                    <button onClick={() => requestDelete(cat.id, cat.name)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-pop">
                <h2 className="text-xl font-bold mb-4">{editingId ? 'Modifier' : 'Créer'} une catégorie</h2>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 invalid:border-red-500 outline-none shadow-sm bg-indigo-50 text-indigo-900"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                    <button 
                        onClick={() => setIsIconPickerOpen(true)}
                        className="flex items-center gap-3 p-2 border border-gray-300 rounded-lg w-full hover:bg-gray-50"
                    >
                        <IconComponent name={iconName} />
                        <span>{iconName}</span>
                    </button>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium">Annuler</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700">Enregistrer</button>
                </div>
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
               <h3 className="text-lg font-bold text-slate-800">Supprimer la catégorie ?</h3>
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

      <IconPickerModal 
        isOpen={isIconPickerOpen} 
        onClose={() => setIsIconPickerOpen(false)} 
        onSelect={setIconName} 
      />
    </div>
  );
};

export default ManageCategoriesView;
