
import React from 'react';
import { useAppContext } from '../services/AppContext';
import { Moon, Sun, Palette, Check, Type } from 'lucide-react';
import { THEME_DISPLAY_DATA, FONT_SIZES } from '../constants';
import { ThemeColor, AppFontSize } from '../types';

const SettingsView: React.FC = () => {
  const { darkMode, toggleDarkMode, themeColor, setThemeColor, fontSize, setFontSize } = useAppContext();

  return (
    <div className="p-4 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Paramètres</h1>
      
      <div className="space-y-4">
          {/* Mode Sombre */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${darkMode ? 'bg-primary-900 text-primary-300' : 'bg-orange-100 text-orange-500'} transition-colors duration-300`}>
                    {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">Mode Sombre</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {darkMode ? 'Activé' : 'Désactivé'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={toggleDarkMode}
                className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <div 
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}
                ></div>
              </button>
            </div>
          </div>

          {/* Couleur du Thème */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 transition-colors duration-300">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                    <Palette size={24} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">Couleur du thème</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Personnalisez l'apparence</p>
                </div>
             </div>
             
             <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {(Object.entries(THEME_DISPLAY_DATA) as [ThemeColor, typeof THEME_DISPLAY_DATA[ThemeColor]][]).map(([key, data]) => (
                    <button
                        key={key}
                        onClick={() => setThemeColor(key)}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div 
                            className={`w-12 h-12 rounded-lg shadow-sm flex items-center justify-center transition-transform transform group-hover:scale-110 ${themeColor === key ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-400 dark:ring-slate-500' : ''}`}
                            style={{ backgroundColor: data.color }}
                        >
                            {themeColor === key && <Check className="text-white drop-shadow-md" size={24} />}
                        </div>
                        <span className={`text-xs text-center font-medium ${themeColor === key ? 'text-slate-800 dark:text-slate-100' : 'text-gray-500 dark:text-slate-400'}`}>
                            {data.label}
                        </span>
                    </button>
                ))}
             </div>
          </div>

          {/* Taille de Police */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 transition-colors duration-300">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                    <Type size={24} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">Taille de police</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Ajustez la taille du texte</p>
                </div>
             </div>
             
             <div className="grid grid-cols-4 gap-3">
                {(Object.entries(FONT_SIZES) as [AppFontSize, typeof FONT_SIZES[AppFontSize]][]).map(([key, data]) => (
                    <button
                        key={key}
                        onClick={() => setFontSize(key)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${fontSize === key ? 'bg-primary-50 dark:bg-slate-800 border-primary-500 dark:border-primary-400 shadow-sm' : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <span 
                            className={`font-bold text-slate-700 dark:text-slate-200 mb-1 ${key === 'small' ? 'text-xs' : key === 'medium' ? 'text-base' : key === 'large' ? 'text-lg' : 'text-xl'}`}
                        >
                            Aa
                        </span>
                        <span className={`text-[10px] text-center font-medium ${fontSize === key ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400 dark:text-slate-500'}`}>
                            {data.label}
                        </span>
                    </button>
                ))}
             </div>
          </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-400 dark:text-slate-600">
        <p>ShopFlow v1.2</p>
      </div>
    </div>
  );
};
export default SettingsView;
