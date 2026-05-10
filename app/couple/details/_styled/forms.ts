"use client";

import styled from "styled-components";

export const SoloCard = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 32px 16px;
  }
`;

export const CardIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const EditButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s ease;

  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.08);
  }
`;

export const RenameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export const RenameInput = styled.input`
  background: #ffffff;
  border: 1px solid #3b82f6;
  color: #1e293b;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  width: 200px;
  transition: box-shadow 0.2s ease;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
`;

export const CardDescription = styled.p`
  font-size: 14px;
  color: #52525b;
  margin: 0 0 28px 0;
  line-height: 1.6;
`;

export const FieldGroup = styled.div`
  max-width: 320px;
  margin: 0 auto 20px;
  text-align: left;
`;

export const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
`;

export const Input = styled.input`
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const ErrorText = styled.span`
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
`;
