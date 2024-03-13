"use client";

import { CORS_MODE } from "@/_constants/profile";

export const setLocalStorage = (key: string, value: any) =>
  localStorage.setItem(key, JSON.stringify({ value }));

export const getLocalStorage = (key: string) => {
  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  return item.value;
};

export const clearLocalStorage = (key?: string) => {
  key ? localStorage.removeItem(key) : localStorage.clear();
};
