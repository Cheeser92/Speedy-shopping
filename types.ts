
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
  productId: string;
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

export type ThemeColor = 'blue' | 'bordeaux' | 'yellow' | 'orange' | 'mauve' | 'green';
export type AppFontSize = 'small' | 'medium' | 'large' | 'xl';
