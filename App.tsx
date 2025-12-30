import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './services/AppContext';
import Layout from './components/Layout';
import ShoppingListsView from './views/ShoppingListsView';
import ListDetailView from './views/ListDetailView';
import ActiveShoppingView from './views/ActiveShoppingView';
import ManageCategoriesView from './views/ManageCategoriesView';
import ManageArticlesView from './views/ManageArticlesView';
import ManageStoresView from './views/ManageStoresView';
import SettingsView from './views/SettingsView';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ShoppingListsView />} />
            <Route path="list/:id" element={<ListDetailView />} />
            <Route path="shop/:id" element={<ActiveShoppingView />} />
            <Route path="categories" element={<ManageCategoriesView />} />
            <Route path="articles" element={<ManageArticlesView />} />
            <Route path="stores" element={<ManageStoresView />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
