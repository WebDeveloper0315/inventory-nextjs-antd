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
import React, { useRef, useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { useDispatch } from "react-redux";
import { SetLoading } from "@/redux/loadersSlice";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { TableRowSelection } from "antd/lib/table/interface";

const { TextArea } = Input;
interface StockDataItem {
  productCode: string;
  pricePerUnit: number;
  stocks: number;
}

function LocationGraph() {
  const tableRef = useRef<any>();
  const dispatch = useDispatch();
  const [descriptionEnabled, setDescriptionEnabled] = useState(false);
  const [locationChangeEnabled, setLocationChangeEnabled] = useState(false);
  const [description, setDescription] = useState("");
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(false);
  const [locationInfo, setLocationInfo] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [submitButtonEnabled, setSubmitButtonEnabled] = useState(false);
  const [stockData, setStockData] = useState<StockDataItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [initialValues, setInitialValues] = useState({});
  const [descriptionCheckboxChecked, setDescriptionCheckboxChecked] =
    useState(false);
  const [locationChangeCheckboxChecked, setLocationChangeCheckboxChecked] =
    useState(false);

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
      const selectedLocationNames = stockData
        .filter((_, index) => selectedRowKeys.includes(index + 1))
        .map((item) => item.productCode);

      const response = await axios.post(`api/locations`, {
        updating: newLocation,
        locationMessage: locationInfo,
        selectedLocations: selectedLocationNames,
        status: "change",
      });
      if (response.status === 201) {
        message.success("Location Information changed successfully");

        const formFields = form.getFieldsValue(); // Get all form fields
        // Manually set the location change input value to an empty string
        if ("locationChangeInput" in formFields) {
          form.setFieldsValue({ locationChangeInput: "" });
        }
        setSubmitButtonEnabled(false);
        form.resetFields();
        setStockData([]);
        setNewLocation(""); // Reset new location input
        setSelectedRowKeys([]); // Reset selected rows
        setDescriptionEnabled(false); // Reset description inputs
        setLocationChangeEnabled(false); // Reset location change inputs
        setDescriptionCheckboxChecked(false); // Uncheck description checkbox
        setLocationChangeCheckboxChecked(false); // Uncheck location change checkbox
        setSaveButtonEnabled(false); // Reset save button
        setInitialValues({});

        
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
    setDescriptionCheckboxChecked(e.target.checked);
    console.log(`checked = ${e.target.checked}`);
  };

  const onLocationChange = (e: CheckboxChangeEvent) => {
    setLocationChangeEnabled(e.target.checked);
    setLocationChangeCheckboxChecked(e.target.checked);
    setSelectedRowKeys(
      e.target.checked ? stockData?.map((_, key) => key + 1) || [] : []
    );
    console.log("stockData", stockData?.map((_, key) => key + 1));
  };

  const downloadStockDataAsPDF = async () => {
    const input = tableRef.current!;

    if (input) {
      console.log("asd", input);
      try {
        const canvas = await html2canvas(input);
        console.log("asd", canvas);
        const imgData = canvas.toDataURL("image/png", 100);
        // eslint-disable-next-line new-cap
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 90;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 0;

        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

        const pageCount = Math.ceil(canvas.height / 295);

        for (let i = 1; i < pageCount; i++) {
          pdf.addPage("a4");
          position = -(295 * i);
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        }

        pdf.save("stockData.pdf");
      } catch (error) {
        console.error("Error while generating PDF:", error);
      }
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<StockDataItem> = {
    selectedRowKeys,
    onChange: onSelectChange,
    type: locationChangeEnabled ? "checkbox" : undefined,
    onSelectAll: (selected, selectedRows, changeRows) => {
      console.log("selected Rows in SelectAll function", selectedRows);
      if (!locationChangeEnabled) return;
      if (selected) {
        setSelectedRowKeys(stockData?.map((_, key) => key + 1) || []);
      } else {
        setSelectedRowKeys([]);
      }
    },
  };

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={initialValues}>
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
            <Checkbox
              onChange={onDescriptionChange}
              checked={descriptionCheckboxChecked}
            >
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
          <Checkbox
            onChange={onLocationChange}
            checked={locationChangeCheckboxChecked}
          >
            Change Location
          </Checkbox>
          <Space.Compact style={{ width: "100%" }}>
            <Input
              name="locationChangeInput"
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
          <div ref={tableRef}>
            <h1>
              Stock Data of {locationInfo}
            </h1>
            <hr/>
            <Table
              
              id="stockDataTable"
              rowSelection={rowSelection}
              dataSource={stockData}
              columns={columns}
              pagination={false}
            />
            </div>
            <Button onClick={downloadStockDataAsPDF}>
              Download Stock Data as PDF
            </Button>
            
          </>
        )}
      </Form>
    </div>
  );
}

export default LocationGraph;
