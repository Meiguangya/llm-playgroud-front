// src/api/conversationList.ts
// 获取当前用户所有会话列表的 API 封装

export interface ConversationListItem {
  id: string;
  title: string;
  status: number;
  model_name: string;
  total_tokens: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface GetUserConversationsResponse {
  code: number;
  message: string;
  data: ConversationListItem[];
}

export async function getUserConversations(): Promise<ConversationListItem[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch('http://localhost:9001/api/v1/conversations/', {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
  const json: GetUserConversationsResponse = await res.json();
  if (json.code === 200 && Array.isArray(json.data)) {
    return json.data;
  }
  return [];
}
