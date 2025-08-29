import {
  LinkOutlined,
  GithubOutlined,
  BulbOutlined,
  BulbFilled,
  WechatWorkOutlined,
  SnippetsOutlined,
  FormOutlined,
  DingtalkOutlined,
} from "@ant-design/icons";
import {
  Tooltip,
  Layout,
  theme,
  ConfigProvider,
  App as AntdApp,
  Button,
  Space
} from "antd";
import { useStyle } from "./style";
import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { pageComponents } from "./const";
import FunctionMenu from "./pages/components/FunctionMenu";
import LoginPage from "./pages/LoginPage";
// import { Button } from "antd";
import { useTheme } from "./hooks/useTheme";
import { ThemeProvider } from "antd-style";
import TipsModalComponent from "./pages/components/TipsModal";
import { useConversationContext } from "./stores/conversation.store";

// 定义深色主题和浅色主题的算法
import darkAlgorithm from "antd/es/theme/themes/dark";
import defaultAlgorithm from "antd/es/theme/themes/default";

// 创建自定义主题配置
const customTheme = {
  token: {
    colorPrimary: "#1677ff",
    borderRadius: 6,
  },
};

const Independent: React.FC = () => {
  const { setConversations, clearActiveConversation } = useConversationContext();
  const { actualTheme, toggleTheme } = useTheme();
  const { styles } = useStyle();
  const isDark = actualTheme === "dark";

  // contact modal
  const [weChatModalVisible, setweChatModalVisible] = useState(false);
  const [dingTalkModalVisible, setDingTalkModalVisible] = useState(false);

  const showDingTalkModal = () => {
    setDingTalkModalVisible(true);
  };

  const showWeChatModal = () => {
    setweChatModalVisible(true);
  };

  // 根据当前主题设置body背景色
  useEffect(() => {
    document.body.style.backgroundColor = isDark ? "#141414" : "#ffffff";
    if (isDark) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [isDark]);

  const navigate = window.location.hash
    ? (path: string) => {
        window.location.hash = `#${path}`;
      }
    : (path: string) => {
        window.location.pathname = path;
      };

  // 登录状态与用户信息
  const [user, setUser] = useState<{ username?: string } | null>(null);
  useEffect(() => {
    // 检查本地token和用户名
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser({ username });
    } else {
      setUser(null);
    }
  }, []);

  // 退出登录
  const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('username');
  localStorage.removeItem('app_conversations'); // 清除本地会话缓存
  setUser(null);
  setConversations([]);
  clearActiveConversation();
  navigate('/login');
  };

  // ==================== Render =================
  return (
    <>
      <TipsModalComponent
        way="WeChat"
        imageLink="dingtalk.png"
        isVisible={dingTalkModalVisible}
        setModalVisible={setDingTalkModalVisible}
      />
      <TipsModalComponent
        way="dingTalk"
        imageLink="wechat.png"
        isVisible={weChatModalVisible}
        setModalVisible={setweChatModalVisible}
      />
      <Space className={styles.topLinkWrapper}>
        <Tooltip title={isDark ? "切换到亮色模式" : "切换到暗色模式"}>
          <Button
            className="theme-toggle-btn"
            icon={isDark ? <BulbFilled /> : <BulbOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>
        {/* <Tooltip title={"spring-ai-alibaba-examples link"}>
          <a
            href="https://github.com/springaialibaba/spring-ai-alibaba-examples"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button icon={<SnippetsOutlined />} />
          </a>
        </Tooltip>
        <Tooltip title={"spring-ai-alibaba link"}>
          <a
            href="https://github.com/alibaba/spring-ai-alibaba"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button icon={<GithubOutlined />} />
          </a>
        </Tooltip>
        <Tooltip title={"官方文档"}>
          <a
            href="https://java2ai.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button icon={<LinkOutlined />} />
          </a>
        </Tooltip> */}
      </Space>

      <div className={styles.layout} style={{ position: 'relative' }}>
        <FunctionMenu />
        {/* 左下角登录/用户信息按钮 */}
        <div
          style={{
            position: 'absolute',
            left: 24,
            bottom: 24,
            zIndex: 1000,
            width: 160,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}
        >
          {user && user.username ? (
            <>
              <span style={{ fontWeight: 500 }}>{user.username}</span>
              <Button size="small" onClick={handleLogout}>退出登录</Button>
            </>
          ) : (
            <Button
              type="primary"
              style={{ width: 120 }}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
          )}
        </div>
        {/* 菜单页面容器 */}
        <div className={styles.menuPagesWrapper}>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/login" element={<LoginPage />} />
            {Object.entries(pageComponents).map(([key, Component]) => (
              <React.Fragment key={key}>
                {/* 类页面路由 */}
                <Route
                  path={`/${key}`}
                  element={
                    <div className={styles.pageWrapper}>
                      <Component />
                    </div>
                  }
                />
                {/* 实例页面路由 */}
                <Route
                  path={`/${key}/:conversationId`}
                  element={
                    <div className={styles.pageWrapper}>
                      <Component />
                    </div>
                  }
                />
              </React.Fragment>
            ))}
          </Routes>

          <Layout.Footer className={styles.footer}>
            © 2024-2025 项目演示使用
          </Layout.Footer>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        ...customTheme,
        algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <AntdApp>
        <ThemeProvider
          appearance={actualTheme}
          themeMode={actualTheme}
          theme={customTheme}
        >
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Independent />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
