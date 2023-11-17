"use client";
import React, { useState } from "react";
import { Upload, Button, Input, Form, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import PageTitle from "@/component/PageTitle";
import axios from "axios";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import Image from "next/image";

const { Dragger } = Upload;

function NewProductRegister() {
  const [productImage, setProductImage] = useState<File | null>(null);

  const dispatch = useDispatch();

  const handleFileChange = (file: File) => {
    setProductImage(file);
  };

  const onFinish = async (values: any) => {
    try {
      dispatch(SetLoading(true));

      // if(productImage){
      //     const formData = new FormData();
      //     formData.append('image', productImage)
      //     const resImage = await axios.post('/api/products/saveImage', formData, {
      //         headers: {
      //             'Content-Type': 'multipart/form-data',
      //         },
      //     })
      // }

      // console.log(values)
      const response = await axios.post("/api/products/register", values);
      message.success(response.data.message);
      // router.push("/")
    } catch (error: any) {
      message.error(error.response.data.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  return (
    <div>
      <PageTitle title="New Product" />
      <Form layout="vertical" onFinish={onFinish}>
        <div className="flex justify-center">
          <Form.Item
            label="Product Code"
            name="code"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="#A0005" />
          </Form.Item>
        </div>
        <div className="flex justify-center">
          <Form.Item
            label="Product Image"
            name="image"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Dragger
              accept=".png,.jpg,.jpeg"
              beforeUpload={(file) => {
                handleFileChange(file);
                return false; // Prevent default upload behavior
              }}
              showUploadList={false}
            >
              {productImage ? (
                <Image
                  src={URL.createObjectURL(productImage)}
                  alt="Product Image"
                  style={{ width: "100%" }}
                />
              ) : (
                <div>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag image to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for PNG, JPG, and JPEG files
                  </p>
                </div>
              )}
            </Dragger>
          </Form.Item>
        </div>

        {/* Other form inputs */}
        <div className="flex justify-center">
          <Form.Item
            label="Disposable Units"
            name="unit"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="123" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item
            label="Price Per Unit"
            name="price"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="123" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item
            label="Location"
            name="location"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="NY" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item>
            <Button type="primary" htmlType="submit" className="my-2">
              Upload
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
}

export default NewProductRegister;
