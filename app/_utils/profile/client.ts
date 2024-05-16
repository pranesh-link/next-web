"use client";

export const setLocalStorage = (key: string, value: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify({ value }));
  }
};

export const getLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    const itemStr = localStorage.getItem(key);

    if (!itemStr) {
      return null;
    }
    const item = JSON.parse(itemStr);
    return item.value;
  } else {
    return null;
  }
};

export const clearLocalStorage = (key?: string) => {
  if (typeof window !== "undefined") {
    key ? localStorage.removeItem(key) : localStorage.clear();
  }
};
