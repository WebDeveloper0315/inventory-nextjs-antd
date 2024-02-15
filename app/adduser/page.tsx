"use client";
import PageTitle from "@/component/PageTitle";
import { SetLoading } from "@/redux/loadersSlice";
import { Button, Checkbox, Form, Input, Tooltip, message } from "antd";
import axios from "axios";
import React from "react";
import { useDispatch } from "react-redux";
import { InfoCircleOutlined } from "@ant-design/icons";
import { CheckboxValueType } from "antd/es/checkbox/Group";

function AddUser() {
  // const {currentUser} = useSelector((state: any) => state.users)
  const dispatch = useDispatch();

  const onChange = (checkedValues: CheckboxValueType[]) => {
    console.log("checked = ", checkedValues);
  };

  const onFinish = async (values: any) => {
    try {
      dispatch(SetLoading(true));
      const response = await axios.post("/api/users/register", values);
      if (response.status === 201) {
        message.success(
          "User Created Successfully. The user who you created can login for now."
        );
      }
    } catch (error: any) {
      message.error(error.response.data.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };
  return (
    <div>
      <PageTitle title="Add User" />
      <Form layout="vertical" onFinish={onFinish}>
        <div className="my-3 flex justify-center">
          <Form.Item
            label="Name"
            name="name"
            className="w-full sm:w-1/2"
          >
            <Input
              placeholder="Enter your username"
              suffix={
                <Tooltip title="You can login with the name.">
                  <InfoCircleOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
                </Tooltip>
              }
            />
          </Form.Item>
        </div>
        <div className="my-3 flex justify-center">
          <Form.Item
            label="Password"
            name="password"
            className="w-full sm:w-1/2"
            rules={[
              { required: true, message: "Please input your password!" },
              // Add any other password validations here
            ]}
          >
            <Input.Password
              placeholder="Input Password"
              // iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
        </div>
        <div className="my-3 flex justify-center">
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            className="w-full sm:w-1/2"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new TypeError("The two passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm Password"
              // iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
        </div>
        <div className="mx-5 my-3 flex justify-center">
          <Form.Item
            label="Select the user's authority"
            name="userAuthority"
            className="w-full sm:w-1/2"
          >
            <Checkbox.Group
              style={{ width: "100%", display: "grid" }}
              onChange={onChange}
            >
              <Checkbox value="newProduct">New Product</Checkbox>
              <Checkbox value="sold">Sold</Checkbox>
              <Checkbox value="returning">Item Return</Checkbox>
              <Checkbox value="query">Query</Checkbox>
              <Checkbox value="addUser">Add User</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </div>

        <div className="my-3 flex justify-center">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full sm:w-1/2"
          >
            Create
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default AddUser;
