'use client'
import PageTitle from "@/component/PageTitle";
import { Button, Form, Image, Input, Popconfirm, Tooltip, message } from "antd";
import React, { useState } from "react";
import { InfoCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import axios from "axios";


function Returning() {
  const dispatch = useDispatch();
  const [imageUrl, setImageUrl] = useState("");
  const [addUnits, setAddUnits] = useState(false);
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showPopconfirm = () => {
    setOpen(true);
  };

  const handleOk = async (formValues: any) => {
    try {
      setConfirmLoading(true);
      console.log("returning.tsx onFinish", formValues);
      const response = await axios.post(
        "api/products/recording?returning=1",
        formValues
      );
      console.log(response);
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
      setOpen(false);
      setConfirmLoading(false);
    }
    
  };

  const handleCancel = () => {
    console.log('Clicked cancel button');
    setOpen(false);
  };

  const onShowUnits = () => {
    setAddUnits(true);
  };

  const onHideUnits = () => {
    setAddUnits(false);
    setImageUrl("");
    // onHide()
  };

  const handleSubmit = async (code: string) => {
    try {
      setConfirmLoading(true);
      const encodedCode = encodeURIComponent(code);
      const response = await axios.get(
        `api/products/check?code=${encodedCode}`
      );

      const url = response.data?.data?.product?.productImage;
      setImageUrl(url);
      setAddUnits(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setOpen(false)
      setConfirmLoading(false);
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
      console.log("returning.tsx onFinish", values);
      const response = await axios.post(
        "api/products/recording?returning=1",
        values
      );
      console.log(response);
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
      <PageTitle title="Return Item" />
      <div>
        <Form layout="vertical" onFinish={onFinish} form={form}>
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
              {/* {imageUrl && <BuyingUnits imageUrl={imageUrl} onHide={onHideBuyingUnits} />} */}
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
                          label="Sell Price"
                          name="pricePerUnit"
                          className="my-3"
                        >
                          <Input placeholder="Sell Price" />
                        </Form.Item>

                        <Form.Item
                          label="Returning Number"
                          name="units"
                          className="my-3"
                        >
                          <Input placeholder="Input the number to return" />
                        </Form.Item>

                        <Form.Item
                          label="Market Place"
                          name="market"
                          className=" my-3 w-auto"
                        >
                          <Input placeholder="MarketPlace" />
                        </Form.Item>

                        <Popconfirm
                          title="Confirm Returning"
                          description="Are you sure return this item?"
                          open={open}
                          onConfirm={() => handleOk(form.getFieldsValue())}
                          
                          okButtonProps={{ loading: confirmLoading }}
                          onCancel={handleCancel}
                          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                          className="my-3"
                        >
                          <Button
                          type="primary"
                          onClick={showPopconfirm}
                          // htmlType="submit"
                          // className="my-3"
                          block
                          >
                            Confirm
                          </Button>
                        </Popconfirm>
                        
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

export default Returning;
