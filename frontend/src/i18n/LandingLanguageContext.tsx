import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LandingLanguage = "en" | "sw";

type LandingLanguageContextValue = {
  language: LandingLanguage;
  isSwahili: boolean;
  setLanguage: (language: LandingLanguage) => void;
};

const LandingLanguageContext = createContext<LandingLanguageContextValue | null>(null);
const STORAGE_KEY = "biztrack_public_language";

function initialLanguage(): LandingLanguage {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "sw") return stored;
  return navigator.language.toLowerCase().startsWith("sw") ? "sw" : "en";
}

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LandingLanguage>(initialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ language, isSwahili: language === "sw", setLanguage }),
    [language],
  );

  return <LandingLanguageContext.Provider value={value}>{children}</LandingLanguageContext.Provider>;
}

export function useLandingLanguage() {
  const context = useContext(LandingLanguageContext);
  if (!context) throw new Error("useLandingLanguage must be used within LandingLanguageProvider");
  return context;
}
