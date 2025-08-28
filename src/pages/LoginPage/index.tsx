import React, { useState } from "react";
import { Button, Input, Form, Tabs, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import RegisterForm from "./RegisterForm";

const { TabPane } = Tabs;

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("login");

  const navigate = useNavigate();
  const onFinishLogin = async (values: any) => {
    try {
      const res = await fetch("http://localhost:9001/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });
      const data = await res.json();
      if (data.code === 200 && data.data?.token?.access_token) {
        localStorage.setItem('access_token', data.data.token.access_token);
        // 保存用户名
        if (data.data?.user?.username) {
          localStorage.setItem('username', data.data.user.username);
        }
        message.success(data.message || '登录成功');
        setTimeout(() => {
          navigate('/');
        }, 800);
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (e) {
      message.error('登录请求失败');
    }
  };


  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 32, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
      <Typography.Title level={3} style={{ textAlign: "center" }}>登录 / 注册</Typography.Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        items={[
          {
            label: '登录',
            key: 'login',
            children: (
              <Form layout="vertical" onFinish={onFinishLogin} autoComplete="off">
                <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}> 
                  <Input autoComplete="off" allowClear />
                </Form.Item>
                <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}> 
                  <Input.Password autoComplete="off" allowClear />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>登录</Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            label: '注册',
            key: 'register',
            children: <RegisterForm />,
          },
        ]}
      />
    </div>
  );
};

export default LoginPage;
