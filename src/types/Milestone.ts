export interface Milestone {
  amount: string;
  percent: string;
  date: Date | null;  // <-- Change to match ProjectFormContext
  percentage: string;
  file: File | null;
  image: string | null;  // <-- Remove optional marker
}