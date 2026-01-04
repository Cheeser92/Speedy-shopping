import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Category, Product, ShoppingList, Store, ThemeColor, AppFontSize, BackupData, WeeklyMenu, DayMenu, Language, ShoppingListItem, Recipe, RecipeCategory } from '../types';
import { TRANSLATIONS, CATEGORY_TRANSLATIONS, UNIT_TRANSLATIONS, PRODUCT_TRANSLATIONS } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";
import { dbService } from './database';

interface AppState {
  categories: Category[];
  products: Product[];
  stores: Store[];
  shoppingLists: ShoppingList[];
  weeklyMenus: WeeklyMenu[];
  recipes: Recipe[];
  recipeCategories: RecipeCategory[];
  units: string[];
  darkMode: boolean;
  themeColor: ThemeColor;
  fontSize: AppFontSize;
  language: Language;
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
  addShoppingList: (name: string, initialItems?: ShoppingListItem[]) => void;
  updateShoppingList: (list: ShoppingList) => void;
  deleteShoppingList: (id: string) => void;
  duplicateShoppingList: (id: string) => void;
  // Menu functions
  addWeeklyMenu: (menu: Omit<WeeklyMenu, 'id' | 'createdAt'>) => void;
  updateWeeklyMenu: (menu: WeeklyMenu) => void;
  deleteWeeklyMenu: (id: string) => void;
  duplicateWeeklyMenu: (id: string) => void;
  generateAIWeeklyMenu: (options: { restriction: string, dietetic: boolean, time: string, includeStarter: boolean, includeMain: boolean, includeDessert: boolean }) => Promise<WeeklyMenu['days']>;
  createListFromUrl: (recipeName: string, url: string) => Promise<void>;
  // Recipe functions
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  analyzeRecipeUrl: (url: string) => Promise<{ name: string, note: string }>;
  addRecipeCategory: (name: string) => string;
  updateRecipeCategory: (id: string, name: string) => void;
  deleteRecipeCategory: (id: string) => void;
  // Unit functions
  addUnit: (unit: string) => void;
  updateUnit: (oldUnit: string, newUnit: string) => void;
  deleteUnit: (unit: string) => void;
  toggleDarkMode: () => void;
  setThemeColor: (color: ThemeColor) => void;
  setFontSize: (size: AppFontSize) => void;
  setLanguage: (lang: Language) => void;
  importData: (data: BackupData) => void;
  // Translation helpers
  t: (key: keyof typeof TRANSLATIONS['fr']) => string;
  t_cat: (name: string) => string;
  t_prod: (name: string) => string;
  t_unit: (name: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTodayDate = () => new Date().toLocaleDateString('fr-FR');

// Helper pour créer un menu vide
export const createEmptyDayMenu = (): DayMenu => ({
  lunch: { starter: '', main: '', dessert: '' },
  dinner: { starter: '', main: '', dessert: '' }
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeCategories, setRecipeCategories] = useState<RecipeCategory[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  
  const [darkMode, setDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const [fontSize, setFontSize] = useState<AppFontSize>('medium');
  const [language, setLanguage] = useState<Language>('en');
  
  const [loaded, setLoaded] = useState(false);

  // Initialize DB and Load Data
  useEffect(() => {
    const initApp = async () => {
        try {
            await dbService.initializeAndMigrate();
            
            // Load Data
            const cats = await dbService.getAll<Category>('categories');
            const prods = await dbService.getAll<Product>('products');
            const sts = await dbService.getAll<Store>('stores');
            const lists = await dbService.getAll<ShoppingList>('shoppingLists');
            const menus = await dbService.getAll<WeeklyMenu>('weeklyMenus');
            const recs = await dbService.getAll<Recipe>('recipes');
            const recCats = await dbService.getAll<RecipeCategory>('recipeCategories');
            const unitObjs = await dbService.getAll<{name: string}>('units');
            const prefObj = await dbService.get<{id: string, darkMode: boolean, themeColor: ThemeColor, fontSize: AppFontSize, language: Language}>('preferences', 'user_settings');

            setCategories(cats);
            setProducts(prods);
            setStores(sts);
            setShoppingLists(lists);
            setWeeklyMenus(menus);
            setRecipes(recs);
            setRecipeCategories(recCats);
            setUnits(unitObjs.map(u => u.name));

            if (prefObj) {
                setDarkMode(prefObj.darkMode);
                setThemeColor(prefObj.themeColor);
                setFontSize(prefObj.fontSize);
                setLanguage(prefObj.language);
            }
            
            setLoaded(true);
        } catch (e) {
            console.error("Initialization failed", e);
        }
    };
    initApp();
  }, []);

  // Update Preferences Helper
  const updatePreferences = async (updates: Partial<{darkMode: boolean, themeColor: ThemeColor, fontSize: AppFontSize, language: Language}>) => {
      const newPrefs = { 
          id: 'user_settings',
          darkMode: updates.darkMode ?? darkMode,
          themeColor: updates.themeColor ?? themeColor,
          fontSize: updates.fontSize ?? fontSize,
          language: updates.language ?? language
      };
      await dbService.put('preferences', newPrefs);
  };

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
    // Only apply if loaded to prevent flash of wrong color
    if (!loaded) return; 
    
    // Safety check for palettes
    import('../constants').then(({ THEME_PALETTES }) => {
        const palette = THEME_PALETTES[themeColor];
        if (palette) {
            const root = document.documentElement;
            Object.entries(palette).forEach(([shade, value]) => {
                root.style.setProperty(`--color-primary-${shade}`, value as string);
            });
        }
    });
  }, [themeColor, loaded]);

  // Translation Functions
  const t = (key: keyof typeof TRANSLATIONS['fr']): string => {
    return TRANSLATIONS[language][key] || key;
  };

  const t_cat = (name: string): string => {
    if (language === 'en' && CATEGORY_TRANSLATIONS[name]) {
      return CATEGORY_TRANSLATIONS[name];
    }
    return name;
  };

  const t_prod = (name: string): string => {
    if (language === 'en' && PRODUCT_TRANSLATIONS[name]) {
      return PRODUCT_TRANSLATIONS[name];
    }
    return name;
  };

  const t_unit = (name: string): string => {
    if (language === 'en' && UNIT_TRANSLATIONS[name]) {
      return UNIT_TRANSLATIONS[name];
    }
    return name;
  };

  // Sort categories alphabetically for display (localized)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => t_cat(a.name).localeCompare(t_cat(b.name)));
  }, [categories, language]);

