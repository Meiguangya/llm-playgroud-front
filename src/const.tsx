import {
  GlobalOutlined,
  ThunderboltOutlined,
  ReadOutlined,
  CommentOutlined,
  FireOutlined,
  HeartOutlined,
  SmileOutlined,
  RobotFilled,
  UserOutlined,
} from "@ant-design/icons";
import React from "react";
import DocSummaryPage from "./pages/DocSummaryPage";
import FunctionCallingPage from "./pages/FunctionCallingPage";
import ImageGenPage from "./pages/ImageGenPage";
import McpPage from "./pages/McpPage";
import MultiModalPage from "./pages/MultiModalPage";
import RagPage from "./pages/RagPage";
import { Bubble, Prompts, Welcome } from "@ant-design/x";
import { Space, GetProp, Tag, Typography, Image } from "antd";
import ReactMarkdown from "react-markdown";
import ChatPage from "./pages/ChatPage";
import { MenuPage } from "./stores/functionMenu.store";
import AnimatedSection from "./pages/components/AnimatedSection";

// export const BASE_URL = "/api/v1";
export const BASE_URL = "http://127.0.0.1:9001/api/v1"; // 本地开发环境的 API 基础 URL
// export const BASE_URL = "http://192.168.3.195:8090/api/v1"; // 本地开发环境的 API 基础 URL
export const DEFAULT_MODEL = "qwen-plus";
export const MAX_IMAGE_SIZE = 2048;

export const pageComponents = {
  [MenuPage.Chat]: ChatPage,
  [MenuPage.ImageGen]: ImageGenPage,
  [MenuPage.DocSummary]: DocSummaryPage,
  [MenuPage.MultiModal]: MultiModalPage,
  [MenuPage.ToolCalling]: FunctionCallingPage,
  [MenuPage.Rag]: RagPage,
  [MenuPage.Mcp]: McpPage,
  // [MenuPage.MoreExamples]: McpPage, // 暂时使用 McpPage 作为占位
} as const;

// 按钮配置列表
export const actionButtonConfig = [
  {
    key: "onlineSearch",
    label: "在线搜索",
    icon: <GlobalOutlined />,
    styleClass: "searchButton",
    baseColor: "#4096ff",
    bgColor: "#e6f4ff",
    activeColor: "#1677ff",
    description: "使用网络搜索获取最新信息",
    tipTitle: "在线搜索默认模型为 DeepSeek-R1.",
  },
  {
    key: "deepThink",
    label: "深度思考",
    icon: <ThunderboltOutlined />,
    styleClass: "thinkButton",
    baseColor: "#9254de",
    bgColor: "#f9f0ff",
    activeColor: "#722ed1",
    description: "深度分析问题并给出详细回答",
    tipTitle: "深度思考模型可以任意选择，各个模型输出效果有差异.",
  },
];

const renderTitle = (icon: React.ReactElement, title: string) => (
  <Space align="start">
    {icon}
    <span>{title}</span>
  </Space>
);

export const placeholderPromptsItems: GetProp<typeof Prompts, "items"> = [
  {
    key: "1",
    label: renderTitle(
      <ReadOutlined style={{ color: "#1890FF" }} />,
      "RAG 功能演示"
    ),
    description: "",
    children: [
      {
        key: "2-1",
        icon: <HeartOutlined />,
        description: `什么是MCP？`,
      },
      {
        key: "2-2",
        icon: <SmileOutlined />,
        description: `你认识梅光亚吗？他是谁？`,
      }
    ],
  },
  {
    key: "2",
    label: renderTitle(
      <FireOutlined style={{ color: "#FF4D4F" }} />,
      "Function Calling 功能演示（数据库查询）"
    ),
    description: "",
    children: [
      {
        key: "1-1",
        description: `当前公司有多少男性员工？`,
      },
      {
        key: "1-2",
        description: `哪些部门的员工超过100人？`,
      },
    ],
  },
];

export const defaultKey = Date.now().toString();
export const defaultConversationsItems = [
  {
    key: defaultKey,
    label: (
      <span>
        对话 1
        <Tag style={{ marginLeft: 8 }} color="green">
          {DEFAULT_MODEL}
        </Tag>
      </span>
    ),
  },
];

export const aiConfig = {
  placement: "start" as "start" | "end",
  avatar: {
    icon: <RobotFilled />,
  },
  styles: {
    content: {
      borderRadius: 16,
    },
  },
  messageRender: (content) => (
    <Typography>
      <ReactMarkdown>{content}</ReactMarkdown>
    </Typography>
  ),
};

export const roles: GetProp<typeof Bubble.List, "roles"> = {
  ai: {
    typing: { step: 5, interval: 20 },
    ...aiConfig,
  },
  aiHistory: {
    ...aiConfig,
  },
  local: {
    placement: "end",
    variant: "shadow",
    avatar: {
      icon: <UserOutlined />,
    },
  },
  file: {
    placement: "end",
    variant: "borderless",
    messageRender: (base64: string) => {
      return (
        <Image src={base64} style={{ maxHeight: 250, paddingRight: 32 }} />
      );
    },
    avatar: <></>,
  },
};

export const conversationsMap: Record<
  string,
  {
    model: string;
    messages: any[];
    params: { onlineSearch: boolean; deepThink: boolean };
  }
> = {};

// 默认会话界面
export const PlaceholderNode = ({ className, onPromptsItemClick }) => {
  return (
    <AnimatedSection>
      <Space direction="vertical" size={16} className={className}>
        <Welcome
          variant="borderless"
          icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
          title="你好，我是AI功能演示助手"
          styles={{
            description: {
              fontSize: 16,
              width: "1000px",
            },
          }}
          description="一个基于 LangChain 框架构建的 AI 助手，后端使用 FastAPI 框架，集成了RAG 和 Function Call 等功能。"
        />
        <Prompts
          // title="你想了解什么？"
          items={placeholderPromptsItems}
          styles={{
            list: {
              width: "100%",
            },
            item: {
              flex: 1,
            },
          }}
          onItemClick={onPromptsItemClick}
        />
      </Space>
    </AnimatedSection>
  );
};
