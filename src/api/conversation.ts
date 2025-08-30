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

export interface UpdateConversationTitleResponse {
  code: number;
  message: string;
  data?: {
    id: string;
    title: string;
    updated_at: string;
  };
}

/**
 * 调用后端接口，更新会话标题
 * @param conversationId 会话ID
 * @param title 新标题
 * @returns Promise<boolean> 是否成功
 */
export async function updateConversationTitleApi(conversationId: string, title: string): Promise<boolean> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`http://localhost:9001/api/v1/conversations/${conversationId}/title`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const json: UpdateConversationTitleResponse = await res.json();
  return json.code === 200;
}

export interface DeleteConversationResponse {
  code: number;
  message: string;
  data?: null;
}

/**
 * 调用后端接口，删除会话
 * @param conversationId 会话ID
 * @returns Promise<boolean> 是否成功
 */
export async function deleteConversationApi(conversationId: string): Promise<boolean> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`http://localhost:9001/api/v1/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: {
      'accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
  const json: DeleteConversationResponse = await res.json();
  return json.code === 200;
}
