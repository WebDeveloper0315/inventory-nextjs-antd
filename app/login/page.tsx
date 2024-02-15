"use client";
import React from "react";
import Image from "next/image";
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
    <>
      <div className="h-screen bg-gray-900">
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="text-center sm:mx-auto sm:w-full sm:max-w-sm">
            <Image
              className="mx-auto h-10 w-auto"
              src={{
                src: "/image/logo.svg",
                width: 50, 
                height: 50, 
              }}
              alt="Your Company"
            />
            <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-white">
              Inventory Management - Login
            </h2>
          </div>

          <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
            <Form layout="vertical" className="space-y-6" onFinish={onFinish}>
              <Form.Item label="Name or ID" name="name">
                <Input
                  placeholder="Enter your username"
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  suffix={
                    <Tooltip title="You can login with the name.">
                      <InfoCircleOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
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
      </div>
    </>
    // <div className="bg-primary flex h-screen items-center justify-center">
    //   <div className="card w-450 p-5">
    //     <h1 className="text-xl">Inventory Management - Login</h1>
    //     <hr />
    //     <Form
    //       layout="vertical"
    //       className="flex flex-col gap-5"
    //       onFinish={onFinish}
    //     >
    //       <Form.Item label="Name" name="name">
    //         <Input
    //           placeholder="Enter your username"
    //           prefix={<UserOutlined className="site-form-item-icon" />}
    //           suffix={
    //             <Tooltip title="You can login with the name.">
    //               <InfoCircleOutlined style={{ color: "rgba(0,0,0,.45)" }} />
    //             </Tooltip>
    //           }
    //         />
    //       </Form.Item>

    //       <Form.Item label="Password" name="password">
    //         <Input.Password
    //           placeholder="Input Password"
    //           iconRender={(visible) =>
    //             visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
    //           }
    //         />
    //       </Form.Item>

    //       <Button type="primary" htmlType="submit" block>
    //         Login
    //       </Button>
    //     </Form>
    //   </div>
    // </div>
  );
}
