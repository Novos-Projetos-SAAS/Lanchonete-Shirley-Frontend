export interface SuccessEnvelope<T> {
  status: "success";
  data: T;
  message?: string;
}

export interface ErrorEnvelope {
  status: "fail" | "error";
  code: string;
  message: string;
  request_id?: string;
  details?: Array<{ path?: string; message?: string }>;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: import("./domain").Pagination;
}

