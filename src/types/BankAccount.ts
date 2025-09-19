export interface BankAccount {
  accountName: string;
  bankAccount: string; // This represents bank name
  accountType?: string; // New field for account type (Savings, Current, etc.)
  accountNumber: string;
  iban: string;
  swiftCode: string;
  preferred?: boolean;
  [key: string]: string | boolean | undefined; // <-- Add this line
}