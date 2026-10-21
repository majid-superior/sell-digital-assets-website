// src/services/v1/notificationService.ts
import { apiClient } from "@/services/api.ts";

export interface UserNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: {
    assetId?: string;
    slug?: string;
    title?: string;
    feedback?: string;
    sellerFeedback?: string;
    [key: string]: unknown;
  } | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResult {
  items: UserNotification[];
  total: number;
  unreadCount: number;
}

interface NotificationsEnvelope {
  success: boolean;
  data: UserNotification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    unreadCount: number;
  };
}

class NotificationService {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationListResult> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;
    if (params?.unreadOnly) cleanParams.unreadOnly = true;

    const res = await apiClient.get<NotificationsEnvelope>(
      "/api/v1/notifications",
      { params: cleanParams },
    );

    const items = Array.isArray(res?.data) ? res.data : [];
    const unreadCount =
      typeof res?.pagination?.unreadCount === "number"
        ? res.pagination.unreadCount
        : items.filter((n) => !n.is_read).length;
    const total =
      typeof res?.pagination?.total === "number"
        ? res.pagination.total
        : items.length;

    return {
      items,
      total,
      unreadCount,
    };
  }

  async markAsRead(id: string): Promise<UserNotification> {
    const res = await apiClient.patch<{
      success: boolean;
      data: UserNotification;
    }>(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {});
    return res.data;
  }

  async markAllAsRead(): Promise<{ count?: number }> {
    const res = await apiClient.post<{
      success: boolean;
      data?: { count?: number };
    }>("/api/v1/notifications/read-all", {});
    return res.data || {};
  }
}

export const notificationService = new NotificationService();
export default notificationService;

