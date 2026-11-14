import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { ListMasterParams } from "@/types/master";
import type {
  ListPriceListsResult,
  PriceList,
  PriceListFormValues,
  PriceListItem,
  PriceListItemWriteData,
} from "@/types/priceList";

export async function fetchPriceLists(
  params: ListMasterParams = {},
): Promise<ListPriceListsResult> {
  const response = await httpClient.get<ApiResponseBody<ListPriceListsResult>>("/price-lists", {
    params,
  });
  return response.data.data as ListPriceListsResult;
}

export async function fetchPriceList(id: string): Promise<PriceList> {
  const response = await httpClient.get<ApiResponseBody<PriceList>>(`/price-lists/${id}`);
  return response.data.data as PriceList;
}

export async function createPriceListApi(values: PriceListFormValues): Promise<PriceList> {
  const response = await httpClient.post<ApiResponseBody<PriceList>>("/price-lists", values);
  return response.data.data as PriceList;
}

export async function updatePriceListApi(
  id: string,
  values: PriceListFormValues,
): Promise<PriceList> {
  const response = await httpClient.put<ApiResponseBody<PriceList>>(`/price-lists/${id}`, values);
  return response.data.data as PriceList;
}

export async function deletePriceListApi(id: string): Promise<void> {
  await httpClient.delete(`/price-lists/${id}`);
}

export async function restorePriceListApi(id: string): Promise<PriceList> {
  const response = await httpClient.patch<ApiResponseBody<PriceList>>(`/price-lists/${id}/restore`);
  return response.data.data as PriceList;
}

export async function setPriceListStatusApi(id: string, active: boolean): Promise<PriceList> {
  const response = await httpClient.patch<ApiResponseBody<PriceList>>(`/price-lists/${id}/status`, {
    active,
  });
  return response.data.data as PriceList;
}

export async function fetchPriceListItems(id: string): Promise<PriceListItem[]> {
  const response = await httpClient.get<ApiResponseBody<PriceListItem[]>>(
    `/price-lists/${id}/items`,
  );
  return response.data.data as PriceListItem[];
}

export async function setPriceListItemsApi(
  id: string,
  items: PriceListItemWriteData[],
): Promise<PriceListItem[]> {
  const response = await httpClient.put<ApiResponseBody<PriceListItem[]>>(
    `/price-lists/${id}/items`,
    items,
  );
  return response.data.data as PriceListItem[];
}
