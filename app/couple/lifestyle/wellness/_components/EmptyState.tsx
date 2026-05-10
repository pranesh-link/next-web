"use client";

import React from "react";
import styled from "styled-components";
import { Card, SectionTitle, Subtle, Button } from "@/couple/lifestyle/wellness/_styled";

/** Props for {@link EmptyState}. */
export interface Props {
  /** Called when the user clicks the primary CTA. */
  onLog: () => void;
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 16px 8px;
`;

const Icon = styled.svg`
  color: var(--accent);
  width: 48px;
  height: 48px;
`;

const ButtonRow = styled.div`
  margin-top: 4px;
`;

/**
 * Wellness empty state — shown when no body-metric entries exist.
 *
 * @param props - See {@link Props}.
 * @returns A centered card prompting the user to log their first entry.
 */
export default function EmptyState({ onLog }: Props) {
  return (
    <Card>
      <Wrap>
        <Icon
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Icon>
        <SectionTitle>Start tracking your wellness</SectionTitle>
        <Subtle>
          Log your first entry to see BMI, trends, and personalised suggestions.
        </Subtle>
        <ButtonRow>
          <Button type="button" onClick={onLog}>
            Log first entry
          </Button>
        </ButtonRow>
      </Wrap>
    </Card>
  );
}
