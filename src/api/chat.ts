import { BASE_URL } from "../const";

interface ChatParams {
  model?: string;
  chatId?: string;
  deepThink?: boolean;
  onlineSearch?: boolean;
}

export const getChat = async (
  prompt: string,
  callback?: (value: Uint8Array) => void,
  params?: ChatParams
): Promise<Response> => {
  const { model, chatId, onlineSearch, deepThink } = params || {};

  let res: Response;
  if (onlineSearch) {
    // 联网搜索请求
    console.log("onlineSearch", onlineSearch);
    res = await fetch(BASE_URL + "/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: prompt,
    });
    console.log("联网搜索响应状态:", res.status, res.statusText);
  } else if (deepThink) {
    // 深度思考请求
    res = await fetch(BASE_URL + "/deep-thinking/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        model: model || "",
        chatId: chatId || "",
      },
      body: prompt,
    });
  } else {
    // 普通聊天请求 "http://127.0.0.1:9001/api/v1"
    // BASE_URL + "/chat"
    const url = "http://127.0.0.1:9001/api/v2" + "/chat";
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        model: model || "",
        chatId: chatId || "",
      },
      body: prompt,
    });
  }

  // --- 流式读取响应内容 ---
  // 获取响应的可读流 reader
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  // 递归读取流内容，每次读取到数据就通过 callback 传递出去
  await reader.read().then(function process({ done, value }) {
    // done 为 true 表示流读取结束
    if (done) return;
    // value 是当前读取到的 Uint8Array 数据块
    callback?.(value);
    // 继续读取下一个数据块，直到 done 为 true
    return reader.read().then(process);
  });

  // 返回原始响应对象，供后续处理
  return res;
};
