// src/contexts/AccountContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";

// Define the account types available in the application
type AccountType = "invest" | "issue" | null; // Hidden "guarantee" option

interface AccountContextValue {
  accountType: AccountType;
  setAccountType: (t: AccountType) => void;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accountType, setAccountType] = useState<AccountType>(null);
  return (
    <AccountContext.Provider value={{ accountType, setAccountType }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextValue => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
};
