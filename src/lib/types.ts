export type BusinessType =
  | "retail"
  | "food"
  | "services"
  | "agriculture"
  | "other";

export type Language = "english" | "pidgin";

export interface OnboardingData {
  name: string;
  businessType: BusinessType;
  language: Language;
  completedAt: string;
}

export interface Sale {
  id: string;
  description: string;
  amount: number;
  quantity?: number;
  item?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // current stock on hand
  lowStockThreshold: number; // low-stock alert when quantity <= this
  category?: string;
  unit?: string; // e.g. "bag", "bottle", "carton"
  costPrice?: number; // what you pay per unit (₦)
  sellingPrice?: number; // what you sell at (₦)
  createdAt: string;
  updatedAt?: string; // set on edits / stock changes
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LoanRecommendation {
  id: string;
  title: string;
  amount: number;
  interestRate: number;
  termWeeks: number;
  eligible: boolean;
  reason: string;
}

export interface LearnTip {
  id: string;
  title: string;
  content: string;
  topic: "savings" | "loans" | "budgeting" | "growth" | "safety";
}

export const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string }[] = [
  { value: "retail", label: "Retail Shop", emoji: "🏪" },
  { value: "food", label: "Food & Drinks", emoji: "🍲" },
  { value: "services", label: "Services", emoji: "✂️" },
 
];

export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "english", label: "English", native: "English" },
  { value: "pidgin", label: "Pidgin", native: "Pidgin English" },
 
];

export const LANGUAGE_GREETINGS: Record<Language, string> = {
  english: "Welcome back",
  pidgin: "Welcome back o!",
};

// Category suggestions shown in the inventory page, tailored to the business
// type chosen during onboarding.
export const INVENTORY_CATEGORY_PRESETS: Record<BusinessType, string[]> = {
  retail: ["Groceries", "Household", "Personal Care", "Drinks", "Other"],
  food: ["Ingredients", "Drinks", "Packaging", "Prepared Food", "Other"],
  services: ["Supplies", "Equipment", "Consumables", "Other"],
  agriculture: ["Seeds", "Fertilizer", "Tools", "Produce", "Other"],
  other: ["General", "Supplies", "Other"],
};

// Optional starter items offered in the empty state, tailored per business type.
export type InventoryStarter = Pick<InventoryItem, "name" | "category" | "unit"> & {
  quantity: number;
  lowStockThreshold: number;
  costPrice?: number;
  sellingPrice?: number;
};

export const INVENTORY_STARTER_ITEMS: Record<BusinessType, InventoryStarter[]> = {
  retail: [
    { name: "Rice", category: "Groceries", unit: "bag", quantity: 10, lowStockThreshold: 3, costPrice: 55000, sellingPrice: 62000 },
    { name: "Cooking Oil", category: "Groceries", unit: "bottle", quantity: 12, lowStockThreshold: 4, costPrice: 1500, sellingPrice: 2000 },
    { name: "Soap", category: "Personal Care", unit: "piece", quantity: 24, lowStockThreshold: 6, costPrice: 250, sellingPrice: 400 },
  ],
  food: [
    { name: "Tomatoes", category: "Ingredients", unit: "basket", quantity: 5, lowStockThreshold: 2, costPrice: 8000, sellingPrice: 10000 },
    { name: "Bottled Water", category: "Drinks", unit: "pack", quantity: 15, lowStockThreshold: 5, costPrice: 900, sellingPrice: 1500 },
    { name: "Takeaway Packs", category: "Packaging", unit: "pack", quantity: 8, lowStockThreshold: 3, costPrice: 1200, sellingPrice: 1200 },
  ],
  services: [
    { name: "Gloves", category: "Consumables", unit: "box", quantity: 6, lowStockThreshold: 2, costPrice: 2500, sellingPrice: 3500 },
    { name: "Towels", category: "Supplies", unit: "piece", quantity: 20, lowStockThreshold: 5, costPrice: 800, sellingPrice: 1200 },
    { name: "Clippers", category: "Equipment", unit: "piece", quantity: 3, lowStockThreshold: 1, costPrice: 15000, sellingPrice: 15000 },
  ],
  agriculture: [
    { name: "Maize Seeds", category: "Seeds", unit: "bag", quantity: 8, lowStockThreshold: 2, costPrice: 12000, sellingPrice: 15000 },
    { name: "Fertilizer", category: "Fertilizer", unit: "bag", quantity: 10, lowStockThreshold: 3, costPrice: 18000, sellingPrice: 22000 },
    { name: "Hoe", category: "Tools", unit: "piece", quantity: 5, lowStockThreshold: 2, costPrice: 3500, sellingPrice: 5000 },
  ],
  other: [
    { name: "Item A", category: "General", unit: "piece", quantity: 10, lowStockThreshold: 3 },
    { name: "Item B", category: "Supplies", unit: "piece", quantity: 6, lowStockThreshold: 2 },
  ],
};
