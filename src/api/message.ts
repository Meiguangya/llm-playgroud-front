// src/api/message.ts
// 通过会话ID获取消息列表

export interface MessageItem {
  id: string;
  conversation_id: string;
  role: 'human' | 'ai';
  content: string;
}

export interface GetMessagesResponse {
  code: number;
  message: string;
  data: MessageItem[];
}

export async function getMessagesByConversationId(conversationId: string): Promise<MessageItem[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`http://localhost:9001/api/v1/messages/${conversationId}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
  const json: GetMessagesResponse = await res.json();
  if (json.code === 200 && Array.isArray(json.data)) {
    return json.data;
  }
  return [];
}
