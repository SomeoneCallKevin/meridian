"use client";

import { useState, useCallback, useEffect } from "react";
import type { UserSettings, ViewMode } from "@/lib/types";
import { storeGet, storeSet } from "@/lib/store";

const STORE_KEY = "settings";

const DEFAULT_SETTINGS: UserSettings = {
  viewMode: "advanced",
  riskPerTrade: 2,
  maxSectorExposure: 35,
  defaultStopLoss: 5,
  minConfidenceThreshold: 46,
  requiredSignalSources: 2,
  enableAlerts: true,
  highUrgencyOnly: false,
  paperTradingMode: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = storeGet<Partial<UserSettings>>(STORE_KEY, {});
    setSettings({ ...DEFAULT_SETTINGS, ...saved });
  }, []);

  const persist = useCallback((updated: UserSettings) => {
    setSettings(updated);
    storeSet(STORE_KEY, updated);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      persist({ ...settings, [key]: value });
    },
    [settings, persist]
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => updateSetting("viewMode", mode),
    [updateSetting]
  );

  const resetSettings = useCallback(() => {
    persist(DEFAULT_SETTINGS);
  }, [persist]);

  // Helpers for view mode filtering
  const isBeginnerMode = settings.viewMode === "beginner";
  const isAdvancedMode = settings.viewMode === "advanced" || settings.viewMode === "full";
  const isFullMode = settings.viewMode === "full";

  // Whether to show a feature based on its complexity level
  const shouldShow = useCallback(
    (level: "beginner" | "advanced" | "full") => {
      if (level === "beginner") return true;
      if (level === "advanced") return isAdvancedMode || isFullMode;
      return isFullMode;
    },
    [isAdvancedMode, isFullMode]
  );

  return {
    settings,
    updateSetting,
    setViewMode,
    resetSettings,
    isBeginnerMode,
    isAdvancedMode,
    isFullMode,
    shouldShow,
  };
}
