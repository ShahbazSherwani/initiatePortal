export interface Milestone {
  id?: string;
  name?: string;
  amount: string;
  percentage: string;
  date: Date | null;
  file: File | null;
  image?: string | null; // For storing the image data URL
}