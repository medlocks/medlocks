export interface HairProfile {
  uid?: string;

  dateOfBirth: string; 

  hairType: string;
  hairGoals: string[];

  currentRoutine: {
    washFrequency: string;
    products: string[];
  };

  products: string[];

  previousPlan?: any;
  weeklyFeedback?: any;
}
