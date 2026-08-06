"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AccessibilityFontSize =
  | "small"
  | "medium"
  | "large";

export type AccessibilityTheme =
  | "normal"
  | "contrast"
  | "grayscale";

interface AccessibilitySettings {
  fontSize: AccessibilityFontSize;
  theme: AccessibilityTheme;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setFontSize: (
    fontSize: AccessibilityFontSize,
  ) => void;
  setTheme: (
    theme: AccessibilityTheme,
  ) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: "medium",
  theme: "normal",
};

const STORAGE_KEY =
  "temiryolchi_accessibility_settings";

const AccessibilityContext =
  createContext<AccessibilityContextValue | null>(
    null,
  );

function isSettings(
  value: unknown,
): value is AccessibilitySettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<
    AccessibilitySettings
  >;

  return (
    ["small", "medium", "large"].includes(
      candidate.fontSize ?? "",
    ) &&
    [
      "normal",
      "contrast",
      "grayscale",
    ].includes(candidate.theme ?? "")
  );
}

export function AccessibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] =
    useState<AccessibilitySettings>(() => {
      if (typeof window === "undefined") {
        return DEFAULT_SETTINGS;
      }

      try {
        const savedValue =
          window.localStorage.getItem(
            STORAGE_KEY,
          );

        if (savedValue) {
          const parsedValue: unknown =
            JSON.parse(savedValue);

          if (isSettings(parsedValue)) {
            return parsedValue;
          }
        }
      } catch {
        // Invalid or unavailable localStorage is ignored.
      }

      return DEFAULT_SETTINGS;
    });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove(
      "theme-contrast",
      "theme-grayscale",
      "font-size-small",
      "font-size-medium",
      "font-size-large",
    );

    if (settings.theme !== "normal") {
      root.classList.add(
        `theme-${settings.theme}`,
      );
    }

    root.classList.add(
      `font-size-${settings.fontSize}`,
    );

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings),
      );
    } catch {
      // Unavailable localStorage is ignored.
    }
  }, [settings]);

  const value = useMemo<
    AccessibilityContextValue
  >(
    () => ({
      settings,
      setFontSize: (fontSize) => {
        setSettings((current) => ({
          ...current,
          fontSize,
        }));
      },
      setTheme: (theme) => {
        setSettings((current) => ({
          ...current,
          theme,
        }));
      },
      increaseFontSize: () => {
        setSettings((current) => ({
          ...current,
          fontSize:
            current.fontSize === "small"
              ? "medium"
              : "large",
        }));
      },
      decreaseFontSize: () => {
        setSettings((current) => ({
          ...current,
          fontSize:
            current.fontSize === "large"
              ? "medium"
              : "small",
        }));
      },
      resetSettings: () => {
        setSettings(DEFAULT_SETTINGS);
      },
    }),
    [settings],
  );

  return (
    <AccessibilityContext.Provider
      value={value}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(
    AccessibilityContext,
  );

  if (!context) {
    throw new Error(
      "useAccessibility must be used inside AccessibilityProvider.",
    );
  }

  return context;
}
