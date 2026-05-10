"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Card, SectionTitle, Subtle, GhostButton } from "@/couple/lifestyle/wellness/_styled";
import Modal from "@/couple/_components/shared/Modal";
import { SUGGESTION_COLORS } from "@/couple/_constants/suggestion-colors";
import type { WellnessSuggestion } from "@/_services/lifestyle/insights";

/** Props for {@link SuggestionsPanel}. */
export interface Props {
  /** Suggestions to display. The top 3 are shown inline. */
  suggestions: WellnessSuggestion[];
}

const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SuggestionRow = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--surface);
  border-radius: 10px;
  border-left: 3px solid ${(p) => p.$color};
`;

const Icon = styled.span`
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
`;

const Text = styled.span`
  font-size: 13px;
  color: var(--text);
  min-width: 0;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

function renderRow(s: WellnessSuggestion, index: number) {
  const color = SUGGESTION_COLORS[s.type] ?? SUGGESTION_COLORS.info;
  return (
    <SuggestionRow key={`${index}-${s.text}`} $color={color}>
      <Icon aria-hidden="true">{s.icon}</Icon>
      <Text>{s.text}</Text>
    </SuggestionRow>
  );
}

/**
 * Card showing the top 3 wellness suggestions inline, with a
 * "View all" modal when more are available.
 *
 * @param props - See {@link Props}.
 * @returns A card containing the suggestion list.
 */
export default function SuggestionsPanel({ suggestions }: Props) {
  const [open, setOpen] = useState(false);

  if (suggestions.length === 0) {
    return (
      <Card>
        <SectionTitle>Smart suggestions</SectionTitle>
        <Subtle>No suggestions right now.</Subtle>
      </Card>
    );
  }

  const top = suggestions.slice(0, 3);
  const hasMore = suggestions.length > 3;

  return (
    <Card>
      <SectionTitle>Smart suggestions</SectionTitle>
      <SuggestionList>{top.map(renderRow)}</SuggestionList>
      {hasMore ? (
        <Footer>
          <GhostButton type="button" onClick={() => setOpen(true)}>
            View all ({suggestions.length})
          </GhostButton>
        </Footer>
      ) : null}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="All suggestions"
        size="md"
      >
        <SuggestionList>{suggestions.map(renderRow)}</SuggestionList>
      </Modal>
    </Card>
  );
}
