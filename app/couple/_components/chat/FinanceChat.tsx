"use client";

import CoupleDataChat from "./CoupleDataChat";

interface FinanceChatProps {
  pageMode?: boolean;
}

export default function FinanceChat({ pageMode = false }: FinanceChatProps) {
  return (
    <CoupleDataChat
      endpoint="/api/couple/data-chat"
      configEndpoint="/api/couple/data-chat/config"
      pageMode={pageMode}
    />
  );
}
