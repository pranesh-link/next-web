import cron from "node-cron";
import { purgeExpiredMessages, cleanupDeliveredMessages } from "../../shared/message-purge.js";

export function startCrons() {
  // Chat purge every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    try {
      const [expired, delivered] = await Promise.all([purgeExpiredMessages(), cleanupDeliveredMessages()]);
      console.log(`[cron:chat-purge] expired=${expired} delivered=${delivered}`);
    } catch (e) {
      console.error("[cron:chat-purge] error:", e);
    }
  });

  // Investment price sync weekdays at 9am UTC
  cron.schedule("0 9 * * 1-5", async () => {
    try {
      console.log("[cron:investment-sync] running");
      // TODO: port investment sync logic
    } catch (e) {
      console.error("[cron:investment-sync] error:", e);
    }
  });

  // Finance notifications daily at 8am UTC
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("[cron:notifications] running");
      // TODO: port notification generation logic
    } catch (e) {
      console.error("[cron:notifications] error:", e);
    }
  });

  console.log("[crons] scheduled: chat-purge, investment-sync, notifications");
}
