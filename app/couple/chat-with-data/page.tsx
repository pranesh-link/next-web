import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import CoupleDataChat from "@/couple/_components/chat/CoupleDataChat";

export const metadata = { title: "Chat with Couple data | LuvVerse" };

/** `/couple/chat-with-data` — AI assistant for querying couple finance & lifestyle data. */
export default function ChatWithDataPage() {
  return (
    <>
      <FinanceHeader title="Chat with Couple data" />
      <CoupleDataChat
        endpoint="/api/couple/data-chat"
        configEndpoint="/api/couple/data-chat/config"
        pageMode
      />
    </>
  );
}
