import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;

  // Если не сохранено — берём системную
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
}