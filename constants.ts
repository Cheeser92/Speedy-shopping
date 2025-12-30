import { Category, Store } from './types';

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
  { name: 'Vaisselle', iconName: 'CupSoda' },
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
];

export const DEFAULT_STORE_NAMES = [
  'Leclerc', 'Carrefour', 'Auchan', 'Super U', 'Intermarché', 'Monoprix', 'Lidl', 'Aldi'
];

export const ICONS_LIST = [
  'Apple', 'Banana', 'Beef', 'Beer', 'Book', 'Box', 'Briefcase', 'Brush', 'CakeSlice', 'Candy',
  'Carrot', 'ChefHat', 'Cheese', 'Chopsticks', 'Cigarette', 'CircleDollarSign', 'Coffee', 'Cookie',
  'Croissant', 'CupSoda', 'Cylinder', 'Dog', 'Droplet', 'Fish', 'Flower', 'Gamepad2', 'Gift',
  'GlassWater', 'Globe', 'Hammer', 'HeartPulse', 'Home', 'IceCream', 'Key', 'Lamp', 'Laptop',
  'Leaf', 'Lightbulb', 'Milk', 'Package', 'Paintbrush', 'Pencil', 'Pepper', 'Pizza', 'Plug',
  'Ruler', 'Sandwich', 'Sausage', 'Scale', 'Scissors', 'Shirt', 'ShoppingBasket', 'ShoppingCart',
  'Smartphone', 'Snowflake', 'Sparkles', 'SprayCan', 'Store', 'Sun', 'Thermometer', 'Tv',
  'Umbrella', 'Utensils', 'Wheat', 'Wine', 'Wrench', 'Baby'
];
