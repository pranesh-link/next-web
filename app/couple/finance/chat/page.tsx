import { redirect } from "next/navigation";

/** Permanent redirect — page moved to `/couple/chat-with-data`. */
export default function OldChatPage() {
  redirect("/couple/chat-with-data");
}
