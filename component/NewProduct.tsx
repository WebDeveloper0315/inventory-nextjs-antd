/* eslint-disable tailwindcss/no-custom-classname */
"use client";
import React, { useState } from "react";
import { Upload, Button, Image, Input, Form, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import axios from "axios";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";

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
      delete values.image;
      // console.log('before get api ',values)

      const isExist = await axios.get(
        `/api/products/register?productCode=${values.code}`
      );

      // console.log(isExist)

      if (isExist.status === 200 && productImage) {
        const formData = new FormData();
        formData.append("image", productImage);
        
        const resImage = await axios.post("/api/products/saveImage", formData);

        if (resImage.status === 201) {
          // console.log("adadsf", resImage);
          // const responseData = await resImage.data.json()
          const finalFilePath = resImage.data.httpfilepath;

          values.imagePath = finalFilePath;
          delete values.image;
          const response = await axios.post("/api/products/register", values);
          message.success(response.data.message);
        } else {
          // Handle the case when the response is not ok
          console.error("Error while uploading the image");
        }
        // console.log("resImage", resImage);
      } else if (isExist.status === 201) {
        message.info("Selected Product exists. Try again!");
      }
    } catch (error: any) {
      console.log("error during product registering", error);
      message.error(error.response.data.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  return (
    <div>
      {/* <PageTitle title='New Product' /> */}
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
            label="Units to Buying"
            name="units"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="Input the units to buy" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item
            label="Price Per Unit"
            name="pricePerUnit"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="Input the price per unit" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item
            label="Market Place"
            name="market"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="Market where you bought" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item
            label="Tax(%)"
            name="taxes"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="Tax(%)" />
          </Form.Item>
        </div>

        <div className="flex justify-center">
          <Form.Item
            label="Location"
            name="location"
            className="sm:w-1/2 md:w-1/3 lg:w-1/4"
          >
            <Input placeholder="location where you want to store" />
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
