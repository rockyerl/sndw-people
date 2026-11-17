/* API response envelope — kontrak PRD */

export interface ApiResponseSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: ResponseMeta;
  error?: never;
}

export interface ApiResponseError {
  success: false;
  data?: never;
  error: ApiError;
  meta?: ResponseMeta;
}

export type ApiResponse<T = unknown> =
  | ApiResponseSuccess<T>
  | ApiResponseError;

export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
