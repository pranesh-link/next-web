import { REVALIDATE_CONFIG } from "@/_constants/common";
import { getApiUrl } from "@/_utils/common";

export async function getApiData(apiPath: string) {
  return await (
    await fetch(getApiUrl(apiPath), { next: REVALIDATE_CONFIG })
  ).json();
}
