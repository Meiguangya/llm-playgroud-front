
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";


const RegisterForm: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const onFinishRegister = async (values: any) => {
        console.log('注册表单提交', values);
        try {
            const res = await fetch("http://localhost:9001/api/v1/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password,
                    email: values.email,
                }),
            });
            const data = await res.json();
            if (data.code === 200) {
                message.success(data.data?.message || "注册成功");
                // 保存token和用户名到localStorage
                if (data.data?.access_token) {
                    localStorage.setItem('access_token', data.data.access_token);
                }
                if (data.data?.username) {
                    localStorage.setItem('username', data.data.username);
                }
                // 跳转到主页面
                setTimeout(() => {
                    navigate('/');
                }, 800);
            } else {
                message.error(data.message || "注册失败");
            }
        } catch (e) {
            message.error("注册请求失败");
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={onFinishRegister}>
            <Form.Item label="用户名" name="username"><Input autoComplete="username" allowClear /></Form.Item>
            <Form.Item label="邮箱" name="email"><Input autoComplete="email" allowClear /></Form.Item>
            <Form.Item label="密码" name="password"><Input.Password autoComplete="new-password" allowClear /></Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" block>注册</Button>
            </Form.Item>
        </Form>
    );
};

export default RegisterForm;
