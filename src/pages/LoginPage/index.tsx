import React, { useState } from "react";
import { Button, Input, Form, Tabs, Typography } from "antd";

const { TabPane } = Tabs;

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("login");

  const onFinishLogin = (values: any) => {
    // 这里暂不处理登录逻辑
    console.log("登录表单: ", values);
  };

  const onFinishRegister = (values: any) => {
    // 这里暂不处理注册逻辑
    console.log("注册表单: ", values);
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 32, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
      <Typography.Title level={3} style={{ textAlign: "center" }}>登录 / 注册</Typography.Title>
      <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
        <TabPane tab="登录" key="login">
          <Form layout="vertical" onFinish={onFinishLogin}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}> <Input /> </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}> <Input.Password /> </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>登录</Button>
            </Form.Item>
          </Form>
        </TabPane>
        <TabPane tab="注册" key="register">
          <Form layout="vertical" onFinish={onFinishRegister}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}> <Input /> </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}> <Input.Password /> </Form.Item>
            <Form.Item label="确认密码" name="confirm" dependencies={["password"]} rules={[{ required: true, message: "请确认密码" }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) { return Promise.resolve(); } return Promise.reject(new Error("两次输入的密码不一致!")); } })]}> <Input.Password /> </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>注册</Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default LoginPage;
