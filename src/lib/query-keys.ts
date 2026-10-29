export const queryKeys = {
  session: ["session"] as const,
  storeStatus: ["store-status"] as const,
  menu: ["menu"] as const,
  product: (id: string) => ["product", id] as const,
  payments: ["payment-methods"] as const,
  orders: (filters: Record<string, unknown> = {}) => ["admin-orders", filters] as const,
  order: (id: string) => ["admin-order", id] as const,
  resource: (name: string, filters: Record<string, unknown> = {}) => ["resource", name, filters] as const,
  notifications: ["notifications"] as const,
  unreadNotifications: ["notifications-unread"] as const,
  invitations: (filters: Record<string, unknown> = {}) => ["invitations", filters] as const,
};

