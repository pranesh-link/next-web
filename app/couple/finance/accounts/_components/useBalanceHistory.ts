"use client";

import { useCallback, useState } from "react";
import { getOverallBalanceHistory } from "@/couple/finance/_actions/accounts";
import { BalanceLogItem } from "../_utils";

export function useBalanceHistory() {
  const [items, setItems] = useState<BalanceLogItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (c?: string) => {
    setLoading(true);
    const res = await getOverallBalanceHistory(c);
    if (res.success) {
      if (c) {
        setItems((prev) => [...prev, ...res.data.items as BalanceLogItem[]]);
      } else {
        setItems(res.data.items as BalanceLogItem[]);
      }
      setCursor(res.data.nextCursor);
    }
    setLoading(false);
  }, []);

  return { items, setItems, cursor, loading, fetchHistory };
}
