import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

export class ApiError<TData = unknown> extends Error {
  status: number;
  data?: TData;

  constructor(message: string, status: number, data?: TData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type TokenGetter =
  () => string | null | undefined | Promise<string | null | undefined>;

type QueryParams = Record<string, unknown>;

interface ApiServiceOptions {
  baseURL?: string;
  getToken?: TokenGetter;
  headers?: Record<string, string>;
}

export type ApiRequestConfig = AxiosRequestConfig;

export class ApiService {
  private readonly client: AxiosInstance;
  private readonly getToken?: TokenGetter;

  constructor(options: ApiServiceOptions = {}) {
    this.getToken = options.getToken;

    this.client = axios.create({
      baseURL: options.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    this.client.interceptors.request.use(
      (config) => this.attachAuthorization(config),
      (error) => Promise.reject(this.normalizeError(error))
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.normalizeError(error))
    );
  }

  async get<TResponse, TParams extends QueryParams = QueryParams>(
    url: string,
    params?: TParams,
    config: AxiosRequestConfig = {}
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'get',
      url,
      params,
    });
  }

  async post<
    TResponse,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    url: string,
    data?: TBody,
    params?: TParams,
    config: AxiosRequestConfig = {}
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'post',
      url,
      data,
      params,
    });
  }

  async put<
    TResponse,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    url: string,
    data?: TBody,
    params?: TParams,
    config: AxiosRequestConfig = {}
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'put',
      url,
      data,
      params,
    });
  }

  async patch<
    TResponse,
    TBody = unknown,
    TParams extends QueryParams = QueryParams,
  >(
    url: string,
    data?: TBody,
    params?: TParams,
    config: AxiosRequestConfig = {}
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'patch',
      url,
      data,
      params,
    });
  }

  async delete<TResponse, TParams extends QueryParams = QueryParams>(
    url: string,
    params?: TParams,
    config: AxiosRequestConfig = {}
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'delete',
      url,
      params,
    });
  }

  private async request<TResponse>(
    config: AxiosRequestConfig
  ): Promise<TResponse> {
    try {
      const response = await this.client.request<TResponse>(config);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private async attachAuthorization(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    if (!this.getToken) {
      return config;
    }

    const token = await this.getToken();

    if (!token) {
      return config;
    }

    config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  }

  private normalizeError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status ?? 500;
      const data = axiosError.response?.data;

      return new ApiError(this.getAxiosErrorMessage(axiosError), status, data);
    }

    if (error instanceof Error) {
      return new ApiError(error.message, 500);
    }

    return new ApiError('An unexpected error occurred', 500, error);
  }

  private getAxiosErrorMessage(error: AxiosError): string {
    const responseData = error.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const data = responseData as { message?: unknown; error?: unknown };

      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }

      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
      }
    }

    return error.message || 'Request failed';
  }
}

const apiService = new ApiService({
  baseURL: '/api/v1',
});

export default apiService;
