import styled from "styled-components";

export const Card = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  min-width: 0;
`;

export const CardTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 20px 0;
`;

export const RowList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const Row = styled.li`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const RowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
`;

export const CategoryLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

export const AmountLabel = styled.span`
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const TrackOuter = styled.div`
  height: 8px;
  background: var(--surface);
  border-radius: 4px;
  overflow: hidden;
`;

export const TrackFill = styled.div<{ $pct: number; $color: string; $dashed: boolean }>`
  height: 100%;
  width: ${(p) => Math.min(p.$pct, 100)}%;
  background: ${(p) => p.$color};
  border-radius: 4px;
  transition: width 0.4s ease;
  ${(p) =>
    p.$dashed
      ? `background: repeating-linear-gradient(
          90deg,
          var(--text-muted) 0,
          var(--text-muted) 6px,
          transparent 6px,
          transparent 12px
        );
        opacity: 0.5;`
      : ""}
`;

export const EmptyState = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  padding: 16px 0;
`;
