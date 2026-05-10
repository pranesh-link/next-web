import styled from "styled-components";

export const PageWrapper = styled.div<{ $pending?: boolean }>`
  padding: 32px;
  opacity: ${(p) => (p.$pending ? 0.6 : 1)};
  transition: opacity 0.2s;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Section = styled.section`
  margin-top: 32px;
`;

export const SectionHeader = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin: 0 0 16px 0;
`;

export const HealthScoreWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`;

export const ScoreCircleContainer = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
`;

export const ScoreLabel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const ScoreValue = styled.span<{ $color: string }>`
  font-size: 48px;
  font-weight: 800;
  color: ${(p) => p.$color};
  letter-spacing: -2px;
  line-height: 1;
`;

export const ScoreCaption = styled.span`
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
`;

export const FactorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const FactorCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
`;

export const FactorName = styled.p`
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

export const FactorScoreRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export const FactorScore = styled.span<{ $color: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${(p) => p.$color};
`;

export const FactorWeight = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

export const FactorDetail = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  margin: 0;
  line-height: 1.4;
`;

export const BudgetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

export const GoalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

export const LoanCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 480px) {
    padding: 20px;
    gap: 16px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const LoanIconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--danger);
  flex-shrink: 0;
`;

export const LoanStat = styled.div`
  flex: 1;
`;

export const LoanStatLabel = styled.p`
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 4px 0;
`;

export const LoanStatValue = styled.p`
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  letter-spacing: -1px;
`;

export const LoanStatSub = styled.p`
  font-size: 13px;
  color: var(--text-dim);
  margin: 4px 0 0 0;
`;

export const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
`;
