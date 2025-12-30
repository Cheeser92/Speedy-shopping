
import { Category, Store, ThemeColor, AppFontSize } from './types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Papeterie', iconName: 'Pencil' },
  { name: 'Electroménager', iconName: 'Tv' },
  { name: 'Informatique / multimédia', iconName: 'Laptop' },
  { name: 'Droguerie', iconName: 'SprayCan' },
  { name: 'Animalerie', iconName: 'Dog' },
  { name: 'Jardinage', iconName: 'Flower' },
  { name: 'Fournitures scolaires', iconName: 'Ruler' },
  { name: 'Bricolage', iconName: 'Hammer' },
  { name: 'Ustensiles de cuisine', iconName: 'Utensils' },
  { name: 'Vaisselle / Art de la table', iconName: 'CupSoda' },
  { name: 'Décoration', iconName: 'Lamp' },
  { name: 'Jouets', iconName: 'Gamepad2' },
  { name: 'Produits d’entretien', iconName: 'Sparkles' },
  { name: 'Gâteaux apéritifs', iconName: 'Cookie' },
  { name: 'Boissons non alcoolisées', iconName: 'GlassWater' },
  { name: 'Boissons alcoolisées', iconName: 'Wine' },
  { name: 'Bio', iconName: 'Leaf' },
  { name: 'Produits en vrac / au poids', iconName: 'Scale' },
  { name: 'Boulangerie', iconName: 'Croissant' },
  { name: 'Hygiène / Santé', iconName: 'HeartPulse' },
  { name: 'Matières premières', iconName: 'Wheat' },
  { name: 'Vêtements', iconName: 'Shirt' },
  { name: 'Gâteaux', iconName: 'CakeSlice' },
  { name: 'Petit déjeuné', iconName: 'Coffee' },
  { name: 'Thé / café', iconName: 'CupSoda' },
  { name: 'Condiments', iconName: 'Pepper' },
  { name: 'Produits du monde', iconName: 'Globe' },
  { name: 'Puériculture', iconName: 'Baby' },
  { name: 'Alimentation sèche', iconName: 'Box' },
  { name: 'Conserves', iconName: 'Cylinder' },
  { name: 'Confiserie', iconName: 'Candy' },
  { name: 'Fruits / légumes', iconName: 'Apple' },
  { name: 'Laiterie', iconName: 'Milk' },
  { name: 'Crémerie / Fromagerie', iconName: 'Cheese' },
  { name: 'Surgelés', iconName: 'Snowflake' },
  { name: 'Asiatique / Japonais', iconName: 'Chopsticks' },
  { name: 'Pause déjeuné', iconName: 'Sandwich' },
  { name: 'Traiteur', iconName: 'ChefHat' },
  { name: 'Charcuterie', iconName: 'Sausage' },
  { name: 'Boucherie', iconName: 'Beef' },
  { name: 'Poissonnerie', iconName: 'Fish' },
  { name: 'Produits frais industriels', iconName: 'Package' },
  { name: 'Sport', iconName: 'Dumbbell' },
];

export const DEFAULT_STORE_NAMES = [
  'Leclerc', 'Carrefour', 'Auchan', 'Super U', 'Intermarché', 'Monoprix', 'Lidl', 'Aldi'
];

export const DEFAULT_UNITS = [
    'Aucune', 
    'boite(s)', 
    'bouteille(s)', 
    'cl', 
    'filet(s)', 
    'fiole(s)',
    'g', 
    'kg', 
    'L', 
    'paquet(s)', 
    'pièce(s)', 
    'pot(s)',
    'sachet(s)',
    'unité(s)'
];

export const ICONS_LIST = [
  'Apple', 'Banana', 'Beef', 'Beer', 'Book', 'Box', 'Briefcase', 'Brush', 'CakeSlice', 'Candy',
  'Carrot', 'ChefHat', 'Cheese', 'Chopsticks', 'Cigarette', 'CircleDollarSign', 'Coffee', 'Cookie',
  'Croissant', 'CupSoda', 'Cylinder', 'Dog', 'Droplet', 'Dumbbell', 'Fish', 'Flower', 'Gamepad2', 'Gift',
  'GlassWater', 'Globe', 'Hammer', 'HeartPulse', 'Home', 'IceCream', 'Key', 'Lamp', 'Laptop',
  'Leaf', 'Lightbulb', 'Milk', 'Package', 'Paintbrush', 'Pencil', 'Pepper', 'Pizza', 'Plug',
  'Ruler', 'Sandwich', 'Sausage', 'Scale', 'Scissors', 'Shirt', 'ShoppingBasket', 'ShoppingCart',
  'Smartphone', 'Snowflake', 'Sparkles', 'SprayCan', 'Store', 'Sun', 'Thermometer', 'Tv',
  'Umbrella', 'Utensils', 'Wheat', 'Wine', 'Wrench', 'Baby'
];

// Palettes definitions for Tailwind Variable Injection
export const THEME_PALETTES: Record<ThemeColor, Record<number | string, string>> = {
  blue: { // Indigo
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
    500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
  },
  bordeaux: { // Rose-ish / Red
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
    500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519'
  },
  yellow: { // Amber
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
    500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03'
  },
  orange: { // Orange
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
    500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12', 950: '#431407'
  },
  mauve: { // Violet/Fuchsia mix -> Violet
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
    500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
  },
  green: { // Emerald
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
    500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22'
  }
};

export const THEME_DISPLAY_DATA: Record<ThemeColor, { label: string, color: string }> = {
    blue: { label: 'Bleu', color: '#4f46e5' },
    bordeaux: { label: 'Bordeaux clair', color: '#e11d48' },
    yellow: { label: 'Jaune clair', color: '#d97706' },
    orange: { label: 'Orange clair', color: '#ea580c' },
    mauve: { label: 'Mauve clair', color: '#7c3aed' },
    green: { label: 'Vert clair', color: '#059669' },
};

export const FONT_SIZES: Record<AppFontSize, { label: string, value: string }> = {
  small: { label: 'Petite', value: '87.5%' },   // ~14px
  medium: { label: 'Moyenne', value: '100%' },  // 16px
  large: { label: 'Grande', value: '112.5%' },  // ~18px
  xl: { label: 'Très grande', value: '125%' }   // 20px
};
