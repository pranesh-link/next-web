import { REVALIDATE_CONFIG } from "@/_constants/common";
import { getApiUrl } from "@/_utils/common";

export async function getApiData(apiPath: string, config?: RequestInit) {
  return await (
    await fetch(getApiUrl(apiPath), config ?? { next: REVALIDATE_CONFIG })
  ).json();
}
