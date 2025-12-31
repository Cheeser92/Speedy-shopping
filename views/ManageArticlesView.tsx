
import React, { useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { Product, PricePoint } from '../types';
import { Plus, Edit2, Trash2, History, Search, AlertTriangle, X, Eraser } from 'lucide-react';
import { UnitManager } from '../components/UnitManager';

const ManageArticlesView: React.FC = () => {
  const { 
      products, categories, addProduct, updateProduct, deleteProduct,
      units, t, t_cat, t_prod, t_unit
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);

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

  const filteredProducts = products.filter(p => t_prod(p.name).toLowerCase().includes(searchTerm.toLowerCase()));

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

  const getCatName = (id: string) => {
      const cat = categories.find(c => c.id === id);
      return cat ? t_cat(cat.name) : t('unknown');
  };

  // --- Fonction pour générer le graphique SVG ---
  const renderTrendChart = (history: PricePoint[]) => {
    if (!history || history.length < 2) return null;

    // Conversion des dates "dd/mm/yyyy" en timestamps pour le tri et le calcul
    const data = history.map(h => {
      const [d, m, y] = h.date.split('/');
      return {
        timestamp: new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getTime(),
        price: h.price,
        rawDate: h.date
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Si tous les prix sont identiques, on ne peut pas dessiner une courbe significative,
    // mais on peut afficher une ligne droite.
    const isFlat = minPrice === maxPrice;

    const minTime = data[0].timestamp;
    const maxTime = data[data.length - 1].timestamp;

    // Dimensions du SVG
    const width = 300;
    const height = 80;
    const padding = 10;

    const getX = (time: number) => {
      if (maxTime === minTime) return width / 2;
      return padding + ((time - minTime) / (maxTime - minTime)) * (width - 2 * padding);
    };

    const getY = (price: number) => {
        if (isFlat) return height / 2;
        // Inversion de Y car SVG commence en haut
        return height - (padding + ((price - minPrice) / (maxPrice - minPrice)) * (height - 2 * padding));
    };

    const points = data.map(d => `${getX(d.timestamp)},${getY(d.price)}`).join(' ');

    return (
      <div className="mb-6 mt-2">
         <h4 className="text-center font-bold text-gray-500 dark:text-gray-300 text-sm mb-2 uppercase tracking-wide">{t('trend')}</h4>
         <div className="w-full bg-gray-50 dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <defs>
                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary-500)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--color-primary-500)" stopOpacity="0" />
                   </linearGradient>
                </defs>
                
                {/* Zone remplie sous la courbe */}
                <path 
                  d={`M ${getX(data[0].timestamp)},${height} L ${points} L ${getX(data[data.length-1].timestamp)},${height} Z`}
                  fill="url(#chartGradient)"
                  stroke="none"
                />

                {/* Ligne principale */}
                <polyline 
                    fill="none" 
                    stroke="var(--color-primary-500)" 
                    strokeWidth="2" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />

                {/* Points */}
                {data.map((d, i) => (
                   <circle 
                     key={i} 
                     cx={getX(d.timestamp)} 
                     cy={getY(d.price)} 
                     r="3" 
                     className="fill-white dark:fill-slate-800 stroke-primary-500" 
                     strokeWidth="2" 
                   />
                ))}
             </svg>
         </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 min-h-screen bg-primary-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-primary-800 dark:text-primary-100 drop-shadow-sm">{t('manage_articles')}</h1>
          <button onClick={() => startEdit()} className="bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600">
              <Plus size={18} className="mr-1" /> {t('new_article')}
          </button>
      </div>
      <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
          <input 
              type="text" 
              placeholder={t('search_article')} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-2 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white dark:bg-slate-800 text-primary-900 dark:text-primary-100 placeholder-primary-300 dark:placeholder-slate-500"
          />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-primary-100 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{t_prod(p.name)}</h3>
                        <span className="text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 px-2 py-1 rounded-full">{getCatName(p.categoryId)}</span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setShowHistoryId(p.id)} className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-lg"><History size={18} /></button>
                        <button onClick={() => startEdit(p)} className="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg"><Edit2 size={18} /></button>
                        <button onClick={() => setDeleteConfirm({id: p.id, name: p.name})} className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>
                <div className="flex justify-between items-end text-sm text-gray-600 dark:text-slate-400 mt-1 border-t border-gray-50 dark:border-slate-800 pt-2">
                    <span>{p.defaultPrice} € / {t_unit(p.defaultUnit)}</span>
                    {p.note && <span className="italic text-gray-400 dark:text-slate-500 text-xs max-w-[50%] truncate">{p.note}</span>}
                </div>
            </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{editingId ? t('edit_unit').replace('l\'unité', 'l\'article') : t('new_article')}</h2>
                
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('name')} *</label>
                        <input className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:border-primary-500 invalid:border-red-500 shadow-inner bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('aisle')} *</label>
                        <select className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                            {categories.map(c => <option key={c.id} value={c.id}>{t_cat(c.name)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('price')}</label>
                        <input 
                            type="number" step="0.01" inputMode="decimal" placeholder="0.00"
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100" 
                            value={formData.defaultPrice} 
                            onChange={e => setFormData({...formData, defaultPrice: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('unit')}</label>
                        <UnitManager 
                            value={formData.defaultUnit}
                            onChange={(val) => setFormData({...formData, defaultUnit: val})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t('note')}</label>
                        <div className="relative">
                            <textarea 
                                className="w-full p-2 pr-8 border border-gray-300 dark:border-slate-600 rounded-lg bg-primary-50 dark:bg-slate-700 text-primary-900 dark:text-primary-100" 
                                rows={2} 
                                value={formData.note} 
                                onChange={e => setFormData({...formData, note: e.target.value})} 
                            />
                            {formData.note && (
                                <button 
                                    onClick={() => setFormData({...formData, note: ''})}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-primary-500 dark:text-slate-500 dark:hover:text-primary-400"
                                    title="Effacer la note"
                                >
                                    <Eraser size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700">{t('save')}</button>
                </div>
            </div>
         </div>
      )}

      {/* Price History Modal */}
      {showHistoryId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-5 w-full max-w-sm animate-pop">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t('price_history')}</h3>
                      <button onClick={() => setShowHistoryId(null)} className="text-gray-500 hover:text-red-500 bg-gray-100 dark:bg-slate-700 rounded-full p-1"><X size={20}/></button>
                  </div>
                  
                  {/* Graphique de tendance */}
                  {renderTrendChart(products.find(p => p.id === showHistoryId)?.priceHistory || [])}

                  <div className="max-h-60 overflow-y-auto pr-1">
                    <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                        {products.find(p => p.id === showHistoryId)?.priceHistory.slice().reverse().map((h, i) => (
                            <li key={i} className="py-3 flex justify-between text-sm items-center">
                                <span className="text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded">{h.date}</span>
                                <span className="font-bold text-primary-600 dark:text-primary-400 text-base">{h.price} €</span>
                            </li>
                        ))}
                    </ul>
                  </div>
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
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('delete_confirm')}</h3>
               <p className="text-gray-600 dark:text-slate-300 mt-2">
                 {t('sure_delete')} <span className="font-semibold">"{deleteConfirm.name}"</span> ?
               </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 shadow-md"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageArticlesView;
