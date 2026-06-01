export type BusinessType =
  | "retail"
  | "food"
  | "services"
  | "agriculture"
  | "other";

export type Language = "english" | "pidgin" | "swahili" | "hindi";

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
  { value: "agriculture", label: "Agriculture", emoji: "🌾" },
  { value: "other", label: "Other", emoji: "💼" },
];

export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "english", label: "English", native: "English" },
  { value: "pidgin", label: "Pidgin", native: "Pidgin English" },
  { value: "swahili", label: "Swahili", native: "Kiswahili" },
  { value: "hindi", label: "Hindi", native: "हिन्दी" },
];

export const LANGUAGE_GREETINGS: Record<Language, string> = {
  english: "Welcome back",
  pidgin: "Welcome back o!",
  swahili: "Karibu tena",
  hindi: "वापस स्वागत है",
};
