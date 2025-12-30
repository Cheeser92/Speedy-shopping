import React from 'react';
import { ICONS_LIST } from '../constants';
import { IconComponent } from './IconComponent';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}

export const IconPickerModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-lg text-slate-800">Choisir une icône</h3>
          <button onClick={onClose}><X size={24} className="text-gray-500 hover:text-red-500" /></button>
        </div>
        <div className="p-4 overflow-y-auto grid grid-cols-6 gap-4">
          {ICONS_LIST.map((icon) => (
            <button
              key={icon}
              onClick={() => { onSelect(icon); onClose(); }}
              className="flex flex-col items-center justify-center p-2 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <IconComponent name={icon} size={24} className="text-slate-700" />
              <span className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
