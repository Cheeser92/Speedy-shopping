
export interface Category {
  id: string;
  name: string;
  iconName: string;
}

export interface PricePoint {
  date: string; // ISO Date
  price: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  defaultPrice: number;
  defaultUnit: string;
  note?: string;
  priceHistory: PricePoint[];
}

export interface Store {
  id: string;
  name: string;
  categoryOrder: string[]; // Array of Category IDs defining the order
  isFavorite: boolean;
}

export interface ShoppingListItem {
  productId?: string; // Optional now
  customName?: string; // For items not in database yet
  quantity: number;
  unit?: string; // The unit specific to this list item (e.g. "500 g" instead of default "1 kg")
  isChecked: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string; // dd/mm/yyyy
  storeId?: string;
  items: ShoppingListItem[];
}

// --- Types pour les Menus ---

export interface Meal {
  starter: string;
  starterUrl?: string;
  main: string;
  mainUrl?: string;
  dessert: string;
  dessertUrl?: string;
}

export interface DayMenu {
  lunch: Meal;
  dinner: Meal;
}

export interface WeeklyMenu {
  id: string;
  name: string;
  createdAt: string;
  days: {
    monday: DayMenu;
    tuesday: DayMenu;
    wednesday: DayMenu;
    thursday: DayMenu;
    friday: DayMenu;
    saturday: DayMenu;
    sunday: DayMenu;
  };
}

// --- Types pour les Recettes (Plats) ---

export type DishType = 'starter' | 'main' | 'dessert' | '';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all' | '';

export interface RecipeCategory {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  link?: string;
  note?: string;
  type: DishType;
  categoryId: string; // ID of RecipeCategory
  season: Season;
}

// ---------------------------

export type ThemeColor = 'blue' | 'bordeaux' | 'yellow' | 'orange' | 'mauve' | 'green';
export type AppFontSize = 'small' | 'medium' | 'large';
export type Language = 'fr' | 'en';

export interface BackupData {
  version: number;
  timestamp: string;
  categories: Category[];
  products: Product[];
  stores: Store[];
  shoppingLists: ShoppingList[];
  weeklyMenus: WeeklyMenu[];
  recipes: Recipe[];          // Ajout
  recipeCategories: RecipeCategory[]; // Ajout
  units: string[];
  preferences: {
    darkMode: boolean;
    themeColor: ThemeColor;
    fontSize: AppFontSize;
    language: Language;
  };
}
