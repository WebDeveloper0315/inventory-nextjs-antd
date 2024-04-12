import {
  Button,
  Form,
  Image,
  Input,
  Table,
  TableColumnsType,
  Tooltip,
  message,
} from "antd";
import React, { useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import axios from "axios";

interface DataType {
  key: React.ReactNode;
  field: string;
  value: number;
  children?: DataType[];
}

function OneGraph() {
  const dispatch = useDispatch();
  const [imageUrl, setImageUrl] = useState("");
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [queryCode, setQueryCode] = useState("");

  const handleSubmit = async (code: string) => {
    try {
      dispatch(SetLoading(true));
      setQueryCode(code);
      const encodedCode = encodeURIComponent(code);
      const response = await axios.get(
        `api/products/check?code=${encodedCode}`
      );

      const url = response.data?.data?.product?.productImage;
      setImageUrl(url);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const [addUnits, setAddUnits] = useState(false);

  const onHideUnits = () => {
    setAddUnits(false);
    setImageUrl("");
    // onHide()
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event.currentTarget.value);
    }
  };

  const onFinish = async () => {
    try {
      dispatch(SetLoading(true));
      // console.log("OneGraph.tsx onFinish", queryCode);
      const response = await axios.get(
        `/api/products/queryOne?popCode=${queryCode}`
      );
      // console.log(response);
      if (response.status === 201) {
        const childrenData = response.data.stockData.map((stock: any, index: number) => ({
          key: index + 11,
          field: stock.location,
          value: stock.stocks,
        }));
        setTableData([
          {
            key: 1,
            field: "Units Remaining",
            value: response.data.unitsRemaining,
            children: childrenData,
          },
          { key: 2, field: "Units Sold", value: response.data.unitsSold },
          {
            key: 3,
            field: "Units Returned",
            value: response.data.unitsReturned,
          },
          { key: 4, field: "Units Trashed", value: response.data.unitsTrashed },
          {
            key: 5,
            field: "Average Buy Price",
            value: response.data.averageBuyPrice,
          },
          {
            key: 6,
            field: "Average Sell Price",
            value: response.data.averageSellPrice,
          },
          {
            key: 7,
            field: "Product Profit",
            value: response.data.profitProduct,
          },
          { key: 8, field: "Sale Profit", value: response.data.profitSale },
          {
            key: 9,
            field: "Total Money in tax",
            value: response.data.totalMoneyInTax,
          },
        ]);
        // message.success(response.data.message);
      } else {
        message.error(response.data.message || "Something Went Wrong!");
      }
      setAddUnits(true);
    } catch (error: any) {
      // console.log(error)
      message.error("Something went wrong");
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "Field",
      dataIndex: "field",
      key: "field",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <div>
      <Form layout="vertical">
        <div className="flex w-full justify-center">
          <Form.Item label="Product Code" name="code" className="w-full">
            <Input
              placeholder="#A0005"
              onPressEnter={handleEnterPress}
              suffix={
                <Tooltip title="Press Enter Key after entering...">
                  <InfoCircleOutlined
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  />
                </Tooltip>
              }
            />
          </Form.Item>
        </div>
        <div className="flex w-full justify-center">
          <div>
            {/* {imageUrl && <BuyingUnits imageUrl={imageUrl} onHide={onHideBuyingUnits} />} */}
            {imageUrl && (
              <div className="flex w-full flex-col items-center justify-center">
                <div className="flex w-full  flex-col items-center">
                  <p>Is this product?</p>
                  <Image
                    src={`/api/image?key=${imageUrl}`}
                    alt="Product Image"
                  />
                </div>
                <div className="flex flex-row items-center">
                  <Button
                    type="primary"
                    style={{ margin: "10px" }}
                    onClick={onFinish}
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

                <div className="w-full">
                  {addUnits && (
                    <div className="my-3">
                      <Table
                        columns={columns}
                        dataSource={tableData}
                        pagination={false}
                      />
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

export default OneGraph;
