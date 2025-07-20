export interface Ingredient {
  name: string;
  weight: number;
  proteinPercentage: number;
  calories?: number;
  aminoAcidMissing?: string[];
}

export interface ProteinEntry {
  name: string;
  ingredients: Ingredient[];
  totalProteinEstimate: number;
  totalCalories?: number;
  aminoRecommendation?: string;
} 