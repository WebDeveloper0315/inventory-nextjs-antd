import {
  Button,
  Form,
  Input,
  Tooltip,
  message,
  Checkbox,
  Space,
  Table,
} from "antd";
import React, { useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import axios from "axios";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

const { TextArea } = Input;

function LocationGraph() {
  // const tableRef: MutableRefObject<null | HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [locationChangeEnabled, setLocationChangeEnabled] = useState(false);
  const [description, setDescription] = useState("");
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(false);
  const [locationInfo, setLocationInfo] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [submitButtonEnabled, setSubmitButtonEnabled] = useState(false);
  const [stockData, setStockData] = useState();

  const handleSubmit = async (code: string) => {
    try {
      dispatch(SetLoading(true));

      const response = await axios.get(`api/products/check?location=${code}`);

      console.log("LocationGraph.tsx", response);
      const descriptionData = response.data?.data?.locationData?.description;
      setDescription(descriptionData);
      setLocationInfo(code);

      const stockData = response.data?.data?.stockData;
      console.log(stockData);

      setStockData(stockData);
    } catch (error: any) {
      message.error(
        "The location information you entered is not correct or not in database. Please check again!"
      );
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const onSaveDescription = async () => {
    try {
      const response = await axios.post(`api/locations`, {
        updating: description,
        locationMessage: locationInfo,
        status: "description",
      });
      if (response.status === 201) {
        message.success("Location Description saved successfully");
        setSaveButtonEnabled(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const onSubmitChangeLocation = async () => {
    try {
      const response = await axios.post(`api/locations`, {
        updating: newLocation,
        locationMessage: locationInfo,
        status: "change",
      });
      if (response.status === 201) {
        message.success("Location Information changed successfully");
        setSubmitButtonEnabled(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit(event.currentTarget.value);
    }
  };

  const columns = [
    {
      title: "Product Code",
      dataIndex: "productCode",
      key: "field",
    },
    {
      title: "Price Per Unit",
      dataIndex: "pricePerUnit",
      key: "value",
    },
    {
      title: "Stocks",
      dataIndex: "stocks",
      key: "value",
    },
  ];

  const onDescriptionChange = (e: CheckboxChangeEvent) => {
    setDescriptionEnabled(e.target.checked);
    console.log(`checked = ${e.target.checked}`);
  };

  const onLocationChange = (e: CheckboxChangeEvent) => {
    setLocationChangeEnabled(e.target.checked);
    console.log(`checked = ${e.target.checked}`);
  };

  // const downloadStockDataAsPDF = () => {
  //   if (tableRef.current !== null) {
  //     const input = tableRef.current;
  //     // const input = document.getElementById("stockDataTable");
  //     html2canvas(input).then((canvas) => {
  //       const imageData = canvas.toDataURL("image/png");

  //       const pdf = new jsPDF("p", "mm", "a4");
  //       const imgWidth = 210;
  //       const pageHeight = 295;
  //       const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //       let heightLeft = imgHeight;

  //       let position = 0;

  //       pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
  //       heightLeft -= pageHeight;

  //       while (heightLeft >= 0) {
  //         position = heightLeft - imgHeight;
  //         pdf.addPage();
  //         pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
  //         heightLeft -= pageHeight;
  //       }

  //       pdf.save("stockData.pdf");
  //     });
  //   }
  // };

  return (
    <div>
      <Form layout="vertical">
        <div className="my-3 flex w-full flex-col">
          <Form.Item label="Location" name="code" className="w-auto">
            <Input
              placeholder="Input Location to search..."
              onPressEnter={handleEnterPress}
              suffix={
                <Tooltip title="Press Enter Key after entering...">
                  <InfoCircleOutlined style={{ color: "rgba(0,0,0,.45)" }} />
                </Tooltip>
              }
            />
          </Form.Item>
        </div>
        <div className="my-3">
          <div className="my-3 flex flex-col">
            <Checkbox onChange={onDescriptionChange}>
              Input Description
            </Checkbox>

            <div className="flex w-full justify-center">
              <TextArea
                allowClear
                rows={2}
                placeholder="Input the description of this location."
                value={description}
                disabled={!descriptionEnabled}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSaveButtonEnabled(!!e.target.value);
                }}
              />
            </div>
            <div className="flex w-full items-end justify-end">
              <Button
                type="primary"
                disabled={!saveButtonEnabled}
                onClick={() => {
                  onSaveDescription();
                }}
              >
                Save Description
              </Button>
            </div>
          </div>
          <Checkbox onChange={onLocationChange}>Change Location</Checkbox>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              placeholder="Input location to change"
              disabled={!locationChangeEnabled}
              onChange={(e) => {
                setNewLocation(e.target.value);
                setSubmitButtonEnabled(!!e.target.value);
              }}
            />
            <Button
              type="primary"
              disabled={!submitButtonEnabled}
              onClick={() => {
                onSubmitChangeLocation();
              }}
            >
              Submit
            </Button>
          </Space.Compact>
        </div>
        {stockData && (
          <>
            <Table
              // ref={tableRef}
              id="stockDataTable"
              dataSource={stockData}
              columns={columns}
              pagination={false}
            />
            {/* <Button onClick={downloadStockDataAsPDF}>
              Download Stock Data as PDF
            </Button> */}
          </>
        )}

        {/* I need to show the data as table */}
      </Form>
    </div>
  );
}

export default LocationGraph;
