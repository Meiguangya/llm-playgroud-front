// src/utils/logout.ts

/**
 * 退出登录API响应类型
 */
export interface LogoutResponse {
  code: number;
  message: string;
  data?: null;
}

/**
 * 调用后端接口，退出登录
 * @returns Promise<boolean> 是否成功
 */
export async function logoutApi(): Promise<boolean> {
  const token = localStorage.getItem('access_token');
  const res = await fetch('http://localhost:9001/api/v1/users/logout', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: '',
  });
  const json: LogoutResponse = await res.json();
  return json.code === 200;
}

/**
 * 退出登录通用逻辑：先调后端，再清空本地状态。
 * 如果后端返回 401/Token 失效等错误，也强制本地退出。
 * @param clearLocal 清空本地状态的回调
 * @returns Promise<boolean> 是否成功
 */
export async function handleLogout(clearLocal: () => void): Promise<boolean> {
  try {
    const ok = await logoutApi();
    if (ok) {
      clearLocal();
      return true;
    }
    // 如果不是 token 失效，正常报错
    clearLocal(); // 兼容：只要接口返回非 200 也强制本地退出
    return false;
  } catch (e: any) {
    // 只要接口报错（如 401），也强制本地退出
    clearLocal();
    return false;
  }
}
