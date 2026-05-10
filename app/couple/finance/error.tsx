"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
  color: var(--text);

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    padding: 24px;
  }

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 10px;
    gap: 12px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const Message = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-muted);

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const Digest = styled.code`
  display: inline-block;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 4px 8px;
  border-radius: 6px;
  word-break: break-all;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "primary" ? "var(--accent)" : "var(--border)"};
  background: ${({ $variant }) =>
    $variant === "primary" ? "var(--accent)" : "var(--surface)"};
  color: ${({ $variant }) => ($variant === "primary" ? "#fff" : "var(--text)")};

  &:hover {
    opacity: 0.9;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Wrapper>
      <Card role="alert">
        <Title>Something went wrong</Title>
        <Message>Something went wrong loading your finance data.</Message>
        {error.digest && (
          <Digest aria-label="Error reference">ref: {error.digest}</Digest>
        )}
        <Actions>
          <Button $variant="primary" type="button" onClick={() => reset()}>
            Try Again
          </Button>
          <Button
            $variant="secondary"
            type="button"
            onClick={() => router.push("/couple/finance")}
          >
            Back to Dashboard
          </Button>
        </Actions>
      </Card>
    </Wrapper>
  );
}
