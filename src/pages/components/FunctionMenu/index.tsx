import {
  DeleteOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckOutlined,
  CloseOutlined,
  FormOutlined,
  DingdingOutlined,
  WechatWorkOutlined,
} from "@ant-design/icons";
import {
  Button,
  message,
  Select,
  Space,
  Typography,
  Input,
  Tooltip,
  Modal,
} from "antd";
import React, { useEffect, useState, useRef, useRef as useReactRef } from "react";
import { getMessagesByConversationId, MessageItem } from '../../../api/message';
import { useStyle } from "./style";
import { useModelConfigContext } from "../../../stores/modelConfig.store";
import {
  Conversation,
  useConversationContext,
} from "../../../stores/conversation.store";
import { functionMenuItems } from "./const";
import {
  useFunctionMenuStore,
  MenuPage,
} from "../../../stores/functionMenu.store";
import { useNavigate } from "react-router-dom";
import { FunctionMenuItem } from "../../../types";

export interface ConversationItem {
  key: string;
  label: React.ReactNode;
}

const FunctionMenu = () => {
  const { styles } = useStyle();
  const { menuCollapsed, toggleMenuCollapsed } = useFunctionMenuStore();
  const {
    conversations,
    setConversations,
    activeConversation,
    chooseActiveConversation,
    deleteConversation,
    clearActiveConversation,
    updateConversationTitle,
    updateActiveConversation,
    createConversation,
  } = useConversationContext();
  // 退出登录逻辑
  const handleLogout = () => {
    // 清空会话和激活会话
    setConversations([]);
    clearActiveConversation();
    // 清除本地 token/username
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    message.success('已退出登录');
    // 可选：跳转到登录页
    // navigate('/login');
  };
  const { initModelOptionList, modelOptionList, chooseModel, currentModel } =
    useModelConfigContext();
  const { chooseActiveMenuPage } = useFunctionMenuStore();
  const navigate = useNavigate();
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<any>(null);
  const [isDingTalkModalOpen, setIsDingTalkModalOpen] = useState(false);
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false);

  useEffect(() => {
    initModelOptionList();
  }, []);

  const onAddConversation = async (item: FunctionMenuItem) => {
    const newConversation = await createConversation(item.key as MenuPage, '');
    if (newConversation && newConversation.id) {
      chooseActiveConversation(newConversation.id);
      navigate(`/${item.key}/${newConversation.id}`);
    }
  };

  // 消息缓存，避免重复请求
  const messagesCache = useReactRef<{ [id: string]: import('../../../stores/conversation.store').ChatMessage[] }>({});

  const [conversationLoading, setConversationLoading] = useState(false);
  const onConversationClick = async (conversationId: string) => {
    try {
      if (editingConversationId && editingConversationId !== conversationId) {
        setEditingConversationId(null);
      }

      const conversation = conversations.find(
        (conv) => conv.id === conversationId
      );

      if (conversation) {
        setConversationLoading(true);
        window.dispatchEvent(new CustomEvent('conversation-loading', { detail: true }));
        // 优先查缓存
        let messages = messagesCache.current[conversationId];
        if (!messages || messages.length === 0) {
          // 拉取后端消息
          const rawMsgs: MessageItem[] = await getMessagesByConversationId(conversationId);
          messages = rawMsgs.map(msg => ({
            id: msg.id, // 保留后端唯一 id
            role: msg.role === 'human' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: Date.now(), // 可根据后端扩展
          }));
          messagesCache.current[conversationId] = messages;
        }
        updateActiveConversation({ ...conversation, messages });
        chooseActiveMenuPage(conversation.type);
        chooseActiveConversation(conversationId);
        navigate(`/${conversation.type}/${conversationId}`);
        setConversationLoading(false);
        window.dispatchEvent(new CustomEvent('conversation-loading', { detail: false }));
      }
    } catch (error) {
      setConversationLoading(false);
      window.dispatchEvent(new CustomEvent('conversation-loading', { detail: false }));
      console.error("处理会话点击出错:", error);
    }
  };

  const handleNewChat = () => {
    navigate("/chat");
  };

  // 编辑会话标题
  const startEditingTitle = (
    conversation: Conversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
    // 等待 DOM 更新后聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  const saveTitle = async (conversationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingTitle.trim()) {
      await updateConversationTitle(conversationId, editingTitle.trim());
    }
    setEditingConversationId(null);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingConversationId(null);
  };

  // 处理输入框按键事件
  const handleKeyDown = (conversationId: string, e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      saveTitle(conversationId);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <>
      {/* 会话切换 loading 状态传递给 ChatConversationView 作为 props，或用全局 context 也可 */}
      {menuCollapsed && (
        <Button
          className={styles.collapsedMenuBtn}
          type="primary"
          shape="circle"
          icon={<MenuUnfoldOutlined />}
          onClick={toggleMenuCollapsed}
        />
      )}
      <div className={`${menuCollapsed ? styles.menuCollapsed : styles.menu}`}>
        {/* 🌟 顶部信息 */}
        <div className={styles.userProfile}>
          {/* <Space align="center">
            <img src="/logo3.png" alt="PlayGround" />
          </Space> */}
          <Button
            type="text"
            icon={menuCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleMenuCollapsed}
          />
        </div>

        {/* 🌟 功能菜单 */}
        <div className={styles.functionMenu}>
          {functionMenuItems.map((item) => {
            return (
              item.render?.({
                item,
                onAddConversation,
                chooseActiveMenuPage: () => {
                  clearActiveConversation();
                  navigate(`/${item.key}`);
                },
                styles,
                handleNewChat,
              }) || (
                <div
                  key={item.key}
                  className={styles.functionMenuItem}
                  onClick={() => {
                    clearActiveConversation();
                    navigate(`/${item.key}`);
                  }}
                >
                  <Space>
                    {item.icon}
                    <span>{item.label}</span>
                  </Space>
                </div>
              )
            );
          })}
        </div>

        {/* 🌟 模型选择 */}
        <div className={styles.chooseModel}>
          <Typography.Text className={styles.menuTitle}>
            模型选择
          </Typography.Text>
          <Select
            onChange={(value) => chooseModel(value)}
            options={modelOptionList}
            style={{ width: "100%" }}
            value={currentModel?.value}
          />
        </div>
        <div className={styles.conversationsContainer}>
          <Typography.Text className={styles.menuTitle}>
            对话历史
          </Typography.Text>
          <div className={styles.conversationsScrollContainer}>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  activeConversation?.id === conversation.id ? "active" : ""
                }`}
                onClick={() => onConversationClick(conversation.id)}
              >
                {/* 编辑模式 */}
                {editingConversationId === conversation.id ? (
                  <div
                    className={styles.titleEditContainer}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      ref={inputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(conversation.id, e)}
                      className={styles.titleInput}
                      size="small"
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      className={styles.titleEditButton}
                      onClick={(e) => saveTitle(conversation.id, e)}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      className={styles.titleEditButton}
                      onClick={cancelEditing}
                    />
                  </div>
                ) : (
                  <>
                    <span className={styles.conversationTitle}>
                      {conversation.title}
                    </span>
                    <div
                      className={styles.actionButtonsContainer}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="text"
                        className={styles.editButton}
                        icon={<EditOutlined />}
                        onClick={(e) => startEditingTitle(conversation, e)}
                      />
                      <Button
                        type="text"
                        danger
                        className={styles.deleteButton}
                        icon={<DeleteOutlined />}
                        onClick={async (e) => {
                          e.stopPropagation();
                          // if (conversations.length <= 1) {
                          //   message.info("至少需要保留一个会话");
                          //   return;
                          // }

                          if (activeConversation?.id === conversation.id) {
                            const type = activeConversation.type;
                            navigate(`/${type}`);
                            setTimeout(
                              async () => { await deleteConversation(conversation.id); },
                              100
                            );
                          } else {
                            await deleteConversation(conversation.id);
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <Space className={styles.bottomLinkWrapper}>
          {/* <Tooltip title={"问题反馈"}>
            <a
              href="https://github.com/springaialibaba/spring-ai-alibaba-examples/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button icon={<FormOutlined />} />
            </a>
          </Tooltip>
          <Tooltip title={"钉钉群"}>
            <Button
              icon={<DingdingOutlined />}
              onClick={() => setIsDingTalkModalOpen(true)}
            />
          </Tooltip>

          <Tooltip title={"微信群"}>
            <Button
              icon={<WechatWorkOutlined />}
              onClick={() => setIsWeChatModalOpen(true)}
            />
          </Tooltip> */}
        </Space>

        <Modal
          title="钉钉群"
          open={isDingTalkModalOpen}
          onCancel={() => setIsDingTalkModalOpen(false)}
          onOk={() => setIsDingTalkModalOpen(false)}
          centered
        >
          <img
            src="/dingtalk.png"
            alt="钉钉群"
            style={{
              width: "100%",
              margin: "0 auto",
            }}
          />
        </Modal>

        <Modal
          title="微信群"
          open={isWeChatModalOpen}
          onCancel={() => setIsWeChatModalOpen(false)}
          onOk={() => setIsWeChatModalOpen(false)}
          centered
        >
          <img
            src="/wechat.png"
            alt="微信群"
            style={{
              width: "100%",
              textAlign: "center",
              margin: "0 auto",
            }}
          />
        </Modal>
      </div>
    </>
  );
};

export default FunctionMenu;
