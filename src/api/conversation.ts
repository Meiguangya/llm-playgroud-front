// 新建会话的 API 封装
export interface CreateConversationParams {
  title: string;
  model_name: string;
}

export interface CreateConversationResponse {
  code: number;
  message: string;
  data: {
    id: string;
    title: string;
    status: number;
    model_name: string;
    total_tokens: number;
    message_count: number;
    created_at: string;
    updated_at: string;
  };
}

export async function apiCreateConversation(params: CreateConversationParams): Promise<CreateConversationResponse> {
  const token = localStorage.getItem('access_token');
  const res = await fetch('http://localhost:9001/api/v1/conversations/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(params),
  });
  return res.json();
}
