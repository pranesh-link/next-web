"use client";

import React from "react";
import { signIn } from "next-auth/react";
import styled, { keyframes } from "styled-components";

interface LoginCardProps {
  callbackUrl?: string;
}

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  position: relative;
  overflow: hidden;
  font-family: "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    var(--border) 1px,
    transparent 1px
  );
  background-size: 32px 32px;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 60% 50% at 50% 50%,
      rgba(59, 130, 246, 0.08) 0%,
      transparent 70%
    );
  }
`;

const Card = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  margin: 0 24px;
  padding: 48px 40px;
  border-radius: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 480px) {
    padding: 36px 24px;
    margin: 0 16px;
  }
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 12px;
`;

const LogoCircle = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ffffff;
  font-weight: 700;
`;

const AppName = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
  margin: 0;
`;

const Tagline = styled.p`
  text-align: center;
  color: var(--text-muted);
  font-size: 15px;
  margin: 0 0 40px;
  font-weight: 400;
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: #ffffff;
  color: #1f1f1f;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: #f3f4f6;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const FooterText = styled.p`
  text-align: center;
  color: var(--text-dim);
  font-size: 12px;
  margin: 20px 0 0;
`;

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginCard({ callbackUrl = "/finance" }: LoginCardProps) {
  return (
    <PageWrapper>
      <BackgroundPattern />
      <Card>
        <LogoRow>
          <LogoCircle>💑</LogoCircle>
          <AppName>Coupletastic</AppName>
        </LogoRow>
        <Tagline>Sign in to manage your finances together</Tagline>
        <GoogleButton
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <GoogleLogo />
          Continue with Google
        </GoogleButton>
        <FooterText>Secure login with your Google account</FooterText>
      </Card>
    </PageWrapper>
  );
}
