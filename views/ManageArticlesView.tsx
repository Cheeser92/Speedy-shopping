
import React, { useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { Product } from '../types';
import { Plus, Edit2, Trash2, History, Search, AlertTriangle } from 'lucide-react';
import { UnitManager } from '../components/UnitManager';

const ManageArticlesView: React.FC = () => {
  const { 
      products, categories, addProduct, updateProduct, deleteProduct,
      units 
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    categoryId: string;
    defaultPrice: string | number;
    defaultUnit: string;
    note: string;
  }>({
    name: '',
    categoryId: '',
    defaultPrice: '',
    defaultUnit: 'Aucune',
    note: ''
  });

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const startEdit = (p?: Product) => {
    if (p) {
      setEditingId(p.id);
      setFormData({
        name: p.name,
        categoryId: p.categoryId,
        defaultPrice: p.defaultPrice === 0 ? '' : p.defaultPrice,
        defaultUnit: p.defaultUnit,
        note: p.note || ''
      });
    } else {
      setEditingId(null);
      setFormData({ 
          name: '', 
          categoryId: categories[0]?.id || '', 
          defaultPrice: '', 
          defaultUnit: units.includes('Aucune') ? 'Aucune' : (units[0] || ''), 
          note: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.categoryId) return;

    let parsedPrice = 0;
    if (typeof formData.defaultPrice === 'number') {
        parsedPrice = formData.defaultPrice;
    } else if (formData.defaultPrice) {
        // Replace comma with dot for French keyboards compatibility
        const normalized = formData.defaultPrice.replace(',', '.');
        parsedPrice = parseFloat(normalized);
        if (isNaN(parsedPrice)) parsedPrice = 0;
    }

    const finalData = {
        name: formData.name,
        categoryId: formData.categoryId,
        defaultPrice: parsedPrice,
        defaultUnit: formData.defaultUnit,
        note: formData.note
    };

    if (editingId) {
      const existing = products.find(p => p.id === editingId)!;
      updateProduct({ ...existing, ...finalData });
    } else {
      addProduct(finalData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
      if (deleteConfirm) {
          deleteProduct(deleteConfirm.id);
          setDeleteConfirm(null);
      }
  };

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Inconnu';

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50">
      {/* Header & Search */}
      <div className="sticky top-0 bg-gray-50 pt-2 pb-4 z-10">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-800">Articles</h1>
            <button onClick={() => startEdit()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-indigo-700">
                <Plus size={18} className="mr-1" /> Nouvel Article
            </button>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
            <input 
                type="text" 
                placeholder="Rechercher un article..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 text-indigo-900 placeholder-indigo-300"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{getCatName(p.categoryId)}</span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setShowHistoryId(p.id)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"><History size={18} /></button>
                        <button onClick={() => startEdit(p)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"><Edit2 size={18} /></button>
                        <button onClick={() => setDeleteConfirm({id: p.id, name: p.name})} className="p-2 text-red-500 hover:text-red-700 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>
                <div className="flex justify-between items-end text-sm text-gray-600 mt-1 border-t border-gray-50 pt-2">
                    <span>{p.defaultPrice} € / {p.defaultUnit}</span>
                    {p.note && <span className="italic text-gray-400 text-xs max-w-[50%] truncate">{p.note}</span>}
                </div>
            </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{editingId ? 'Modifier' : 'Créer'} un article</h2>
                
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom *</label>
                        <input className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 invalid:border-red-500 shadow-inner bg-indigo-50 text-indigo-900" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Catégorie *</label>
                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-indigo-50 text-indigo-900" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Prix</label>
                        <input 
                            type="number" step="0.01" inputMode="decimal" placeholder="0.00"
                            className="w-full p-2 border border-gray-300 rounded-lg bg-indigo-50 text-indigo-900" 
                            value={formData.defaultPrice} 
                            onChange={e => setFormData({...formData, defaultPrice: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Unité</label>
                        <UnitManager 
                            value={formData.defaultUnit}
                            onChange={(val) => setFormData({...formData, defaultUnit: val})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Note</label>
                        <textarea className="w-full p-2 border border-gray-300 rounded-lg bg-indigo-50 text-indigo-900" rows={2} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Annuler</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700">Enregistrer</button>
                </div>
            </div>
         </div>
      )}

      {/* Price History Modal */}
      {showHistoryId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-sm">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold">Historique des prix</h3>
                      <button onClick={() => setShowHistoryId(null)} className="text-gray-500 hover:text-red-500">X</button>
                  </div>
                  <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {products.find(p => p.id === showHistoryId)?.priceHistory.map((h, i) => (
                          <li key={i} className="py-2 flex justify-between text-sm">
                              <span className="text-gray-600">{h.date}</span>
                              <span className="font-bold text-slate-800">{h.price} €</span>
                          </li>
                      ))}
                  </ul>
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
               <h3 className="text-lg font-bold text-slate-800">Supprimer l'article ?</h3>
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
    </div>
  );
};

export default ManageArticlesView;
