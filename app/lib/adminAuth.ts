"use client";

import { useSyncExternalStore } from "react";

const TOKEN_KEY = "miniroyal_admin_token";
const TOKEN_VALUE = "authenticated_admin";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  return localStorage.getItem(TOKEN_KEY) === TOKEN_VALUE;
}

function getServerSnapshot() {
  return false;
}

export function loginAdmin() {
  localStorage.setItem(TOKEN_KEY, TOKEN_VALUE);
  emit();
}

export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY);
  emit();
}

export function useIsAdminAuthenticated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
