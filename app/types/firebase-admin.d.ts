declare module 'firebase-admin' {
  interface App {
    name: string;
  }

  interface Credential {
    cert(serviceAccount: object): object;
  }

  interface AppOptions {
    credential: object;
  }

  interface MessagingPayload {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
    tokens?: string[];
    token?: string;
  }

  interface SendResponse {
    success: boolean;
    error?: { code: string; message: string };
  }

  interface BatchResponse {
    successCount: number;
    failureCount: number;
    responses: SendResponse[];
  }

  interface Messaging {
    sendEachForMulticast(message: MessagingPayload): Promise<BatchResponse>;
  }

  const apps: App[];
  const credential: Credential;
  function initializeApp(options: AppOptions): App;
  function messaging(): Messaging;
}
