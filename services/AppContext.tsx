import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Category, Product, ShoppingList, Store, ThemeColor, AppFontSize, BackupData, WeeklyMenu, DayMenu, Language, ShoppingListItem, Recipe, RecipeCategory } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_STORE_NAMES, DEFAULT_UNITS, THEME_PALETTES, FONT_SIZES, DEFAULT_INITIAL_PRODUCTS, TRANSLATIONS, CATEGORY_TRANSLATIONS, UNIT_TRANSLATIONS, PRODUCT_TRANSLATIONS, DEFAULT_RECIPE_CATEGORIES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

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

  // Load data from localStorage or init defaults
  useEffect(() => {
    const savedCategories = localStorage.getItem('categories');
    const savedProducts = localStorage.getItem('products');
    const savedStores = localStorage.getItem('stores');
    const savedLists = localStorage.getItem('shoppingLists');
    const savedMenus = localStorage.getItem('weeklyMenus');
    const savedRecipes = localStorage.getItem('recipes');
    const savedRecipeCategories = localStorage.getItem('recipeCategories');
    const savedUnits = localStorage.getItem('units');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedThemeColor = localStorage.getItem('themeColor');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedLanguage = localStorage.getItem('language');

    let initialCategories: Category[] = [];

    if (savedCategories) {
      initialCategories = JSON.parse(savedCategories);
      setCategories(initialCategories);
    } else {
      initialCategories = DEFAULT_CATEGORIES.map(c => ({ ...c, id: generateId() }));
      setCategories(initialCategories);
    }

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Generate default products from constants if no products exist
      const initialProducts: Product[] = DEFAULT_INITIAL_PRODUCTS.map(def => {
        const category = initialCategories.find(c => c.name === def.categoryName);
        if (category) {
          return {
            id: generateId(),
            name: def.name,
            categoryId: category.id,
            defaultPrice: 0,
            defaultUnit: (def as any).unit || 'Aucune',
            priceHistory: [] // Initial history is empty as requested
          };
        }
        return null;
      }).filter((p): p is Product => p !== null);
      
      setProducts(initialProducts);
    }

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
    if (savedMenus) setWeeklyMenus(JSON.parse(savedMenus));
    
    if (savedRecipes) {
        setRecipes(JSON.parse(savedRecipes));
    }

    if (savedRecipeCategories) {
        setRecipeCategories(JSON.parse(savedRecipeCategories));
    } else {
        const initialRecipeCats = DEFAULT_RECIPE_CATEGORIES.map(name => ({ id: generateId(), name }));
        setRecipeCategories(initialRecipeCats);
    }

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
        if (Object.keys(FONT_SIZES).includes(savedFontSize)) {
            setFontSize(savedFontSize as AppFontSize);
        } else {
            setFontSize('medium');
        }
    }

    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage as Language);
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
      localStorage.setItem('weeklyMenus', JSON.stringify(weeklyMenus));
      localStorage.setItem('recipes', JSON.stringify(recipes));
      localStorage.setItem('recipeCategories', JSON.stringify(recipeCategories));
      localStorage.setItem('units', JSON.stringify(units));
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      localStorage.setItem('themeColor', themeColor);
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('language', language);
    }
  }, [categories, products, stores, shoppingLists, weeklyMenus, recipes, recipeCategories, units, darkMode, themeColor, fontSize, language, loaded]);

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

  const addShoppingList = (name: string, initialItems: ShoppingListItem[] = []) => {
    const favStore = stores.find(s => s.isFavorite);
    setShoppingLists(prev => [{
      id: generateId(),
      name,
      createdAt: getTodayDate(),
      storeId: favStore?.id,
      items: initialItems
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

  // --- MENU FUNCTIONS ---

  const addWeeklyMenu = (menuData: Omit<WeeklyMenu, 'id' | 'createdAt'>) => {
    const newMenu: WeeklyMenu = {
      ...menuData,
      id: generateId(),
      createdAt: getTodayDate(),
    };
    setWeeklyMenus(prev => [newMenu, ...prev]);
  };

  const updateWeeklyMenu = (menu: WeeklyMenu) => {
    setWeeklyMenus(prev => prev.map(m => m.id === menu.id ? menu : m));
  };

  const deleteWeeklyMenu = (id: string) => {
    setWeeklyMenus(prev => prev.filter(m => m.id !== id));
  };

  const duplicateWeeklyMenu = (id: string) => {
    const menu = weeklyMenus.find(m => m.id === id);
    if (menu) {
      const newMenu = {
        ...menu,
        id: generateId(),
        name: `${menu.name} (Copie)`,
        createdAt: getTodayDate()
      };
      setWeeklyMenus(prev => [newMenu, ...prev]);
    }
  };

  // --- RECIPE FUNCTIONS ---

  const addRecipe = (recipeData: Omit<Recipe, 'id'>) => {
      setRecipes(prev => [...prev, { ...recipeData, id: generateId() }]);
  };

  const updateRecipe = (recipe: Recipe) => {
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
  };

  const deleteRecipe = (id: string) => {
      setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const addRecipeCategory = (name: string) => {
      const id = generateId();
      setRecipeCategories(prev => [...prev, { id, name }]);
      return id;
  };

  const updateRecipeCategory = (id: string, name: string) => {
      setRecipeCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteRecipeCategory = (id: string) => {
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

          // response.text est maintenant garanti d'être du JSON valide grâce au responseSchema
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
          
          // Prepare context
          const productListContext = products.map(p => `- ID: ${p.id}, Name: ${p.name}`).join('\n');
          const unitListContext = units.join(', ');
          
          // Updated prompt to force search of ingredients and semantic unit matching
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

          addShoppingList(recipeName, newItems);

      } catch (error) {
          console.error("Failed to create list from recipe", error);
          throw error;
      }
  };

  // ----------------------

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

  const importData = (data: BackupData) => {
      // Validation basique
      if (!data.categories || !data.products || !data.stores || !data.shoppingLists) {
          throw new Error("Format de fichier invalide");
      }

      setCategories(data.categories);
      setProducts(data.products);
      setStores(data.stores);
      setShoppingLists(data.shoppingLists);
      if(data.weeklyMenus) setWeeklyMenus(data.weeklyMenus);
      if(data.recipes) setRecipes(data.recipes);
      if(data.recipeCategories) {
          setRecipeCategories(data.recipeCategories);
      } else {
          const initialRecipeCats = DEFAULT_RECIPE_CATEGORIES.map(name => ({ id: generateId(), name }));
          setRecipeCategories(initialRecipeCats);
      }
      
      if(data.units) {
          setUnits(data.units);
      } else {
          setUnits(DEFAULT_UNITS);
      }
      
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
      toggleDarkMode, setThemeColor, setFontSize, setLanguage,
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