// src/hooks/useInitConversations.ts
// 登录后或页面刷新时初始化 conversations 的自定义 hook
import { useCallback } from 'react';
import { getUserConversations, ConversationListItem } from '../api/conversationList';
import { useConversationContext, Conversation, ChatMessage } from '../stores/conversation.store';
import { MenuPage } from '../stores/functionMenu.store';

/**
 * 拉取当前用户所有会话并初始化 conversations 状态
 */
export function useInitConversations() {
  const { setConversations } = useConversationContext();

  // 拉取并格式化会话列表
  const initConversations = useCallback(async () => {
    const list: ConversationListItem[] = await getUserConversations();
    // 转换为前端 Conversation 类型，type 用 MenuPage.Chat，messages 类型为 ChatMessage[]
    const conversations: Conversation[] = list.map(item => ({
      id: item.id,
      title: item.title,
      type: MenuPage.Chat,
      messages: [] as ChatMessage[],
      createdAt: new Date(item.created_at).getTime(),
      capabilities: { deepThink: false, onlineSearch: false },
    }));
    setConversations(conversations);
  }, [setConversations]);

  return { initConversations };
}
