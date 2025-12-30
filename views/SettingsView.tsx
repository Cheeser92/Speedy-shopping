
import React, { useRef, useState } from 'react';
import { useAppContext } from '../services/AppContext';
import { Moon, Sun, Palette, Check, Type, Download, UploadCloud, FileJson, Loader2, AlertTriangle, X, Mail } from 'lucide-react';
import { THEME_DISPLAY_DATA, FONT_SIZES } from '../constants';
import { ThemeColor, AppFontSize, BackupData } from '../types';

const SettingsView: React.FC = () => {
  const { 
    darkMode, toggleDarkMode, 
    themeColor, setThemeColor, 
    fontSize, setFontSize,
    categories, products, stores, shoppingLists, units, importData
  } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importCandidate, setImportCandidate] = useState<BackupData | null>(null);

  const handleExport = () => {
    const data: BackupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      categories,
      products,
      stores,
      shoppingLists,
      units,
      preferences: {
        darkMode,
        themeColor,
        fontSize
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speedy_shopping_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Afficher l'état de chargement immédiatement
    setIsLoading(true);

    // Utilisation d'un setTimeout pour laisser le temps au navigateur de rafraîchir l'UI (spinner)
    setTimeout(() => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const json = e.target?.result as string;
            let data: any;
            try {
                data = JSON.parse(json);
            } catch (err) {
                alert("Le fichier n'est pas un JSON valide.");
                setIsLoading(false);
                return;
            }
            
            // Vérification de la structure minimale
            if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
                 alert("Le fichier ne semble pas être une sauvegarde Speedy shopping valide.");
                 setIsLoading(false);
                 return;
            }
            
            // Si tout est bon, on ouvre la modale de confirmation
            setImportCandidate(data as BackupData);
            
          } catch (error) {
            console.error("Erreur import:", error);
            alert("Une erreur inattendue est survenue lors de la lecture.");
          } finally {
            setIsLoading(false);
          }
        };
        
        reader.onerror = () => {
            alert("Impossible de lire le fichier.");
            setIsLoading(false);
        };

        reader.readAsText(file);
    }, 100);

    // Reset de l'input
    event.target.value = '';
  };

  const confirmImport = () => {
      if (importCandidate) {
          try {
              importData(importCandidate);
              setImportCandidate(null);
              alert("Importation réussie ! Vos données ont été mises à jour.");
          } catch (e) {
              console.error(e);
              alert("Erreur lors de l'importation des données.");
          }
      }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors duration-300 pb-24">
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white drop-shadow-sm mb-6">Paramètres</h1>
      
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
             
             <div className="grid grid-cols-3 gap-3">
                {(Object.entries(FONT_SIZES) as [AppFontSize, typeof FONT_SIZES[AppFontSize]][]).map(([key, data]) => (
                    <button
                        key={key}
                        onClick={() => setFontSize(key)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${fontSize === key ? 'bg-primary-50 dark:bg-slate-800 border-primary-500 dark:border-primary-400 shadow-sm' : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                    >
                        <span 
                            className={`font-bold text-slate-700 dark:text-slate-200 mb-1 ${key === 'small' ? 'text-xs' : key === 'medium' ? 'text-base' : 'text-lg'}`}
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

          {/* Sauvegarde / Restauration */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 transition-colors duration-300">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                    <FileJson size={24} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-white">Données</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Sauvegarde et restauration</p>
                </div>
             </div>

             <div className="flex flex-col gap-3">
                 <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-primary-200 dark:border-slate-700 bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-slate-700 transition-colors w-full"
                 >
                     <Download size={20} />
                     <span className="font-medium">Exporter une sauvegarde</span>
                 </button>

                 <div className="relative">
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".json,application/json,text/plain" 
                        className="hidden" 
                        onChange={handleImport}
                    />
                    
                    <button 
                        onClick={triggerImport}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-primary-200 dark:border-slate-700 bg-primary-50 dark:bg-slate-800 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-slate-700 transition-colors w-full active:scale-95 transform duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                        <span className="font-medium">{isLoading ? 'Lecture en cours...' : 'Importer une sauvegarde'}</span>
                    </button>
                 </div>
             </div>
             <p className="mt-3 text-xs text-gray-400 dark:text-slate-500 text-center">
                 Le fichier .json contient toutes vos listes, articles, catégories et préférences.
             </p>
          </div>
      </div>

      {/* Import Confirmation Modal */}
      {importCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-pop">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full text-yellow-600 dark:text-yellow-500">
                    <AlertTriangle size={28} />
                </div>
                <button onClick={() => setImportCandidate(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Confirmer la restauration</h3>
            
            <div className="text-sm text-gray-600 dark:text-slate-300 space-y-3">
                <p>
                    Une sauvegarde datée du <span className="font-semibold text-primary-600 dark:text-primary-400">{new Date(importCandidate.timestamp || Date.now()).toLocaleDateString()}</span> a été trouvée.
                </p>
                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg text-xs">
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Listes : {importCandidate.shoppingLists?.length || 0}</li>
                        <li>Articles : {importCandidate.products?.length || 0}</li>
                        <li>Magasins : {importCandidate.stores?.length || 0}</li>
                    </ul>
                </div>
                <p className="font-semibold text-red-500">
                    Attention : Cette action va effacer toutes les données actuelles de l'application.
                </p>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button 
                onClick={() => setImportCandidate(null)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button 
                onClick={confirmImport}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-md"
              >
                Restaurer les données
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Credits & Contact */}
      <div className="mt-10 mb-6 text-center">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Speedy shopping v1.3.4</p>
        <p className="text-xs text-gray-400 dark:text-slate-500">
            Développé par <span className="text-primary-600 dark:text-primary-400 font-medium">Cheeser92</span>
        </p>
        <p className="text-[10px] text-gray-300 dark:text-slate-600 mt-1">2025</p>

        <div className="mt-6 mx-auto max-w-xs">
             <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 px-4">
                Un commentaire, une remarque, un remerciement ? Envoyez un message.
             </p>
             <a 
                href="mailto:Cheeser92@gmail.com"
                className="inline-flex items-center justify-center gap-2 w-12 h-12 bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-full shadow-sm border border-primary-100 dark:border-slate-700 hover:scale-110 hover:bg-primary-100 dark:hover:bg-slate-700 transition-all duration-300"
                aria-label="Envoyer un email"
             >
                <Mail size={20} />
             </a>
        </div>
      </div>
    </div>
  );
};
export default SettingsView;
