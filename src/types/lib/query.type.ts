/* Query pagination params */

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}
