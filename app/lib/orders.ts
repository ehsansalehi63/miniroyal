"use client";

import { useSyncExternalStore } from "react";

export const ORDERS_STORAGE_KEY = "miniroyal_orders";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function getSnapshot() {
  return localStorage.getItem(ORDERS_STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Raw JSON of the stored orders, or `null` while rendering on the server and
 * during the first hydration pass (keeps server and client markup identical).
 */
export function useStoredOrdersJson() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
