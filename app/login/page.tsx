"use client";
import React from "react";
import { Button, Form, message, Input, Tooltip } from "antd";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";

export default function Login() {
  const dispatch = useDispatch();
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      dispatch(SetLoading(true));
      const response = await axios.post("/api/users/login", values);
      message.success(response.data.message);
      router.push("/");
    } catch (error: any) {
      message.error(error.response.data.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  return (
    <div className="bg-primary flex h-screen items-center justify-center">
      <div className="card w-450 p-5">
        <h1 className="text-xl">Inventory Management - Login</h1>
        <hr />
        <Form
          layout="vertical"
          className="flex flex-col gap-5"
          onFinish={onFinish}
        >
          <Form.Item label="Name" name="name">
            <Input
              placeholder="Enter your username"
              prefix={<UserOutlined className="site-form-item-icon" />}
              suffix={
                <Tooltip title="You can login with the name.">
                  <InfoCircleOutlined style={{ color: "rgba(0,0,0,.45)" }} />
                </Tooltip>
              }
            />
          </Form.Item>

          <Form.Item label="Password" name="password">
            <Input.Password
              placeholder="Input Password"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form>
      </div>
    </div>
  );
}
