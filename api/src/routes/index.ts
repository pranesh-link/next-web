import { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "./v1/auth/index.js";
import { registerDevicesRoute } from "./v1/devices.js";
import { registerFilesRoute } from "./v1/files.js";
import { registerConfigRoute } from "./v1/config.js";
import { registerCoupleRoutes } from "./v1/couple/index.js";
import { registerFinanceRoutes } from "./v1/finance/index.js";
import { registerFinanceScanRoutes } from "./v1/finance/scan.js";
import { registerHealthRoutes } from "./v1/health/index.js";
import { registerAdminRoutes } from "./v1/admin/index.js";
import { registerUserRoutes } from "./v1/user/index.js";
import { registerNotificationsTestRoute } from "./v1/notifications-test.js";
import { registerChatLegacyRoutes } from "./legacy/chat.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(registerAuthRoutes, { prefix: "/api/v1/auth" });
  await app.register(registerDevicesRoute, { prefix: "/api/v1/devices" });
  await app.register(registerFilesRoute, { prefix: "/api/v1/files" });
  await app.register(registerConfigRoute, { prefix: "/api/v1/config" });
  await app.register(registerCoupleRoutes, { prefix: "/api/v1/couple" });
  await app.register(registerFinanceRoutes, { prefix: "/api/v1/finance" });
  await app.register(registerFinanceScanRoutes, { prefix: "/api/v1/finance" });
  await app.register(registerHealthRoutes, { prefix: "/api/v1/health" });
  await app.register(registerAdminRoutes, { prefix: "/api/v1/admin" });
  await app.register(registerUserRoutes, { prefix: "/api/v1/user" });
  await app.register(registerNotificationsTestRoute, { prefix: "/api/v1/notifications" });
  // Legacy chat routes (non-v1) used by mobile
  await app.register(registerChatLegacyRoutes, { prefix: "/api/couple/chat" });
}
