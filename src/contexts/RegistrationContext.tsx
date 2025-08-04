import React, { createContext, useState, useContext } from "react";
import type { BankAccount } from "../types/BankAccount";

export interface RegistrationData {
  accountType: string;
  details: Record<string, any>;
  bankAccounts?: BankAccount[];
}

interface RegistrationContextType {
  registration: RegistrationData;
  setRegistration: React.Dispatch<React.SetStateAction<RegistrationData>>;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [registration, setRegistration] = useState<RegistrationData>({
    accountType: "",
    details: {},
  });

  return (
    <RegistrationContext.Provider value={{ registration, setRegistration }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be used within RegistrationProvider");
  return ctx;
};