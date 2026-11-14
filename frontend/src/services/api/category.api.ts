import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  Category,
  CategoryFormValues,
  ListCategoriesParams,
  ListCategoriesResult,
} from "@/types/master";

export async function fetchCategories(
  params: ListCategoriesParams = {},
): Promise<ListCategoriesResult> {
  const response = await httpClient.get<ApiResponseBody<ListCategoriesResult>>("/categories", {
    params,
  });
  return response.data.data as ListCategoriesResult;
}

export async function fetchCategory(id: string): Promise<Category> {
  const response = await httpClient.get<ApiResponseBody<Category>>(`/categories/${id}`);
  return response.data.data as Category;
}

export async function createCategoryApi(values: CategoryFormValues): Promise<Category> {
  const response = await httpClient.post<ApiResponseBody<Category>>("/categories", values);
  return response.data.data as Category;
}

export async function updateCategoryApi(id: string, values: CategoryFormValues): Promise<Category> {
  const response = await httpClient.put<ApiResponseBody<Category>>(`/categories/${id}`, values);
  return response.data.data as Category;
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await httpClient.delete(`/categories/${id}`);
}

export async function restoreCategoryApi(id: string): Promise<Category> {
  const response = await httpClient.patch<ApiResponseBody<Category>>(`/categories/${id}/restore`);
  return response.data.data as Category;
}

export async function setCategoryStatusApi(id: string, active: boolean): Promise<Category> {
  const response = await httpClient.patch<ApiResponseBody<Category>>(`/categories/${id}/status`, {
    active,
  });
  return response.data.data as Category;
}
