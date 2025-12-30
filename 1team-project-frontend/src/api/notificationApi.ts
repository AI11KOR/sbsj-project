// 알림 관련 API 함수들
import API from "./axiosApi"

export type NotificationType = "POST" | "COMMENT" | "LIKE"

export type Notification = {
  idx: number
  user_id: string | null
  type: NotificationType | null
  message: string | null
  is_read: boolean | null
  created_at: string | null
}

// 알림 목록 조회
export const getNotifications = async () => {
  const response = await API.get("/notifications")
  return response.data
}

// 알림 읽음 처리
export const markNotificationAsRead = async (id: number) => {
  const response = await API.put(`/notifications/${id}/read`)
  return response.data
}

// 모든 알림 읽음 처리
export const markAllNotificationsAsRead = async () => {
  const response = await API.put("/notifications/read-all")
  return response.data
}

// 알림 삭제
export const deleteNotification = async (id: number) => {
  const response = await API.delete(`/notifications/${id}`)
  return response.data
}

