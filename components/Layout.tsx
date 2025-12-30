import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { List, Layers, Tag, Store, Settings } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  // Hide bottom nav on specific routes like Shopping Mode or Detail View if desired.
  // Requirement: "Shopping mode... without icons". 
  const isShoppingMode = location.pathname.startsWith('/shop/');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <div className="w-full min-h-screen relative bg-white">
        <Outlet />
        
        {!isShoppingMode && (
          <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-40">
            <div className="flex justify-around items-center p-2">
              <NavLink to="/" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-400'}`}>
                <List size={24} />
                <span className="text-[10px] font-medium mt-1">Listes</span>
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-400'}`}>
                <Layers size={24} />
                <span className="text-[10px] font-medium mt-1">Catégories</span>
              </NavLink>
              <NavLink to="/articles" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-400'}`}>
                <Tag size={24} />
                <span className="text-[10px] font-medium mt-1">Articles</span>
              </NavLink>
              <NavLink to="/stores" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-400'}`}>
                <Store size={24} />
                <span className="text-[10px] font-medium mt-1">Magasins</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-400'}`}>
                <Settings size={24} />
                <span className="text-[10px] font-medium mt-1">Param.</span>
              </NavLink>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default Layout;