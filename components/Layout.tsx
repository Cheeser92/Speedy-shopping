
import React, { useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { List, Layers, Tag, Store, Settings } from 'lucide-react';
import { useAppContext } from '../services/AppContext';
import { FONT_SIZES } from '../constants';

const Layout: React.FC = () => {
  const location = useLocation();
  const { fontSize, t } = useAppContext();
  const isShoppingMode = location.pathname.startsWith('/shop/');

  // Apply font size logic
  useEffect(() => {
    const root = document.documentElement;
    if (isShoppingMode) {
        // Reset to default scale for immersive shopping mode
        root.style.fontSize = '100%';
    } else {
        // Apply user preference
        root.style.fontSize = FONT_SIZES[fontSize].value;
    }
  }, [fontSize, isShoppingMode]);

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full min-h-screen relative">
        <Outlet />
        
        {!isShoppingMode && (
          <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-40 transition-colors duration-300">
            <div className="flex justify-around items-center p-2">
              <NavLink to="/" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-primary-400'}`}>
                <List size={24} />
                <span className="text-[10px] font-medium mt-1">{t('nav_lists')}</span>
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-primary-400'}`}>
                <Layers size={24} />
                <span className="text-[10px] font-medium mt-1">{t('nav_categories')}</span>
              </NavLink>
              <NavLink to="/articles" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-primary-400'}`}>
                <Tag size={24} />
                <span className="text-[10px] font-medium mt-1">{t('nav_articles')}</span>
              </NavLink>
              <NavLink to="/stores" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-primary-400'}`}>
                <Store size={24} />
                <span className="text-[10px] font-medium mt-1">{t('nav_stores')}</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800' : 'text-gray-400 dark:text-slate-500 hover:text-primary-400'}`}>
                <Settings size={24} />
                <span className="text-[10px] font-medium mt-1">{t('nav_settings')}</span>
              </NavLink>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Layout;