  // Sort recipe categories alphabetically
  const sortedRecipeCategories = useMemo(() => {
      return [...recipeCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, [recipeCategories]);

  // Sort units alphabetically for display (localized)
  const sortedUnits = useMemo(() => {
    return [...units].sort((a: string, b: string) => {
        if (a === 'Aucune') return -1;
        if (b === 'Aucune') return 1;
        return t_unit(a).localeCompare(t_unit(b), language === 'fr' ? 'fr' : 'en', { sensitivity: 'base' });
    });
  }, [units, language]);

  // --- ACTIONS (Now async writing to DB first, then state) ---

  const addCategory = async (name: string, iconName: string) => {
    const newCat: Category = { id: generateId(), name, iconName };
    await dbService.put('categories', newCat);
    setCategories(prev => [...prev, newCat]);
    
    // Update stores as well to include new category
    const updatedStores = stores.map(s => ({...s, categoryOrder: [...s.categoryOrder, newCat.id]}));
    for (const store of updatedStores) {
        await dbService.put('stores', store);
    }
    setStores(updatedStores);
  };

  const updateCategory = async (id: string, name: string, iconName: string) => {
    const updated = { id, name, iconName };
    await dbService.put('categories', updated);
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
  };

  const deleteCategory = async (id: string) => {
    await dbService.delete('categories', id);
    setCategories(prev => prev.filter(c => c.id !== id));
    
    // Update stores to remove category reference
    const updatedStores = stores.map(s => ({
        ...s,
        categoryOrder: s.categoryOrder.filter(cId => cId !== id)
    }));
    for (const store of updatedStores) {
        await dbService.put('stores', store);
    }
    setStores(updatedStores);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'priceHistory'>) => {
    const newId = generateId();
    const newProduct: Product = {
      ...productData,
      id: newId,
      priceHistory: [{ date: getTodayDate(), price: productData.defaultPrice }]
    };
    // Sync DB
    dbService.put('products', newProduct).catch(console.error);
    // Update State
    setProducts(prev => [...prev, newProduct]);
    return newId;
  };

  const updateProduct = async (updated: Product) => {
    // Logic for price history
    const existing = products.find(p => p.id === updated.id);
    let finalProduct = updated;
    
    if (existing) {
        const history = [...existing.priceHistory];
        if (existing.defaultPrice !== updated.defaultPrice) {
          history.push({ date: getTodayDate(), price: updated.defaultPrice });
        }
        finalProduct = { ...updated, priceHistory: history };
    }

    await dbService.put('products', finalProduct);
    setProducts(prev => prev.map(p => p.id === updated.id ? finalProduct : p));
  };

  const deleteProduct = async (id: string) => {
    await dbService.delete('products', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addStore = async (name: string) => {
    const sortedCatIds = [...categories]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => c.id);

    const newStore: Store = {
      id: generateId(),
      name,
      isFavorite: stores.length === 0,
      categoryOrder: sortedCatIds
    };
    await dbService.put('stores', newStore);
    setStores(prev => [...prev, newStore]);
  };

  const updateStore = async (store: Store) => {
    await dbService.put('stores', store);
    setStores(prev => prev.map(s => s.id === store.id ? store : s));
  };

  const deleteStore = async (id: string) => {
    await dbService.delete('stores', id);
    setStores(prev => prev.filter(s => s.id !== id));
  };

  const toggleFavoriteStore = async (id: string) => {
    const updatedStores = stores.map(s => ({ ...s, isFavorite: s.id === id }));
    // Batch update DB
    for(const store of updatedStores) {
        await dbService.put('stores', store);
    }
    setStores(updatedStores);
  };

  const addShoppingList = async (name: string, initialItems: ShoppingListItem[] = []) => {
    const favStore = stores.find(s => s.isFavorite);
    const newList = {
      id: generateId(),
      name,
      createdAt: getTodayDate(),
      storeId: favStore?.id,
      items: initialItems
    };
    await dbService.put('shoppingLists', newList);
    setShoppingLists(prev => [newList, ...prev]);
  };

  const updateShoppingList = async (list: ShoppingList) => {
    await dbService.put('shoppingLists', list);
    setShoppingLists(prev => prev.map(l => l.id === list.id ? list : l));
  };

  const deleteShoppingList = async (id: string) => {
    await dbService.delete('shoppingLists', id);
    setShoppingLists(prev => prev.filter(l => l.id !== id));
  };

  const duplicateShoppingList = async (id: string) => {
    const list = shoppingLists.find(l => l.id === id);
    if (list) {
      const newList = {
        ...list,
        id: generateId(),
        name: `${list.name} (Copie)`,
        createdAt: getTodayDate(),
        items: list.items.map(i => ({...i, isChecked: false}))
      };
      await dbService.put('shoppingLists', newList);
      setShoppingLists(prev => [newList, ...prev]);
    }
  };

  // --- MENU FUNCTIONS ---

  const addWeeklyMenu = async (menuData: Omit<WeeklyMenu, 'id' | 'createdAt'>) => {
    const newMenu: WeeklyMenu = {
      ...menuData,
      id: generateId(),
      createdAt: getTodayDate(),
    };
    await dbService.put('weeklyMenus', newMenu);
    setWeeklyMenus(prev => [newMenu, ...prev]);
  };

  const updateWeeklyMenu = async (menu: WeeklyMenu) => {
    await dbService.put('weeklyMenus', menu);
    setWeeklyMenus(prev => prev.map(m => m.id === menu.id ? menu : m));
  };

  const deleteWeeklyMenu = async (id: string) => {
    await dbService.delete('weeklyMenus', id);
    setWeeklyMenus(prev => prev.filter(m => m.id !== id));
  };

  const duplicateWeeklyMenu = async (id: string) => {
    const menu = weeklyMenus.find(m => m.id === id);
    if (menu) {
      const newMenu = {
        ...menu,
        id: generateId(),
        name: `${menu.name} (Copie)`,
        createdAt: getTodayDate()
      };
      await dbService.put('weeklyMenus', newMenu);
      setWeeklyMenus(prev => [newMenu, ...prev]);
    }
  };

  // --- RECIPE FUNCTIONS ---

  const addRecipe = async (recipeData: Omit<Recipe, 'id'>) => {
      const newRecipe = { ...recipeData, id: generateId() };
      await dbService.put('recipes', newRecipe);
      setRecipes(prev => [...prev, newRecipe]);
  };

  const updateRecipe = async (recipe: Recipe) => {
      await dbService.put('recipes', recipe);
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
  };

  const deleteRecipe = async (id: string) => {
      await dbService.delete('recipes', id);
      setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addRecipeCategory = async (name: string) => {
      const id = generateId();
      const newCat = { id, name };
      await dbService.put('recipeCategories', newCat);
      setRecipeCategories(prev => [...prev, newCat]);
      return id;
  };

  const updateRecipeCategory = async (id: string, name: string) => {
      const updated = { id, name };
      await dbService.put('recipeCategories', updated);
      setRecipeCategories(prev => prev.map(c => c.id === id ? updated : c));
  };

  const deleteRecipeCategory = async (id: string) => {
      await dbService.delete('recipeCategories', id);
      setRecipeCategories(prev => prev.filter(c => c.id !== id));
  };

  const analyzeRecipeUrl = async (url: string): Promise<{ name: string, note: string }> => {
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const outputLang = language === 'fr' ? 'Français' : 'English';

          const prompt = `
            Task: Extract recipe details from the provided URL.
            URL: ${url}
            Target Language: ${outputLang}

            Instructions:
            1. Use the Google Search tool to access the content of the URL and READ the page content.
            2. Extract the Recipe Name.
            3. Extract the Preparation Time, Cooking Time, Ingredients, and Instructions.
            4. Format the "note" field EXACTLY as follows (Markdown format):
               **Temps de préparation et de cuisson**
               [Prep time, Cooking time]
               
               **Ingrédients**
               - [Ingredient 1]
               - [Ingredient 2]
               ...
               
               **Recette**
               [Step by step instructions]
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: prompt,
              config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        note: { type: Type.STRING }
                    }
                }
              }
          });

          const result = JSON.parse(response.text || "{}");
          
          return {
              name: result.name || '',
              note: result.note || ''
          };

      } catch (error) {
          console.error("AI Recipe Analysis failed", error);
          throw error;
      }
  };

  // AI Generation
  const generateAIWeeklyMenu = async (options: { 
      restriction: string, 
      dietetic: boolean, 
      time: string,
      includeStarter: boolean,
      includeMain: boolean,
      includeDessert: boolean
  }): Promise<WeeklyMenu['days']> => {
    try {
      if (!process.env.API_KEY) {
          throw new Error("Clé API manquante");
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const languageText = language === 'fr' ? 'français' : 'english';
      
      let starterInstruction = options.includeStarter 
          ? "   - For 'starter': Search for a real recipe. Fill 'starter' (title) and 'starterUrl'."
          : "   - For 'starter': DO NOT Generate a dish. Set 'starter' to \"\" (empty string) and 'starterUrl' to \"\" (empty string).";

      let mainInstruction = options.includeMain
          ? "   - For 'main': Search for a real recipe. Fill 'main' (title) and 'mainUrl'."
          : "   - For 'main': DO NOT Generate a dish. Set 'main' to \"\" (empty string) and 'mainUrl' to \"\" (empty string).";

      let dessertInstruction = options.includeDessert
          ? "   - For 'dessert': Search for a real recipe. Fill 'dessert' (title) and 'dessertUrl'."
          : "   - For 'dessert': DO NOT Generate a dish. Set 'dessert' to \"\" (empty string) and 'dessertUrl' to \"\" (empty string).";

      const prompt = `
        Role: You are a professional meal planner.
        Context: Language=${languageText}, Restriction=${options.restriction}, Dietetic=${options.dietetic}, Time=${options.time}.

        TASK:
        1. Create a 7-day menu (Lunch and Dinner).
        2. **GROUNDING INSTRUCTIONS**:
        ${starterInstruction}
        ${mainInstruction}
        ${dessertInstruction}
        
        **ANTI-HALLUCINATION RULES**:
        - **NEVER** construct a URL manually. Do not guess links.
        - **ONLY** use URLs provided by the search tool's output for the fields that require search.
        - If search is disabled for a field, verify the URL field is empty.
        - If the instruction says "DO NOT Generate", the value MUST be an empty string "".

        JSON FORMAT:
        Return ONLY a JSON Array.
        [
           {
             "day": "monday",
             "lunch": { 
               "starter": "...", "starterUrl": "...", 
               "main": "...", "mainUrl": "...", 
               "dessert": "...", "dessertUrl": "..." 
             },
             "dinner": { ... }
           },
           ...
        ]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      let text = response.text;
      if (!text) throw new Error("No response from AI");
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
          text = jsonMatch[0];
      }

      let parsedArray: any[];
      try {
        parsedArray = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse AI response as JSON Array", text);
        const secondTry = text.replace(/```json/g, '').replace(/```/g, '');
        try {
            parsedArray = JSON.parse(secondTry);
        } catch (e2) {
            throw new Error("Invalid format received from AI");
        }
      }

      if (!Array.isArray(parsedArray)) {
          throw new Error("AI did not return an array");
      }

      const resultObj: any = {};
      const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      const dayMapping: Record<string, string> = {
          'lundi': 'monday', 'monday': 'monday',
          'mardi': 'tuesday', 'tuesday': 'tuesday',
          'mercredi': 'wednesday', 'wednesday': 'wednesday',
          'jeudi': 'thursday', 'thursday': 'thursday',
          'vendredi': 'friday', 'friday': 'friday',
          'samedi': 'saturday', 'saturday': 'saturday',
          'dimanche': 'sunday', 'sunday': 'sunday'
      };

      daysOrder.forEach(day => {
          resultObj[day] = createEmptyDayMenu();
      });

      parsedArray.forEach((item: any) => {
          if (item && item.day) {
              const rawDay = item.day.toLowerCase().trim();
              const dayKey = dayMapping[rawDay];
              
              if (dayKey && daysOrder.includes(dayKey)) {
                  resultObj[dayKey] = {
                      lunch: {
                          starter: item.lunch?.starter || '',
                          starterUrl: item.lunch?.starterUrl || '',
                          main: item.lunch?.main || '',
                          mainUrl: item.lunch?.mainUrl || '',
                          dessert: item.lunch?.dessert || '',
                          dessertUrl: item.lunch?.dessertUrl || ''
                      },
                      dinner: {
                          starter: item.dinner?.starter || '',
                          starterUrl: item.dinner?.starterUrl || '',
                          main: item.dinner?.main || '',
                          mainUrl: item.dinner?.mainUrl || '',
                          dessert: item.dinner?.dessert || '',
                          dessertUrl: item.dinner?.dessertUrl || ''
                      }
                  };
              }
          }
      });

      return resultObj as WeeklyMenu['days'];
    } catch (error) {
      console.error("AI Generation failed", error);
      throw error;
    }
  };

  const createListFromUrl = async (recipeName: string, url: string) => {
      try {
          if (!process.env.API_KEY) throw new Error("API Key missing");
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const productListContext = products.map(p => `- ID: ${p.id}, Name: ${p.name}`).join('\n');
          const unitListContext = units.join(', ');
          
          const prompt = `
            Task: Create a detailed shopping list for the recipe "${recipeName}".
            Recipe URL: ${url}
            
            Inventory (ID, Name):
            ${productListContext}

            Available Units:
            [${unitListContext}]

            Instructions:
            1. **CRITICAL STEP**: Use the Google Search tool to find the list of ingredients for the recipe "${recipeName}" from the URL provided. 
            2. If you cannot access the content of the URL directly, you MUST use Google Search to search for the recipe name "${recipeName}" and find the ingredients that way. Do not return an empty list without trying to search for the recipe name.
            3. Extract ALL ingredients found.
            4. For each ingredient:
               - perform a SEMANTIC analysis to check if it matches a product in the Inventory. 
               - "Matches" means it is the same item, even if the phrasing is slightly different (e.g., "Tomato" matches "Tomatoes", "Beef steak" matches "Steak").
               - If a semantic match is found, use the corresponding ID.
               - If NO match is found, do NOT invent an ID. Return the ingredient name as "customName".
            5. Extract quantity and unit if possible.
               - For "unit", you MUST choose strictly from the "Available Units" list provided above.
               - Perform semantic matching for the unit (e.g., "tbsp" -> "cuillère à soupe", "g" -> "g").
               - If the unit in the recipe is not in the list or is abstract (e.g., "pinch", "some"), or if no unit is specified, use "Aucune".
            
            Output JSON format:
            [
                { "productId": "id_from_inventory", "quantity": 1, "unit": "kg" },
                { "customName": "Ingredient Name From Recipe", "quantity": 2, "unit": "Aucune" } 
            ]
            
            Return ONLY JSON.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: prompt,
              config: { tools: [{ googleSearch: {} }] }
          });

          let text = response.text || "[]";
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if(jsonMatch) text = jsonMatch[0];
          
          const ingredients = JSON.parse(text);
          
          const newItems: ShoppingListItem[] = ingredients.map((ing: any) => {
              let itemUnit = ing.unit || 'Aucune';
              
              // Force l'unité du produit si une correspondance est trouvée
              if (ing.productId) {
                  const matchedProduct = products.find(p => p.id === ing.productId);
                  if (matchedProduct && matchedProduct.defaultUnit && matchedProduct.defaultUnit !== 'Aucune') {
                      itemUnit = matchedProduct.defaultUnit;
                  }
              }
              
              return {
                  productId: ing.productId,
                  customName: ing.customName,
                  quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
                  unit: itemUnit,
                  isChecked: false
              };
          });

          await addShoppingList(recipeName, newItems);

      } catch (error) {
          console.error("Failed to create list from recipe", error);
          throw error;
      }
  };

  // ----------------------

  const addUnit = async (unit: string) => {
    const trimmed = unit.trim();
    if(trimmed && !units.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
        await dbService.put('units', { name: trimmed });
        setUnits(prev => [...prev, trimmed]);
    }
  };

  const updateUnit = async (oldUnit: string, newUnit: string) => {
    const trimmedNew = newUnit.trim();
    // In IDB, 'name' is the key, so we delete old and add new
    await dbService.delete('units', oldUnit);
    await dbService.put('units', { name: trimmedNew });
    setUnits(prev => prev.map(u => u === oldUnit ? trimmedNew : u));
  };

  const deleteUnit = async (unit: string) => {
    await dbService.delete('units', unit);
    setUnits(prev => prev.filter(u => u !== unit));
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    updatePreferences({ darkMode: newVal });
  };

  const setThemeColorWrapper = (color: ThemeColor) => {
      setThemeColor(color);
      updatePreferences({ themeColor: color });
  };

  const setFontSizeWrapper = (size: AppFontSize) => {
      setFontSize(size);
      updatePreferences({ fontSize: size });
  };

  const setLanguageWrapper = (lang: Language) => {
      setLanguage(lang);
      updatePreferences({ language: lang });
  };

  const importData = async (data: BackupData) => {
      if (!data.categories || !data.products || !data.stores || !data.shoppingLists) {
          throw new Error("Format de fichier invalide");
      }

      // Clear existing DB first for clean import
      await dbService.clearAllData();

      // Bulk add
      // Note: dbService helper for bulk add isn't exposed publicly in the simple interface, 
      // but we can iterate put.
      
      const promises = [];
      
      for(const c of data.categories) promises.push(dbService.put('categories', c));
      for(const p of data.products) promises.push(dbService.put('products', p));
      for(const s of data.stores) promises.push(dbService.put('stores', s));
      for(const l of data.shoppingLists) promises.push(dbService.put('shoppingLists', l));
      if(data.weeklyMenus) for(const m of data.weeklyMenus) promises.push(dbService.put('weeklyMenus', m));
      if(data.recipes) for(const r of data.recipes) promises.push(dbService.put('recipes', r));
      if(data.recipeCategories) for(const rc of data.recipeCategories) promises.push(dbService.put('recipeCategories', rc));
      
      const unitsToImport = data.units || [];
      for(const u of unitsToImport) promises.push(dbService.put('units', { name: u }));

      if (data.preferences) {
          const pref = { id: 'user_settings', ...data.preferences };
          promises.push(dbService.put('preferences', pref));
      }

      await Promise.all(promises);

      // Reload state
      setCategories(data.categories);
      setProducts(data.products);
      setStores(data.stores);
      setShoppingLists(data.shoppingLists);
      if(data.weeklyMenus) setWeeklyMenus(data.weeklyMenus); else setWeeklyMenus([]);
      if(data.recipes) setRecipes(data.recipes); else setRecipes([]);
      if(data.recipeCategories) setRecipeCategories(data.recipeCategories); else setRecipeCategories([]);
      setUnits(unitsToImport);
      
      if(data.preferences) {
          if (data.preferences.darkMode !== undefined) setDarkMode(!!data.preferences.darkMode);
          if (data.preferences.themeColor) setThemeColor(data.preferences.themeColor);
          if (data.preferences.fontSize) setFontSize(data.preferences.fontSize);
          if (data.preferences.language) setLanguage(data.preferences.language);
      }
  };

  return (
    <AppContext.Provider value={{
      categories: sortedCategories,
      products, stores, shoppingLists, weeklyMenus, recipes, 
      recipeCategories: sortedRecipeCategories,
      units: sortedUnits,
      darkMode, themeColor, fontSize, language,
      addCategory, updateCategory, deleteCategory,
      addProduct, updateProduct, deleteProduct,
      addStore, updateStore, deleteStore, toggleFavoriteStore,
      addShoppingList, updateShoppingList, deleteShoppingList, duplicateShoppingList,
      addWeeklyMenu, updateWeeklyMenu, deleteWeeklyMenu, duplicateWeeklyMenu, generateAIWeeklyMenu,
      createListFromUrl,
      addRecipe, updateRecipe, deleteRecipe, analyzeRecipeUrl,
      addRecipeCategory, updateRecipeCategory, deleteRecipeCategory,
      addUnit, updateUnit, deleteUnit,
      toggleDarkMode, 
      setThemeColor: setThemeColorWrapper, 
      setFontSize: setFontSizeWrapper, 
      setLanguage: setLanguageWrapper,
      importData,
      t, t_cat, t_prod, t_unit
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