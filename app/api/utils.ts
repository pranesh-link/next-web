import { REVALIDATE_CONFIG } from "@/_constants/common";
import apiService, { ApiRequestConfig } from "@/_services/api/axios-service";
import { getApiUrl } from "@/_utils/common";

export async function getApiData(apiPath: string, config?: RequestInit) {
  return await (
    await fetch(getApiUrl(apiPath), config ?? { next: REVALIDATE_CONFIG })
  ).json();
}

export async function getApi<TResponse = unknown>(
  apiPath: string,
  config?: ApiRequestConfig
): Promise<TResponse> {
  return apiService.get<TResponse>(apiPath, config?.params as Record<string, unknown>, config);
}

export async function postApi<TResponse = unknown, TBody = unknown>(
  apiPath: string,
  body?: TBody,
  config?: ApiRequestConfig
): Promise<TResponse> {
  return apiService.post<TResponse, TBody>(
    apiPath,
    body,
    config?.params as Record<string, unknown>,
    config
  );
}

export async function putApi<TResponse = unknown, TBody = unknown>(
  apiPath: string,
  body?: TBody,
  config?: ApiRequestConfig
): Promise<TResponse> {
  return apiService.put<TResponse, TBody>(
    apiPath,
    body,
    config?.params as Record<string, unknown>,
    config
  );
}

export async function patchApi<TResponse = unknown, TBody = unknown>(
  apiPath: string,
  body?: TBody,
  config?: ApiRequestConfig
): Promise<TResponse> {
  return apiService.patch<TResponse, TBody>(
    apiPath,
    body,
    config?.params as Record<string, unknown>,
    config
  );
}

export async function deleteApi<TResponse = unknown, TBody = unknown>(
  apiPath: string,
  _body?: TBody,
  config?: ApiRequestConfig
): Promise<TResponse> {
  return apiService.delete<TResponse>(
    apiPath,
    config?.params as Record<string, unknown>,
    config
  );
}
