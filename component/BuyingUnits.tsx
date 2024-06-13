"use client";
import { SetLoading } from "@/redux/loadersSlice";
import { Button, Form, Image, Input, Tooltip, message } from "antd";
import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { InfoCircleOutlined } from "@ant-design/icons";

function NewUnits() {
  const dispatch = useDispatch();
  const [imageUrl, setImageUrl] = useState("");
  // const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN;
  const PATH = process.env.NEXT_PUBLIC_IMAGES_PATH;

  console.log("PATH", PATH);

  const handleSubmit = async (code: string) => {
    try {
      dispatch(SetLoading(true));
      // Perform the product code check here
      //   const productCode = values?.target?.value || '';
      const encodedCode = encodeURIComponent(code);
      const response = await axios.get(
        `api/products/check?code=${encodedCode}`
      );

      const url = response.data?.data?.product?.productImage;
      // console.log("URL ", response);
      // const fullImageUrl = `${PATH}/${url}`;
      setImageUrl(url);
      setAddUnits(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const [addUnits, setAddUnits] = useState(false);

  const onShowUnits = () => {
    setAddUnits(true);
  };

  const onHideUnits = () => {
    setAddUnits(false);
    setImageUrl("");
    // onHide()
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const code = (event.currentTarget as HTMLInputElement).value;
      handleSubmit(code);
    }
  };

  const onFinish = async (values: any) => {
    try {
      dispatch(SetLoading(true));
      // console.log("NewUnits.tsx onFinish", values);
      const response = await axios.post(
        "api/products/recording?buying=1",
        values
      );
      // console.log(response);
      if (response.data.success === true) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message || "Something Went Wrong!");
      }
      setImageUrl("");
    } catch (error: any) {
      // console.log(error)
      message.error("Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };
  return (
    <div>
      <Form layout="vertical" onFinish={onFinish}>
        <div className="flex justify-center">
          <Form.Item
            label="Product Code"
            name="code"
            className="w-full lg:w-1/2"
          >
            <Input
              placeholder="#A0005"
              onPressEnter={handleEnterPress}
              suffix={
                <Tooltip title="Press Enter Key after entering...">
                  <InfoCircleOutlined style={{ color: "rgba(255,255,255,0.45)" }} />
                </Tooltip>
              }
            />
          </Form.Item>
        </div>
        <div className="flex justify-center ">
          <div className="w-full lg:w-1/2">
            {/* {imageUrl && <BuyingUnits imageUrl={imageUrl} onHide={onHideBuyingUnits} />} */}
            {imageUrl && (
              <div className="flex flex-col items-center">
                <div className="flex w-auto flex-col items-center">
                  <p>Is this product?</p>
                  <Image
                    src={`/api/image?key=${imageUrl}`}
                    className="w-full"
                    alt="Product Image"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                  {/* <img src={`/api/image?key=${imageUrl}`} className="w-full"/> */}
                </div>
                <div className="flex flex-row items-center">
                  <Button
                    type="primary"
                    style={{ margin: "10px", width: "150px" }}
                    onClick={onShowUnits}
                  >
                    Yes
                  </Button>
                  <Button
                    type="default"
                    style={{ margin: "10px", width: "150px" }}
                    onClick={onHideUnits}
                  >
                    No
                  </Button>
                </div>

                <div className=" w-auto">
                  {addUnits && (
                    <div>
                      <Form.Item
                        label="Units to buy"
                        name="units"
                        className=" my-3 w-auto"
                      >
                        <Input placeholder="Input units to buy" />
                      </Form.Item>
                      <Form.Item
                        label="Price per Unit"
                        name="pricePerUnit"
                        className="my-3"
                      >
                        <Input placeholder="Input price per unit" />
                      </Form.Item>

                      <Form.Item
                        label="Market"
                        name="market"
                        className="my-3"
                      >
                        <Input placeholder="Market PlaceMarket where you bought" />
                      </Form.Item>

                      <Form.Item
                        label="Tax (%)"
                        name="taxes"
                        className="my-3"
                      >
                        <Input placeholder="Tax (%)" />
                      </Form.Item>

                      <Form.Item
                        label="Location"
                        name="location"
                        className="my-3"
                      >
                        <Input placeholder="location where you want to store" />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        className="my-3"
                        block
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}

export default NewUnits;
