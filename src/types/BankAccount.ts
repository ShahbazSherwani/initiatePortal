export interface BankAccount {
  accountName: string;
  bankAccount: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  preferred?: boolean;
  [key: string]: string | boolean | undefined; // <-- Add this line
}