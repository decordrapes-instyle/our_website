import React, { createContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: Theme;
  resolvedTheme: "light" | "dark" | "system";
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) return saved;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemDark ? "dark" : "light";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  useEffect(() => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

    setResolvedTheme(activeTheme);

    const themeColorMeta = document.querySelector("meta[name='theme-color']");

    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#0a0a0a");
      }
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", "#ffffff");
      }
    }

    // Listen to system changes if using system theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const newSystemTheme = e.matches ? "dark" : "light";
        setResolvedTheme(newSystemTheme);
        document.documentElement.classList.toggle("dark", e.matches);
        document.documentElement.style.colorScheme = e.matches ? "dark" : "light";
        if (themeColorMeta) {
          themeColorMeta.setAttribute("content", e.matches ? "#171717" : "#ffffff");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
