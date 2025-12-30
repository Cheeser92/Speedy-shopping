
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Category, Product, ShoppingList, Store, ThemeColor, AppFontSize } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_NAMES, DEFAULT_UNITS, THEME_PALETTES } from '../constants';

interface AppState {
  categories: Category[];
  products: Product[];
  stores: Store[];
  shoppingLists: ShoppingList[];
  units: string[];
  darkMode: boolean;
  themeColor: ThemeColor;
  fontSize: AppFontSize;
}

interface AppContextType extends AppState {
  addCategory: (name: string, iconName: string) => void;
  updateCategory: (id: string, name: string, iconName: string) => void;
  deleteCategory: (id: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'priceHistory'>) => string;
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
  addUnit: (unit: string) => void;
  updateUnit: (oldUnit: string, newUnit: string) => void;
  deleteUnit: (unit: string) => void;
  toggleDarkMode: () => void;
  setThemeColor: (color: ThemeColor) => void;
  setFontSize: (size: AppFontSize) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTodayDate = () => new Date().toLocaleDateString('fr-FR');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const [fontSize, setFontSize] = useState<AppFontSize>('medium');
  const [loaded, setLoaded] = useState(false);

  // Load data from localStorage or init defaults
  useEffect(() => {
    const savedCategories = localStorage.getItem('categories');
    const savedProducts = localStorage.getItem('products');
    const savedStores = localStorage.getItem('stores');
    const savedLists = localStorage.getItem('shoppingLists');
    const savedUnits = localStorage.getItem('units');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedThemeColor = localStorage.getItem('themeColor');
    const savedFontSize = localStorage.getItem('fontSize');

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
      const sortedDefaultCatIds = [...initialCategories]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => c.id);

      const initialStores = DEFAULT_STORE_NAMES.map((name, index) => ({
        id: generateId(),
        name,
        isFavorite: index === 0,
        categoryOrder: sortedDefaultCatIds
      }));
      setStores(initialStores);
    }

    if (savedLists) setShoppingLists(JSON.parse(savedLists));

    if (savedUnits) {
        const parsedSavedUnits: string[] = JSON.parse(savedUnits);
        const mergedUnits = Array.from(new Set([...parsedSavedUnits, ...DEFAULT_UNITS]));
        setUnits(mergedUnits);
    } else {
        setUnits(DEFAULT_UNITS);
    }

    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    if (savedThemeColor) {
        setThemeColor(savedThemeColor as ThemeColor);
    }

    if (savedFontSize) {
        setFontSize(savedFontSize as AppFontSize);
    }
    
    setLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('categories', JSON.stringify(categories));
      localStorage.setItem('products', JSON.stringify(products));
      localStorage.setItem('stores', JSON.stringify(stores));
      localStorage.setItem('shoppingLists', JSON.stringify(shoppingLists));
      localStorage.setItem('units', JSON.stringify(units));
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      localStorage.setItem('themeColor', themeColor);
      localStorage.setItem('fontSize', fontSize);
    }
  }, [categories, products, stores, shoppingLists, units, darkMode, themeColor, fontSize, loaded]);

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply CSS Variables for Theme
  useEffect(() => {
    const palette = THEME_PALETTES[themeColor];
    const root = document.documentElement;
    Object.entries(palette).forEach(([shade, value]) => {
        root.style.setProperty(`--color-primary-${shade}`, value as string);
    });
  }, [themeColor]);

  // Sort categories alphabetically for display
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  // Sort units alphabetically for display
  const sortedUnits = useMemo(() => {
    return [...units].sort((a: string, b: string) => {
        if (a === 'Aucune') return -1;
        if (b === 'Aucune') return 1;
        return a.localeCompare(b, 'fr', { sensitivity: 'base' });
    });
  }, [units]);

  const addCategory = (name: string, iconName: string) => {
    const newCat: Category = { id: generateId(), name, iconName };
    setCategories(prev => [...prev, newCat]);
    setStores(prev => prev.map(s => ({...s, categoryOrder: [...s.categoryOrder, newCat.id]})));
  };

  const updateCategory = (id: string, name: string, iconName: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, iconName } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setStores(prev => prev.map(s => ({
        ...s,
        categoryOrder: s.categoryOrder.filter(cId => cId !== id)
    })));
  };

  const addProduct = (productData: Omit<Product, 'id' | 'priceHistory'>) => {
    const newId = generateId();
    const newProduct: Product = {
      ...productData,
      id: newId,
      priceHistory: [{ date: getTodayDate(), price: productData.defaultPrice }]
    };
    setProducts(prev => [...prev, newProduct]);
    return newId;
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => {
      if (p.id === updated.id) {
        const history = [...p.priceHistory];
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
    const sortedCatIds = [...categories]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => c.id);

    const newStore: Store = {
      id: generateId(),
      name,
      isFavorite: stores.length === 0,
      categoryOrder: sortedCatIds
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
    if (stores.find(s => s.id === id)?.isFavorite) return;
    setStores(prev => prev.map(s => ({ ...s, isFavorite: s.id === id })));
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
        items: list.items.map(i => ({...i, isChecked: false}))
      };
      setShoppingLists(prev => [newList, ...prev]);
    }
  };

  const addUnit = (unit: string) => {
    const trimmed = unit.trim();
    if(trimmed && !units.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
        setUnits(prev => [...prev, trimmed]);
    }
  };

  const updateUnit = (oldUnit: string, newUnit: string) => {
    setUnits(prev => prev.map(u => u === oldUnit ? newUnit.trim() : u));
  };

  const deleteUnit = (unit: string) => {
    setUnits(prev => prev.filter(u => u !== unit));
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <AppContext.Provider value={{
      categories: sortedCategories,
      products, stores, shoppingLists, 
      units: sortedUnits,
      darkMode, themeColor, fontSize,
      addCategory, updateCategory, deleteCategory,
      addProduct, updateProduct, deleteProduct,
      addStore, updateStore, deleteStore, toggleFavoriteStore,
      addShoppingList, updateShoppingList, deleteShoppingList, duplicateShoppingList,
      addUnit, updateUnit, deleteUnit,
      toggleDarkMode, setThemeColor, setFontSize
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
