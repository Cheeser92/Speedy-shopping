import { Category, Product, ShoppingList, Store, WeeklyMenu, Recipe, RecipeCategory, ThemeColor, AppFontSize, Language } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_INITIAL_PRODUCTS, DEFAULT_STORE_NAMES, DEFAULT_RECIPE_CATEGORIES, DEFAULT_UNITS } from '../constants';

const DB_NAME = 'SpeedyShoppingDB';
const DB_VERSION = 1;

interface UserPreferences {
  darkMode: boolean;
  themeColor: ThemeColor;
  fontSize: AppFontSize;
  language: Language;
}

export class DatabaseService {
  private db: IDBDatabase | null = null;

  private connect(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject("Database error");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db!);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('stores')) db.createObjectStore('stores', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('shoppingLists')) db.createObjectStore('shoppingLists', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('weeklyMenus')) db.createObjectStore('weeklyMenus', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('recipes')) db.createObjectStore('recipes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('recipeCategories')) db.createObjectStore('recipeCategories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('units')) db.createObjectStore('units', { keyPath: 'name' }); // Using name as key
        if (!db.objectStoreNames.contains('preferences')) db.createObjectStore('preferences', { keyPath: 'id' });
      };
    });
  }

  // --- Migration Logic ---
  async initializeAndMigrate(): Promise<boolean> {
    const db = await this.connect();
    
    // Check if data exists in categories (as a proxy for fresh install vs existing data)
    const hasData = await this.count('categories') > 0;

    if (!hasData) {
      // Check LocalStorage
      const lsCategories = localStorage.getItem('categories');
      
      if (lsCategories) {
        console.log("Migrating from LocalStorage to IndexedDB...");
        try {
          const categories = JSON.parse(localStorage.getItem('categories') || '[]');
          const products = JSON.parse(localStorage.getItem('products') || '[]');
          const stores = JSON.parse(localStorage.getItem('stores') || '[]');
          const shoppingLists = JSON.parse(localStorage.getItem('shoppingLists') || '[]');
          const weeklyMenus = JSON.parse(localStorage.getItem('weeklyMenus') || '[]');
          const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
          const recipeCategories = JSON.parse(localStorage.getItem('recipeCategories') || '[]');
          const units = JSON.parse(localStorage.getItem('units') || '[]');
          
          const preferences: UserPreferences = {
            darkMode: JSON.parse(localStorage.getItem('darkMode') || 'false'),
            themeColor: (localStorage.getItem('themeColor') as ThemeColor) || 'blue',
            fontSize: (localStorage.getItem('fontSize') as AppFontSize) || 'medium',
            language: (localStorage.getItem('language') as Language) || 'en'
          };

          // Bulk Insert
          await this.bulkPut('categories', categories);
          await this.bulkPut('products', products);
          await this.bulkPut('stores', stores);
          await this.bulkPut('shoppingLists', shoppingLists);
          await this.bulkPut('weeklyMenus', weeklyMenus);
          await this.bulkPut('recipes', recipes);
          await this.bulkPut('recipeCategories', recipeCategories);
          
          // Units need special handling (array of strings -> array of objects)
          const unitObjects = units.map((u: string) => ({ name: u }));
          await this.bulkPut('units', unitObjects);

          await this.put('preferences', { id: 'user_settings', ...preferences });

          // Clear LocalStorage after successful migration (optional, keep purely as backup or clear)
          // localStorage.clear(); 
          return true;
        } catch (e) {
          console.error("Migration failed", e);
          return false;
        }
      } else {
        // Fresh Install - Load Defaults
        console.log("Fresh install, seeding defaults...");
        const generateId = () => Math.random().toString(36).substr(2, 9);
        
        const initialCategories = DEFAULT_CATEGORIES.map(c => ({ ...c, id: generateId() }));
        await this.bulkPut('categories', initialCategories);

        const initialProducts = DEFAULT_INITIAL_PRODUCTS.map(def => {
            const category = initialCategories.find(c => c.name === def.categoryName);
            if (category) {
              return {
                id: generateId(),
                name: def.name,
                categoryId: category.id,
                defaultPrice: 0,
                defaultUnit: (def as any).unit || 'Aucune',
                priceHistory: []
              };
            }
            return null;
        }).filter((p): p is Product => p !== null);
        await this.bulkPut('products', initialProducts);

        const sortedDefaultCatIds = [...initialCategories]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => c.id);

        const initialStores = DEFAULT_STORE_NAMES.map((name, index) => ({
            id: generateId(),
            name,
            isFavorite: index === 0,
            categoryOrder: sortedDefaultCatIds
        }));
        await this.bulkPut('stores', initialStores);
        
        const initialRecipeCats = DEFAULT_RECIPE_CATEGORIES.map(name => ({ id: generateId(), name }));
        await this.bulkPut('recipeCategories', initialRecipeCats);

        const initialUnits = DEFAULT_UNITS.map(u => ({ name: u }));
        await this.bulkPut('units', initialUnits);

        await this.put('preferences', { 
            id: 'user_settings', 
            darkMode: false, 
            themeColor: 'blue', 
            fontSize: 'medium', 
            language: 'en' 
        });
        
        return true;
      }
    }
    return true;
  }

  // --- CRUD Helpers ---

  private getTransaction(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("DB not initialized");
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  get<T>(storeName: string, id: string): Promise<T | undefined> {
      return new Promise((resolve, reject) => {
          const store = this.getTransaction(storeName, 'readonly');
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }

  put<T>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName: string): Promise<number> {
      return new Promise((resolve, reject) => {
          const store = this.getTransaction(storeName, 'readonly');
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }

  private bulkPut(storeName: string, items: any[]): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.db) return reject("DB not initialized");
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          
          items.forEach(item => store.put(item));
          
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }
  
  async clearAllData(): Promise<void> {
       if (!this.db) return;
       const storeNames = Array.from(this.db.objectStoreNames);
       const tx = this.db.transaction(storeNames, 'readwrite');
       storeNames.forEach(name => tx.objectStore(name).clear());
       return new Promise((resolve, reject) => {
           tx.oncomplete = () => resolve();
           tx.onerror = () => reject(tx.error);
       });
  }
}

export const dbService = new DatabaseService();