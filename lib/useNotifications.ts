"use client";

import { useState, useCallback, useEffect } from "react";
import type { Notification, AlertRule, AlertCondition } from "@/lib/types";
import { storeGet, storeSet } from "@/lib/store";

const NOTIF_KEY = "notifications";
const RULES_KEY = "alert-rules";
const MAX_NOTIFICATIONS = 100;

function generateId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);

  useEffect(() => {
    setNotifications(storeGet<Notification[]>(NOTIF_KEY, []));
    setRules(storeGet<AlertRule[]>(RULES_KEY, []));
  }, []);

  // ─── Notifications ───────────────────────────────────────

  const persistNotifications = useCallback((updated: Notification[]) => {
    const capped = updated.slice(0, MAX_NOTIFICATIONS);
    setNotifications(capped);
    storeSet(NOTIF_KEY, capped);
  }, []);

  const addNotification = useCallback(
    (
      type: Notification["type"],
      title: string,
      message: string,
      data?: Record<string, unknown>
    ) => {
      const notif: Notification = {
        id: generateId(),
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        data,
      };
      persistNotifications([notif, ...notifications]);
      return notif;
    },
    [notifications, persistNotifications]
  );

  const markRead = useCallback(
    (id: string) => {
      persistNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [notifications, persistNotifications]
  );

  const markAllRead = useCallback(() => {
    persistNotifications(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications, persistNotifications]);

  const clearNotifications = useCallback(() => {
    persistNotifications([]);
  }, [persistNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ─── Alert Rules ─────────────────────────────────────────

  const persistRules = useCallback((updated: AlertRule[]) => {
    setRules(updated);
    storeSet(RULES_KEY, updated);
  }, []);

  const addRule = useCallback(
    (name: string, conditions: AlertCondition[]) => {
      const rule: AlertRule = {
        id: `rule-${Date.now()}`,
        name,
        enabled: true,
        conditions,
        action: "notify",
        createdAt: new Date().toISOString(),
      };
      persistRules([...rules, rule]);
      return rule;
    },
    [rules, persistRules]
  );

  const removeRule = useCallback(
    (id: string) => {
      persistRules(rules.filter((r) => r.id !== id));
    },
    [rules, persistRules]
  );

  const toggleRule = useCallback(
    (id: string) => {
      persistRules(
        rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
      );
    },
    [rules, persistRules]
  );

  // Evaluate a signal against all active rules
  const evaluateSignal = useCallback(
    (signal: {
      ticker: string;
      direction: string;
      confidence: number;
      urgency: string;
      sentiment: number;
      sources: string[];
    }) => {
      const activeRules = rules.filter((r) => r.enabled);
      const triggered: AlertRule[] = [];

      for (const rule of activeRules) {
        const allMatch = rule.conditions.every((cond) => {
          const fieldValue = getFieldValue(signal, cond.field);
          return evaluateCondition(fieldValue, cond.operator, cond.value);
        });
        if (allMatch) triggered.push(rule);
      }

      // Create notifications for triggered rules
      for (const rule of triggered) {
        addNotification(
          "alert",
          `Alert: ${rule.name}`,
          `${signal.ticker} ${signal.direction} signal (${signal.confidence}% confidence) triggered rule "${rule.name}"`,
          { signalTicker: signal.ticker, ruleId: rule.id }
        );
      }

      return triggered;
    },
    [rules, addNotification]
  );

  return {
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
    clearNotifications,
    rules,
    addRule,
    removeRule,
    toggleRule,
    evaluateSignal,
  };
}

// ─── Helpers ───────────────────────────────────────────────

function getFieldValue(
  signal: Record<string, unknown>,
  field: AlertCondition["field"]
): unknown {
  switch (field) {
    case "confidence":
      return signal.confidence;
    case "urgency":
      return signal.urgency;
    case "direction":
      return signal.direction;
    case "ticker":
      return signal.ticker;
    case "sentiment":
      return signal.sentiment;
    case "source":
      return (signal.sources as string[])?.join(",") || "";
    default:
      return null;
  }
}

function evaluateCondition(
  fieldValue: unknown,
  operator: AlertCondition["operator"],
  target: string | number
): boolean {
  switch (operator) {
    case "gt":
      return Number(fieldValue) > Number(target);
    case "lt":
      return Number(fieldValue) < Number(target);
    case "eq":
      return String(fieldValue).toLowerCase() === String(target).toLowerCase();
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(target).toLowerCase());
    default:
      return false;
  }
}
