abstract final class ApiEndpoints {
  static const auth = '/api/v1/auth/mobile';
  static const refreshToken = '/api/v1/auth/refresh';
  static const accounts = '/api/v1/finance/accounts';
  static const transactions = '/api/v1/finance/transactions';
  static const budgets = '/api/v1/finance/budgets';
  static const loans = '/api/v1/finance/loans';
  static const goals = '/api/v1/finance/goals';
  static const deposits = '/api/v1/finance/deposits';
  static const investments = '/api/v1/finance/investments';
  static const insights = '/api/v1/finance/insights';
  static const budgetPlans = '/api/v1/finance/budget-plans';
  static const couple = '/api/v1/couple';
  static const notifications = '/api/v1/finance/notifications';
  static const scanReceipt = '/api/v1/finance/scan-receipt';
  static const scanSchedule = '/api/v1/finance/scan-schedule';
  static const syncStatus = '/api/v1/finance/sync-status';
  static const devices = '/api/v1/devices';
  static const notificationsTest = '/api/v1/notifications/test';

  // Chat
  static const chatMessages = '/api/couple/chat/messages';
  static const chatTyping = '/api/couple/chat/typing';
  static const chatStream = '/api/couple/chat/stream';
  static const userPublicKey = '/api/v1/user/public-key';
  static const partnerPublicKey = '/api/v1/couple/partner-public-key';
  static const chatEncryptBatch = '/api/v1/couple/chat/encrypt-batch';
  static const coupleMembers = '/api/v1/couple/members';
}
