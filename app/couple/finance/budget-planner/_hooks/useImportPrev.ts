"use client";

import { useState } from "react";
import {
  classifyPrevItem,
  newLineItem,
  withIds,
  type LineItem,
  type PrevItemRow,
  type SavedPlan,
} from "../_utils";
import type { Notify } from "./useNotification";

type Mode = "monthly" | "yearly";

type Args = {
  mode: Mode;
  prevPlan: SavedPlan | null;
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  notify: Notify;
};

export function useImportPrev({
  mode,
  prevPlan,
  lineItems,
  setLineItems,
  notify,
}: Args) {
  const [showImportPrevModal, setShowImportPrevModal] = useState(false);
  const [importRows, setImportRows] = useState<PrevItemRow[]>([]);
  const [importSelection, setImportSelection] = useState<Set<number>>(new Set());

  function openImportPrevModal() {
    if (!prevPlan) return;
    const prevItems = withIds(
      prevPlan.lineItems as Array<Omit<LineItem, "id"> & { id?: string }>
    );
    if (!Array.isArray(prevItems) || prevItems.length === 0) {
      notify(
        `No items in previous ${mode === "monthly" ? "month" : "year"} to import`,
        "error"
      );
      return;
    }
    const rows: PrevItemRow[] = prevItems.map((item, idx) => ({
      ...item,
      _idx: idx,
      _class: classifyPrevItem(item, lineItems),
    }));
    setImportRows(rows);
    setImportSelection(new Set());
    setShowImportPrevModal(true);
  }

  function toggleImportRow(idx: number) {
    const row = importRows.find((r) => r._idx === idx);
    if (!row || row._class.kind === "duplicate") return;
    setImportSelection((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function selectAllImportRows() {
    const next = new Set<number>();
    for (const row of importRows) {
      if (row._class.kind !== "duplicate") next.add(row._idx);
    }
    setImportSelection(next);
  }

  function selectNoneImportRows() {
    setImportSelection(new Set());
  }

  function confirmImportPrev() {
    const picked = importRows
      .filter((r) => importSelection.has(r._idx) && r._class.kind !== "duplicate")
      .map((r) =>
        newLineItem({
          category: r.category,
          amount: r.amount,
          paid: false,
          ...(r.note ? { note: r.note } : {}),
        })
      );

    if (picked.length === 0) {
      setShowImportPrevModal(false);
      return;
    }

    setLineItems((prev) => {
      const cleaned = prev.filter((i) => i.category !== "" || i.amount > 0);
      return cleaned.length > 0 ? [...cleaned, ...picked] : picked;
    });
    setShowImportPrevModal(false);
    notify(
      `Imported ${picked.length} expense${picked.length === 1 ? "" : "s"} from last ${mode === "monthly" ? "month" : "year"}`,
      "success"
    );
  }

  return {
    showImportPrevModal,
    importRows,
    importSelection,
    setShowImportPrevModal,
    openImportPrevModal,
    toggleImportRow,
    selectAllImportRows,
    selectNoneImportRows,
    confirmImportPrev,
  };
}
