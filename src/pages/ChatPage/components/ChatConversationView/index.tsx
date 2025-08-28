import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Sender } from "@ant-design/x";
import { useStyle } from "../../style";
import {
  useConversationContext,
  BaseMessage,
} from "../../../../stores/conversation.store";
import BasePage from "../../../components/BasePage";
import { getChat } from "../../../../api/chat";
import { Button, theme } from "antd";
import { actionButtonConfig } from "../../../../const";
import {
  decoder,
  mapStoredMessagesToUIMessages,
  scrollToBottom,
} from "../../../../utils";
import { useFunctionMenuStore } from "../../../../stores/functionMenu.store";
import { useModelConfigContext } from "../../../../stores/modelConfig.store";
import {
  AiCapabilities,
  ChatConversationViewProps,
  Message,
} from "../../types";
import ResponseBubble from "../../../components/ResponseBubble";
import RequestBubble from "../../../components/RequestBubble";
import { useThrottle } from "../../../../hooks/useThrottle";

// 定义聊天消息类型，继承自 BaseMessage
interface ChatUiMessage extends BaseMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// 聊天会话主组件
const ChatConversationView: React.FC<ChatConversationViewProps> = ({
  conversationId,
}) => {
  // 主题 token，用于自定义样式
  const { token } = theme.useToken();
  // 获取自定义样式
  const { styles } = useStyle();
  // 获取当前路由信息
  const location = useLocation();
  // 聊天输入框内容
  const [inputContent, setInputContent] = useState("");
  // 是否正在加载（发送/接收消息中）
  const [isLoading, setIsLoading] = useState(false);
  // 当前消息列表
  const [messages, setMessages] = useState<Message[]>([]);
  // 消息容器 DOM 引用，用于滚动到底部
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 获取当前模型配置
  const { currentModel } = useModelConfigContext();
  // 菜单栏是否收起
  const { menuCollapsed } = useFunctionMenuStore();

  // 获取会话上下文相关方法和数据
  const {
    activeConversation,
    chooseActiveConversation,
    aiCapabilities,
    toggleCapability,
    updateCapability,
    appendAssistantMessage,
    processSendMessage,
    deleteMessageAndAfter,
    updateMessageContent,
    updateActiveConversation,
  } = useConversationContext();

  // 用于判断是否首次加载，避免重复处理 URL 参数
  const isFirstLoad = useRef(true);
  // 记录已处理过的 prompt，防止重复发送
  const processedPrompts = useRef(new Set<string>());

  // 监听会话 ID 变化，切换当前会话
  useEffect(() => {
    chooseActiveConversation(conversationId);
  }, [conversationId, chooseActiveConversation]);

  // 每次消息变化后自动滚动到底部
  useEffect(() => {
    scrollToBottom(messagesContainerRef.current);
  }, [messages]);

  // 从存储的会话中加载消息到 UI
  useEffect(() => {
    if (activeConversation) {
      if (
        activeConversation.messages &&
        activeConversation.messages.length > 0
      ) {
        // 过滤掉 isLoading 的消息
        const filteredMessages = activeConversation.messages.filter(
          (msg) => !(msg as any).isLoading
        );

        if (filteredMessages.length > 0) {
          // 转换为 UI 消息格式
          const uiMessages = mapStoredMessagesToUIMessages(
            filteredMessages as ChatUiMessage[]
          );
          setMessages(uiMessages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [activeConversation?.id, activeConversation?.messages]);

  // 处理 URL 中的 prompt 参数，实现外部跳转自动发消息
  useEffect(() => {
    if (isFirstLoad.current && activeConversation) {
      const queryParams = new URLSearchParams(location.search);
      const urlPrompt = queryParams.get("prompt");
      const onlineSearch = queryParams.get("onlineSearch") === "true";
      const deepThink = queryParams.get("deepThink") === "true";

      // 根据 URL 参数切换 AI 能力
      if (onlineSearch) {
        updateCapability("onlineSearch", true);
      } else if (deepThink) {
        updateCapability("deepThink", true);
      }

      if (urlPrompt && !processedPrompts.current.has(urlPrompt)) {
        // 标记此 prompt 已处理，避免重复
        processedPrompts.current.add(urlPrompt);
        // 清除 URL 中的 prompt 参数，防止刷新页面重复发送
        const newUrl = window.location.hash.split("?")[0];
        window.history.replaceState({}, document.title, newUrl);

        // 延迟触发消息发送，避免状态未就绪
        const timeId = setTimeout(() => {
          if (activeConversation && !isLoading) {
            handleSendMessage(urlPrompt);
          }
          clearTimeout(timeId);
        }, 30);
      }

      isFirstLoad.current = false;
    }
  }, [location.search, activeConversation, updateCapability, isLoading]);

  // 节流更新 AI 回复消息，防止频繁渲染
  const updateConversationMessages = useThrottle(
    (
      messageContent: string,
      role: "assistant",
      isError: boolean = false,
      userTimestamp: number,
      userMessage: ChatUiMessage
    ) => {
      appendAssistantMessage(
        messageContent,
        role,
        isError,
        userTimestamp,
        userMessage
      );
    },
    100
  );

  // 发送消息到 API 并更新会话
  const handleSendMessage = async (text: string) => {
    // 1. 校验输入内容、加载状态和会话是否激活
    if (!text.trim() || isLoading || !activeConversation) return;

    // 2. 构造用户消息对象
    const createMessage = (text: string, timestamp: number): ChatUiMessage => ({
      role: "user",
      content: text,
      timestamp,
    });

    // 3. 生成当前用户消息并加入消息列表，实现即时显示
    const userTimestamp = Date.now();
    const userMessage = createMessage(text, userTimestamp);
    const userMessageUI: Message = mapStoredMessagesToUIMessages([
      userMessage,
    ])[0];
    setMessages((prev) => [...prev, userMessageUI]);

    // 4. 定义发送请求方法，流式处理 AI 回复
    const sendRequest = async (
      text: string,
      userTimestamp: number,
      userMessage: ChatUiMessage
    ) => {
      // 4.1 构造请求参数
      const params = {
        chatId: activeConversation?.id,
        model: currentModel?.value,
        deepThink: aiCapabilities.deepThink,
        onlineSearch: aiCapabilities.onlineSearch,
      };
      let thinkContentText = "";
      let contentText = "";
      let chunkBuffer: string[] = [];

      // 4.2 调用 getChat，流式接收 AI 回复
      const response = await getChat(
        text,
        (value) => {
          // 4.3 解码流式内容，分段处理
          const chunk = decoder.decode(value);
          chunkBuffer.push(chunk);

          const [thinkContent, content] = classifyChunk(chunk);
          if (thinkContent) {
            thinkContentText += thinkContent;
          }
          if (content) {
            contentText += content;
          }
          // 4.4 组合最终内容，更新消息列表
          const totalText = thinkContentText
            ? `<think>${thinkContentText}</think> ${contentText}`
            : contentText;

          updateConversationMessages(
            totalText,
            "assistant",
            false,
            userTimestamp,
            userMessage
          );

          chunkBuffer = [];
        },
        params
      );

      // 4.5 检查响应结果
      if (!response.ok || !contentText) {
        throw new Error("请求失败");
      }

      // 4.6 处理剩余内容
      if (chunkBuffer.length > 0) {
        const remainingChunk = chunkBuffer.join("");
        const [thinkContent, content] = classifyChunk(remainingChunk);
        if (thinkContent) {
          thinkContentText += thinkContent;
        }
        if (content) {
          contentText += content;
        }
      }

      // 4.7 最终内容再次更新消息
      const finalText = thinkContentText
        ? `<think>${thinkContentText}</think> ${contentText}`
        : contentText;
      updateConversationMessages(
        finalText,
        "assistant",
        false,
        userTimestamp,
        userMessage
      );
    };

    // 5. 统一处理发送流程，包括 loading 状态和输入框清理
    await processSendMessage({
      text,
      sendRequest,
      createMessage,
      setLoading: setIsLoading,
      setInputContent,
    });
  };

  // 处理重新生成消息（revert 操作）
  const handleReloadMessage = async (messageTimestamp: number) => {
    if (!activeConversation || isLoading) return;

    // 找到要重新生成的消息
    const messageIndex = activeConversation.messages.findIndex(
      (msg) => msg.timestamp === messageTimestamp
    );

    if (messageIndex === -1) return;

    // 找到对应的用户消息（应该在 assistant 消息之前）
    const userMessage = activeConversation.messages
      .slice(0, messageIndex)
      .reverse()
      .find((msg) => msg.role === "user");

    if (!userMessage) return;

    // 删除当前 assistant 消息及其之后的所有消息（revert 操作）
    const remainingMessages = deleteMessageAndAfter(messageTimestamp);

    // 直接重新生成回复，不创建新的用户消息
    setIsLoading(true);

    // 创建一个使用正确 baseMessages 的更新函数
    const updateConversationMessagesWithBase = useThrottle(
      (
        messageContent: string,
        role: "assistant",
        isError: boolean = false,
        userTimestamp: number,
        userMessage: ChatUiMessage
      ) => {
        appendAssistantMessage(
          messageContent,
          role,
          isError,
          userTimestamp,
          userMessage,
          remainingMessages as ChatUiMessage[]
        );
      },
      100
    );

    const sendRequest = async (
      text: string,
      userTimestamp: number,
      userMessage: ChatUiMessage
    ) => {
      const params = {
        chatId: activeConversation?.id,
        model: currentModel?.value,
        deepThink: aiCapabilities.deepThink,
        onlineSearch: aiCapabilities.onlineSearch,
      };
      let thinkContentText = "";
      let contentText = "";
      let chunkBuffer: string[] = [];

      const response = await getChat(
        text,
        (value) => {
          const chunk = decoder.decode(value);
          chunkBuffer.push(chunk);

          const [thinkContent, content] = classifyChunk(chunk);
          if (thinkContent) {
            thinkContentText += thinkContent;
          }
          if (content) {
            contentText += content;
          }
          const totalText = thinkContentText
            ? `<think>${thinkContentText}</think> ${contentText}`
            : contentText;

          updateConversationMessagesWithBase(
            totalText,
            "assistant",
            false,
            userTimestamp,
            userMessage
          );

          chunkBuffer = [];
        },
        params
      );

      if (!response.ok || !contentText) {
        throw new Error("请求失败");
      }

      if (chunkBuffer.length > 0) {
        const remainingChunk = chunkBuffer.join("");
        const [thinkContent, content] = classifyChunk(remainingChunk);
        if (thinkContent) {
          thinkContentText += thinkContent;
        }
        if (content) {
          contentText += content;
        }
      }

      const finalText = thinkContentText
        ? `<think>${thinkContentText}</think> ${contentText}`
        : contentText;
      updateConversationMessagesWithBase(
        finalText,
        "assistant",
        false,
        userTimestamp,
        userMessage
      );
    };

    try {
      await sendRequest(
        userMessage.content,
        userMessage.timestamp,
        userMessage as ChatUiMessage
      );
    } catch (error) {
      console.error("重新生成消息错误:", error);
      appendAssistantMessage(
        "抱歉，重新生成回复时出现错误。",
        "assistant",
        true,
        userMessage.timestamp,
        userMessage as ChatUiMessage,
        remainingMessages as ChatUiMessage[]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 处理编辑消息
  const handleEditConfirm = async (
    messageTimestamp: number,
    newContent: string
  ) => {
    if (!activeConversation || isLoading) return;

    // 找到要编辑的消息
    const message = activeConversation.messages.find(
      (msg) => msg.timestamp === messageTimestamp
    );

    if (!message || message.role !== "user") return;

    // 删除当前消息之后的所有消息（保留用户消息本身）
    const remainingMessages = activeConversation.messages.filter(
      (msg) => msg.timestamp <= messageTimestamp
    );

    // 更新用户消息内容
    const updatedMessages = remainingMessages.map((msg) =>
      msg.timestamp === messageTimestamp
        ? ({ ...msg, content: newContent } as ChatUiMessage)
        : msg
    ) as ChatUiMessage[];

    // 立即更新会话状态
    updateActiveConversation({
      ...activeConversation,
      messages: updatedMessages,
    });

    // 直接重新生成回复
    setIsLoading(true);

    // 创建一个使用正确 baseMessages 的更新函数
    const updateConversationMessagesWithBase = useThrottle(
      (
        messageContent: string,
        role: "assistant",
        isError: boolean = false,
        userTimestamp: number,
        userMessage: ChatUiMessage
      ) => {
        appendAssistantMessage(
          messageContent,
          role,
          isError,
          userTimestamp,
          userMessage,
          updatedMessages
        );
      },
      100
    );

    // 创建更新后的用户消息
    const updatedUserMessage: ChatUiMessage = {
      ...message,
      content: newContent,
    } as ChatUiMessage;

    const sendRequest = async (
      text: string,
      userTimestamp: number,
      userMessage: ChatUiMessage
    ) => {
      const params = {
        chatId: activeConversation?.id,
        model: currentModel?.value,
        deepThink: aiCapabilities.deepThink,
        onlineSearch: aiCapabilities.onlineSearch,
      };
      let thinkContentText = "";
      let contentText = "";
      let chunkBuffer: string[] = [];

      const response = await getChat(
        text,
        (value) => {
          const chunk = decoder.decode(value);
          chunkBuffer.push(chunk);

          const [thinkContent, content] = classifyChunk(chunk);
          if (thinkContent) {
            thinkContentText += thinkContent;
          }
          if (content) {
            contentText += content;
          }
          const totalText = thinkContentText
            ? `<think>${thinkContentText}</think> ${contentText}`
            : contentText;

          updateConversationMessagesWithBase(
            totalText,
            "assistant",
            false,
            userTimestamp,
            userMessage
          );

          chunkBuffer = [];
        },
        params
      );

      if (!response.ok || !contentText) {
        throw new Error("请求失败");
      }

      if (chunkBuffer.length > 0) {
        const remainingChunk = chunkBuffer.join("");
        const [thinkContent, content] = classifyChunk(remainingChunk);
        if (thinkContent) {
          thinkContentText += thinkContent;
        }
        if (content) {
          contentText += content;
        }
      }

      const finalText = thinkContentText
        ? `<think>${thinkContentText}</think> ${contentText}`
        : contentText;
      updateConversationMessagesWithBase(
        finalText,
        "assistant",
        false,
        userTimestamp,
        userMessage
      );
    };

    try {
      await sendRequest(newContent, message.timestamp, updatedUserMessage);
    } catch (error) {
      console.error("重新生成消息错误:", error);
      appendAssistantMessage(
        "抱歉，重新生成回复时出现错误。",
        "assistant",
        true,
        message.timestamp,
        updatedUserMessage,
        updatedMessages
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 解析 AI 回复内容，区分 <think> 标签和普通内容
  const classifyChunk = (chunk: string) => {
    console.log("chunk", chunk);
    if (chunk.includes("<think>")) {
      return [chunk.replace("<think>", "").replace("</think>", ""), ""];
    } else {
      return ["", chunk];
    }
  };

  // 渲染主界面
  return (
    <BasePage title="对话" conversationId={conversationId}>
      <div className={styles.container}>
        {/* 消息列表区域 */}
        <div ref={messagesContainerRef} className={styles.messagesContainer}>
          {messages.length === 0 && !conversationId ? (
            <ResponseBubble
              content="你好，请问有什么可以帮你的吗？"
              timestamp={Date.now()}
            />
          ) : (
            messages.map((message) =>
              message.sender === "user" ? (
                <RequestBubble
                  key={message.id}
                  content={message.text}
                  timestamp={message.timestamp}
                  onEditConfirm={(newContent) =>
                    handleEditConfirm(message.timestamp, newContent)
                  }
                />
              ) : (
                <ResponseBubble
                  key={message.id}
                  content={message.text}
                  timestamp={message.timestamp}
                  isError={message.isError}
                  onReload={() => handleReloadMessage(message.timestamp)}
                />
              )
            )
          )}
        </div>

        {/* 输入区域和功能按钮 */}
        <div
          className={`${styles.chatPageSender} ${
            menuCollapsed
              ? styles.senderContainerCollapsed
              : styles.senderContainer
          }`}
        >
          {/* AI 能力切换按钮 */}
          <div className={styles.actionButtons}>
            {actionButtonConfig.map((button) => {
              const isActive =
                aiCapabilities[button.key as keyof AiCapabilities];
              return (
                <Button
                  key={button.key}
                  type="text"
                  icon={button.icon}
                  style={{
                    color: isActive ? "#fff" : button.baseColor,
                    background: isActive
                      ? button.activeColor
                      : token.colorBgElevated,
                    border: "2px solid #eee3",
                  }}
                  onClick={() => {
                    toggleCapability(button.key as keyof AiCapabilities);
                  }}
                >
                  {button.label}
                </Button>
              );
            })}
          </div>
          {/* 聊天输入框 */}
          <Sender
            value={inputContent}
            // header={senderHeader}
            onSubmit={handleSendMessage}
            // allowSpeech
            onChange={setInputContent}
            // prefix={attachmentsNode}
            loading={isLoading}
            className={styles.sender}
            placeholder={"您可以问我任何问题..."}
          />
        </div>
      </div>
    </BasePage>
  );
};

export default ChatConversationView;
