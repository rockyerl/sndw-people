import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { appConfig } from "@/lib/app-config";
import type { ApiResponse, ApiResponseError } from "@/types/lib/api.type";

export class HttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: appConfig.api.baseUrl,
      timeout: appConfig.api.timeout,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { success, data } = response.data;
        if (success) {
          return { ...response, data };
        }
        return Promise.reject((response.data as ApiResponseError).error);
      },
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const apiError = error.response.data?.error;
          if (apiError) {
            return Promise.reject(apiError);
          }
          return Promise.reject({
            code: `HTTP_${status}`,
            message: this.getErrorMessage(status),
          });
        }
        if (error.code === "ECONNABORTED") {
          return Promise.reject({
            code: "REQUEST_TIMEOUT",
            message: "Permintaan waktu habis. Coba lagi.",
          });
        }
        return Promise.reject({
          code: "NETWORK_ERROR",
          message: "Koneksi terputus. Periksa koneksi internet Anda.",
        });
      }
    );
  }

  private getErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: "Permintaan tidak valid.",
      401: "Sesi berakhir. Silakan login kembali.",
      403: "Anda tidak memiliki akses.",
      404: "Data tidak ditemukan.",
      409: "Terjadi konflik data.",
      422: "Validasi gagal. Periksa data yang dimasukkan.",
      429: "Terlalu banyak permintaan. Tunggu sebentar.",
      500: "Terjadi kesalahan server.",
      503: "Layanan sedang tidak tersedia.",
    };
    return messages[status] || `Terjadi kesalahan (HTTP ${status}).`;
  }

  async get<T>(url: string, params?: Record<string, unknown>) {
    const queryParams =
      params && "params" in params && typeof params.params === "object" && params.params !== null
        ? (params.params as Record<string, unknown>)
        : params;
    const response = await this.client.get<T>(url, { params: queryParams });
    return response.data as T;
  }

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>) {
    const response = await this.client.post<T>(url, data, config as Parameters<AxiosInstance['post']>[2]);
    return response.data as T;
  }

  async patch<T>(url: string, data?: unknown) {
    const response = await this.client.patch<T>(url, data);
    return response.data as T;
  }

  async delete<T>(url: string) {
    const response = await this.client.delete<T>(url);
    return response.data as T;
  }

  async put<T>(url: string, data?: unknown) {
    const response = await this.client.put<T>(url, data);
    return response.data as T;
  }
}

// Singleton instance
export const httpClient = new HttpClient();
export const http = httpClient;
