"use client";
import PageTitle from "@/component/PageTitle";
import { Button, Form, Image, Input, Tooltip, message, Select } from "antd";
import React, { useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import axios from "axios";

function Sold() {
  const dispatch = useDispatch();
  const [imageUrl, setImageUrl] = useState("");
  const [addUnits, setAddUnits] = useState(false);
  const [locations, setLocations] = useState([]);
  const { Option } = Select;

  const onShowUnits = () => {
    setAddUnits(true);
  };

  const onHideUnits = () => {
    setAddUnits(false);
    setImageUrl("");
  };

  const handleSubmit = async (code: string) => {
    try {
      dispatch(SetLoading(true));
      const encodedCode = encodeURIComponent(code);
      const response = await axios.get(
        `api/products/check?code=${encodedCode}`
      );
      // console.log(response);
      const url = response.data?.data?.product?.productImage;
      setImageUrl(url);

      const locationArray = response.data?.data?.stockData;
      const formattedLocations = locationArray.map(
        (locationData: { location: any; stocks: any }) => {
          return `${locationData.location}(${locationData.stocks})`;
        }
      );
      setLocations(formattedLocations);
      // console.log(formattedLocations);

      setAddUnits(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event.currentTarget.value);
    }
  };

  const onFinish = async (values: any) => {
    try {
      dispatch(SetLoading(true));
      // console.log("SoldUnits.tsx onFinish", values);
      const response = await axios.post(
        "api/products/recording?selling=1",
        values
      );
      // console.log(response);
      if (response.status === 201) {
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
      <PageTitle title="Sold" />
      <div>
        <Form layout="vertical" onFinish={onFinish}>
          <div className="flex justify-center">
            <Form.Item
              label="Product Code"
              name="code"
              className="sm:w-1/2 md:w-1/3 lg:w-1/4"
            >
              <Input
                placeholder="#A0005"
                onPressEnter={handleEnterPress}
                suffix={
                  <Tooltip title="Press Enter Key after entering...">
                    <InfoCircleOutlined style={{ color: "rgba(0,0,0,.45)" }} />
                  </Tooltip>
                }
              />
            </Form.Item>
          </div>
          <div className="flex justify-center ">
            <div className="sm:w-1/2 md:w-1/3 lg:w-1/4">
              {imageUrl && (
                <div className="flex flex-col items-center">
                  <div className="flex w-auto flex-col items-center">
                    <p>Is this product?</p>
                    <Image
                      src={imageUrl}
                      className="w-auto"
                      alt="Product Image"
                    />
                  </div>
                  <div className="flex flex-row items-center">
                    <Button
                      type="primary"
                      style={{ margin: "10px" }}
                      onClick={onShowUnits}
                    >
                      Yes
                    </Button>
                    <Button
                      type="default"
                      style={{ margin: "10px" }}
                      onClick={onHideUnits}
                    >
                      No
                    </Button>
                  </div>

                  <div className=" w-auto">
                    {addUnits && (
                      <div>
                        <Form.Item
                          label="Location"
                          name="location"
                          className="my-3 w-auto"
                        >
                          <Select placeholder="Select a location">
                            {locations.map((location, index) => (
                              <Option key={index} value={location}>
                                {location}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          label="Selling Units"
                          name="units"
                          className=" my-3 w-auto"
                        >
                          <Input placeholder="units to sell" />
                        </Form.Item>
                        <Form.Item
                          label="Price per Unit"
                          name="pricePerUnit"
                          className="my-3"
                        >
                          <Input placeholder="Price per unit" />
                        </Form.Item>
                        <Form.Item
                          label="Market Place"
                          name="market"
                          className=" my-3 w-auto"
                        >
                          <Input placeholder="Market where you are selling" />
                        </Form.Item>
                        <Form.Item
                          label="Taxes(%)"
                          name="taxes"
                          className=" my-3 w-auto"
                        >
                          <Input placeholder="Tax" />
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
    </div>
  );
}

export default Sold;
