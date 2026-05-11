"use client";

import styled from "styled-components";
import Modal from "@/couple/_components/shared/Modal";
import { fadeIn } from "../_styled";
import { SUGGESTIONS_MODAL_TITLE } from "../_labels";
import { EASING, SUGGESTION_COLORS, type Suggestion } from "../_utils";

const SuggestionCard = styled.div<{ $accentColor: string }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-left: 4px solid ${(p) => p.$accentColor};
  border-radius: 10px;
  margin-bottom: 10px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const SuggestionIcon = styled.span`
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1.4;
`;

const SuggestionText = styled.p`
  font-size: 14px;
  color: var(--text);
  margin: 0;
  line-height: 1.5;
`;

type Props = {
  isOpen: boolean;
  suggestions: Suggestion[];
  onClose: () => void;
};

export default function SuggestionsModal({ isOpen, suggestions, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={SUGGESTIONS_MODAL_TITLE} size="md">
      {suggestions.map((s, i) => (
        <SuggestionCard key={i} $accentColor={SUGGESTION_COLORS[s.type] || "#3b82f6"}>
          <SuggestionIcon>{s.icon}</SuggestionIcon>
          <SuggestionText>{s.text}</SuggestionText>
        </SuggestionCard>
      ))}
    </Modal>
  );
}
