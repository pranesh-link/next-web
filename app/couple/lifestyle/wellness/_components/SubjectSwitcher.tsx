"use client";

import React from "react";
import styled from "styled-components";

/** Subject option shown in the {@link SubjectSwitcher} segmented control. */
export interface SubjectOption {
  /** Stable id of the subject (user id). */
  id: string;
  /** Display name; falls back to "You" when null and `isSelf` is true. */
  name: string | null;
  /** Avatar URL (currently unused, reserved for future). */
  image: string | null;
  /** Whether this subject is the signed-in user. */
  isSelf: boolean;
}

/** Props for {@link SubjectSwitcher}. */
export interface Props {
  /** All selectable subjects. Component renders `null` when length ≤ 1. */
  subjects: SubjectOption[];
  /** Currently selected subject id. */
  selectedId: string | null;
  /** Callback fired with the newly selected subject id. */
  onSelect: (id: string) => void;
}

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  min-width: 0;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const Tab = styled.button<{ $active: boolean }>`
  white-space: nowrap;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#ffffff" : "var(--text)")};
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${(p) => (p.$active ? "var(--accent)" : "var(--bg-elevated)")};
  }
`;

/**
 * Segmented control letting the user switch which couple member's
 * wellness data to view. Renders `null` when only one subject exists.
 *
 * @param props - See {@link Props}.
 * @returns A row of tab buttons or `null`.
 */
export default function SubjectSwitcher({ subjects, selectedId, onSelect }: Props) {
  if (subjects.length <= 1) return null;
  return (
    <Tabs role="tablist" aria-label="Select subject">
      {subjects.map((s) => {
        const active = s.id === selectedId;
        const label = s.name ?? "You";
        return (
          <Tab
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={() => onSelect(s.id)}
          >
            {label}
            {s.isSelf ? " (You)" : ""}
          </Tab>
        );
      })}
    </Tabs>
  );
}
