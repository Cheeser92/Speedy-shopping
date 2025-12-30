import React, { createContext, useContext, useEffect, useState } from 'react';
import { Category, Product, ShoppingList, Store } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_NAMES } from '../constants';

interface AppState {
  categories: Category[];
  products: Product[];
  stores: Store[];
  shoppingLists: ShoppingList[];
}

interface AppContextType extends AppState {
  addCategory: (name: string, iconName: string) => void;
  updateCategory: (id: string, name: string, iconName: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'priceHistory'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addStore: (name: string) => void;
  updateStore: (store: Store) => void;
  deleteStore: (id: string) => void;
  toggleFavoriteStore: (id: string) => void;
  addShoppingList: (name: string) => void;
  updateShoppingList: (list: ShoppingList) => void;
  deleteShoppingList: (id: string) => void;
  duplicateShoppingList: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTodayDate = () => new Date().toLocaleDateString('fr-FR');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load data from localStorage or init defaults
  useEffect(() => {
    const savedCategories = localStorage.getItem('categories');
    const savedProducts = localStorage.getItem('products');
    const savedStores = localStorage.getItem('stores');
    const savedLists = localStorage.getItem('shoppingLists');

    let initialCategories: Category[] = [];

    if (savedCategories) {
      initialCategories = JSON.parse(savedCategories);
      setCategories(initialCategories);
    } else {
      initialCategories = DEFAULT_CATEGORIES.map(c => ({ ...c, id: generateId() }));
      setCategories(initialCategories);
    }

    if (savedProducts) setProducts(JSON.parse(savedProducts));

    if (savedStores) {
      setStores(JSON.parse(savedStores));
    } else {
      // Default stores init with all categories in default order
      const initialStores = DEFAULT_STORE_NAMES.map((name, index) => ({
        id: generateId(),
        name,
        isFavorite: index === 0,
        categoryOrder: initialCategories.map(c => c.id)
      }));
      setStores(initialStores);
    }

    if (savedLists) setShoppingLists(JSON.parse(savedLists));
    
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('categories', JSON.stringify(categories));
      localStorage.setItem('products', JSON.stringify(products));
      localStorage.setItem('stores', JSON.stringify(stores));
      localStorage.setItem('shoppingLists', JSON.stringify(shoppingLists));
    }
  }, [categories, products, stores, shoppingLists, loaded]);

  const addCategory = (name: string, iconName: string) => {
    const newCat: Category = { id: generateId(), name, iconName };
    setCategories(prev => [...prev, newCat]);
    // Add to all stores at the end
    setStores(prev => prev.map(s => ({...s, categoryOrder: [...s.categoryOrder, newCat.id]})));
  };

  const updateCategory = (id: string, name: string, iconName: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, iconName } : c));
  };

  const addProduct = (productData: Omit<Product, 'id' | 'priceHistory'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      priceHistory: [{ date: getTodayDate(), price: productData.defaultPrice }]
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => {
      if (p.id === updated.id) {
        const history = [...p.priceHistory];
        // If price changed, add to history
        if (p.defaultPrice !== updated.defaultPrice) {
          history.push({ date: getTodayDate(), price: updated.defaultPrice });
        }
        return { ...updated, priceHistory: history };
      }
      return p;
    }));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addStore = (name: string) => {
    const newStore: Store = {
      id: generateId(),
      name,
      isFavorite: stores.length === 0,
      categoryOrder: categories.map(c => c.id)
    };
    setStores(prev => [...prev, newStore]);
  };

  const updateStore = (store: Store) => {
    setStores(prev => prev.map(s => s.id === store.id ? store : s));
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const toggleFavoriteStore = (id: string) => {
    if (stores.find(s => s.id === id)?.isFavorite) return; // Already fav
    if (window.confirm("Définir ce magasin comme favori ?")) {
      setStores(prev => prev.map(s => ({ ...s, isFavorite: s.id === id })));
    }
  };

  const addShoppingList = (name: string) => {
    const favStore = stores.find(s => s.isFavorite);
    setShoppingLists(prev => [{
      id: generateId(),
      name,
      createdAt: getTodayDate(),
      storeId: favStore?.id,
      items: []
    }, ...prev]);
  };

  const updateShoppingList = (list: ShoppingList) => {
    setShoppingLists(prev => prev.map(l => l.id === list.id ? list : l));
  };

  const deleteShoppingList = (id: string) => {
    setShoppingLists(prev => prev.filter(l => l.id !== id));
  };

  const duplicateShoppingList = (id: string) => {
    const list = shoppingLists.find(l => l.id === id);
    if (list) {
      const newList = {
        ...list,
        id: generateId(),
        name: `${list.name} (Copie)`,
        createdAt: getTodayDate(),
        items: list.items.map(i => ({...i, isChecked: false})) // Uncheck items on copy
      };
      setShoppingLists(prev => [newList, ...prev]);
    }
  };

  return (
    <AppContext.Provider value={{
      categories, products, stores, shoppingLists,
      addCategory, updateCategory,
      addProduct, updateProduct, deleteProduct,
      addStore, updateStore, deleteStore, toggleFavoriteStore,
      addShoppingList, updateShoppingList, deleteShoppingList, duplicateShoppingList
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
