"use client";

import styled from "styled-components";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";

const DEEP_LINK = "luvverse://chat";
const STORE_LINK = process.env.NEXT_PUBLIC_APP_STORE_LINK || "https://play.google.com/store/apps/details?id=com.luvverse.app";

/**
 * Chat is mobile-only. This page displays a gate screen directing users
 * to the LuvVerse mobile app for secure, end-to-end encrypted messaging.
 */
export default function ChatPage() {
  const handleOpenApp = () => {
    // Try deep link first, fall back to store after timeout
    window.location.href = DEEP_LINK;
    setTimeout(() => {
      window.location.href = STORE_LINK;
    }, 1500);
  };

  return (
    <Wrapper>
      <FinanceHeader title="Chat" />
      <Content>
        <IconCircle>💬</IconCircle>
        <Title>Chat is available on mobile</Title>
        <Description>
          For end-to-end encrypted messaging, use the LuvVerse mobile app.
          Your messages are stored securely on your device.
        </Description>
        <OpenButton onClick={handleOpenApp}>Open in App</OpenButton>
        <StoreLink href={STORE_LINK} target="_blank" rel="noopener noreferrer">
          Don&apos;t have the app? Get it here →
        </StoreLink>
      </Content>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  gap: 1rem;
`;

const IconCircle = styled.div`
  font-size: 4rem;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors?.surfaceElevated || "#f0f0f0"};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors?.textSecondary || "#666"};
  max-width: 320px;
  line-height: 1.5;
  margin: 0;
`;

const OpenButton = styled.button`
  background: ${({ theme }) => theme.colors?.primary || "#6366f1"};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

const StoreLink = styled.a`
  color: ${({ theme }) => theme.colors?.primary || "#6366f1"};
  font-size: 0.875rem;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;



