
import React, { useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

interface UnitManagerProps {
  value: string;
  onChange: (val: string) => void;
}

export const UnitManager: React.FC<UnitManagerProps> = ({ value, onChange }) => {
  const { units, addUnit, updateUnit, deleteUnit } = useAppContext();
  
  // Modal states
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleOpenAdd = () => {
    setInputValue('');
    setModalMode('add');
  };

  const handleOpenEdit = () => {
    setInputValue(value);
    setModalMode('edit');
  };

  const handleOpenDelete = () => {
    setModalMode('delete');
  };

  const handleClose = () => {
    setModalMode(null);
    setInputValue('');
  };

  const submitAdd = () => {
    if (inputValue.trim()) {
      addUnit(inputValue.trim());
      onChange(inputValue.trim()); // Select the new unit
      handleClose();
    }
  };

  const submitEdit = () => {
    if (inputValue.trim() && value) {
      updateUnit(value, inputValue.trim());
      onChange(inputValue.trim()); // Update selection to new name
      handleClose();
    }
  };

  const submitDelete = () => {
    if (value) {
      deleteUnit(value);
      onChange('Aucune'); // Fallback to safe default
      handleClose();
    }
  };

  return (
    <>
      <div className="flex gap-2 items-center">
        <select 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 text-indigo-900 min-w-0"
        >
            {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <button onClick={handleOpenAdd} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 flex-shrink-0" title="Ajouter"><Plus size={16}/></button>
        <button onClick={handleOpenEdit} disabled={!value} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex-shrink-0 disabled:opacity-50" title="Modifier"><Edit2 size={16}/></button>
        <button onClick={handleOpenDelete} disabled={!value} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex-shrink-0 disabled:opacity-50" title="Supprimer"><Trash2 size={16}/></button>
      </div>

      {/* Generic Modal Overlay */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === 'add' && 'Ajouter une unité'}
                {modalMode === 'edit' && 'Modifier l\'unité'}
                {modalMode === 'delete' && 'Supprimer l\'unité'}
              </h3>
              <button onClick={handleClose}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
            </div>

            {/* Content for Add/Edit */}
            {(modalMode === 'add' || modalMode === 'edit') && (
              <div className="flex flex-col gap-4">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="ex: kg, litre, paquet..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 text-indigo-900"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={handleClose} className="px-4 py-2 text-gray-600">Annuler</button>
                  <button 
                    onClick={modalMode === 'add' ? submitAdd : submitEdit}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Valider
                  </button>
                </div>
              </div>
            )}

            {/* Content for Delete */}
            {modalMode === 'delete' && (
              <div className="flex flex-col gap-4 text-center">
                 <div className="mx-auto bg-red-100 p-3 rounded-full text-red-500 w-fit">
                    <AlertTriangle size={32} />
                 </div>
                 <p className="text-gray-600">
                   Voulez-vous vraiment supprimer l'unité <span className="font-bold">"{value}"</span> ?
                 </p>
                 <div className="flex justify-center gap-3 mt-2">
                  <button onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Annuler</button>
                  <button 
                    onClick={submitDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
