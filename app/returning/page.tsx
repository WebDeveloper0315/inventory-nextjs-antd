"use client";
import PageTitle from "@/component/PageTitle";
import {
  Button,
  Form,
  Image,
  Input,
  Select,
  Tooltip,
  message,
  Modal,
  Table,
} from "antd";
import React, { useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import axios from "axios";
import type { TableRowSelection } from "antd/lib/table/interface";

interface tableDataItem {
  key: Number;
  CreatedAt: Date;
  pricePerUnit: Number;
  units: Number;
  market: String;
  taxes: Number;
  location: String;
}

function Returning() {
  const dispatch = useDispatch();
  const [imageUrl, setImageUrl] = useState("");
  const [productCode, setproductCode] = useState("");
  const [addUnits, setAddUnits] = useState(false);
  const [form] = Form.useForm();

  const [open, setOpen] = useState(false);
  const [confirmLoadingStore, setConfirmLoadingStore] = useState(false);
  const [confirmLoadingBin, setConfirmLoadingBin] = useState(false);
  const [locations, setLocations] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedRow, setSelectedRow] = useState<any>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>();
  const { Option } = Select;

  const showPopconfirm = () => {
    setOpen(true);
  };

  const rowSelection: TableRowSelection<tableDataItem> = {
    type: "radio", // Allow single row selection
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRow(selectedRows);
      console.log("selectedRows")
    },
    selectedRowKeys,
    onSelect: (
      record: any,
      selected: boolean,
      selectedRows: any,
      nativeEvent: Event
    ) => {
      // Update the state with the selected row data
      setSelectedRow(record);
    },
  };

  React.useEffect(() => {
    if (selectedRow) {
      // Update the form fields with selected row data
      form.setFieldsValue({
        pricePerUnit: selectedRow.pricePerUnit,
        market: selectedRow.market,
        location: selectedRow.location,
        // Add more fields as needed
      });
    }
  }, [selectedRow, form]);

  const handleBin = async (formValues: any) => {
    try {
      setConfirmLoadingBin(true);
      console.log("returning.tsx onFinish", formValues);
      const response = await axios.post(
        "api/products/recording?returning=bin",
        formValues
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
      setOpen(false);
      setConfirmLoadingBin(false);
    }
  };

  const handleStore = async (formValues: any) => {
    try {
      setConfirmLoadingStore(true);
      // console.log("returning.tsx onFinish", formValues);
      const response = await axios.post(
        "api/products/recording?returning=store",
        formValues
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
      setOpen(false);
      setConfirmLoadingStore(false);
    }
  };

  const getSellingHistory = async (values: any) => {
    try {
      dispatch(SetLoading(true));
      console.log("OK", values);
      const response = await axios.get(
        `api/products/recording?returning=${productCode}`,
        values
      );

      console.log(response);

      const stockData = response.data?.data?.historyData;
      setTableData(stockData);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const handleCancel = () => {
    // console.log("Clicked cancel button");
    setOpen(false);
  };

  const onShowUnits = async () => {
    try {
      dispatch(SetLoading(true));
      const response = await axios.get("api/locations");
      // console.log(response.data.locations);
      const locationsArray = response.data?.locations;

      const formattedLocations = locationsArray.map(
        (location: { location: any }) => {
          return location.location;
        }
      );
      setLocations(formattedLocations);
      await getSellingHistory("asd");
      setAddUnits(true);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const onHideUnits = () => {
    setAddUnits(false);
    setImageUrl("");
    // onHide()
  };

  const handleSubmit = async (code: string) => {
    try {
      dispatch(SetLoading(true));
      const encodedCode = encodeURIComponent(code);
      const response = await axios.get(
        `api/products/check?code=${encodedCode}`
      );

      const url = response.data?.data?.product?.productImage;

      setproductCode(code);
      setImageUrl(url);
      setAddUnits(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setOpen(false);
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
      // console.log("returning.tsx onFinish", values);
      const response = await axios.post(
        "api/products/recording?returning=1",
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

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: Date) => (
        <span>{new Date(createdAt).toISOString().replace(/T/, ' ').replace(/\..+/, '')}</span>
      ),
    },
    {
      title: "Price Per Unit",
      dataIndex: "pricePerUnit",
      key: "value",
    },
    {
      title: "Units",
      dataIndex: "units",
      key: "value",
    },
    {
      title: "Market",
      dataIndex: "market",
      key: "value",
    },
    {
      title: "Taxes(%)",
      dataIndex: "taxes",
      key: "value",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "value",
    },
  ];

  return (
    <div>
      <PageTitle title="Return Item" />
      <div>
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <div className="flex justify-center">
            <Form.Item
              label="Product Code"
              name="code"
              className="w-full sm:w-1/2"
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
            {/* <div className="sm:w-1/2 md:w-1/3 lg:w-1/4"> */}
            {/* {imageUrl && <BuyingUnits imageUrl={imageUrl} onHide={onHideBuyingUnits} />} */}
            {imageUrl && (
              <div className="flex flex-col items-center">
                <div className="flex w-full flex-col items-center sm:w-1/2">
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
                    <>
                      <div className="my-3">
                        <h1>Selling History of {productCode} Product</h1>
                        <hr />
                        <Table
                          columns={columns}
                          rowSelection={rowSelection}
                          dataSource={tableData}
                          pagination={false}
                          onRow={(record, rowIndex) => {
                            return {
                              onClick: event => {
                                setSelectedRowKeys([record.key]);
                                setSelectedRow(record);
                              }
                            }
                          }}  
                        />
                      </div>
                      <div>
                        <Form.Item
                          label="Sold Price"
                          name="pricePerUnit"
                          className="my-3"
                        >
                          <Input placeholder="Sold Price" />
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

                        <Form.Item
                          label="Location"
                          name="location"
                          className=" my-3 w-auto"
                        >
                          <Select placeholder="Select a location">
                            {locations.map((location: any, index: any) => (
                              <Option key={index} value={location}>
                                {location}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        {/* <Popconfirm
                            title="Confirm Returning"
                            description="Are you sure return this item?"
                            open={open}
                            onConfirm={() => handleOk(form.getFieldsValue())}
                            okButtonProps={{ loading: confirmLoading }}
                            onCancel={handleCancel}
                            icon={
                              <QuestionCircleOutlined style={{ color: "red" }} />
                            }
                            className="my-3"
                          > */}
                        <Button
                          type="primary"
                          onClick={showPopconfirm}
                          // htmlType="submit"
                          className="my-3"
                          block
                        >
                          Confirm
                        </Button>
                        <Modal
                          open={open}
                          title="Confirm Returning"
                          onOk={handleStore}
                          onCancel={handleCancel}
                          centered
                          footer={[
                            <Button
                              key="submit"
                              type="primary"
                              loading={confirmLoadingStore}
                              onClick={() => handleStore(form.getFieldsValue())}
                            >
                              Yes(To the Store)
                            </Button>,
                            <Button
                              key="submit"
                              type="primary"
                              loading={confirmLoadingBin}
                              onClick={() => handleBin(form.getFieldsValue())}
                              danger
                            >
                              Yes(To the Bin)
                            </Button>,
                            <Button key="back" onClick={handleCancel}>
                              No
                            </Button>,
                          ]}
                        >
                          <p>Are you sure return this item?</p>
                        </Modal>
                        {/* </Popconfirm> */}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* </div> */}
          </div>
        </Form>
      </div>
    </div>
  );
}

export default Returning;
