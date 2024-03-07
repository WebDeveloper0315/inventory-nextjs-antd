/* eslint-disable tailwindcss/no-custom-classname */
"use client";
import { SetLoading } from "@/redux/loadersSlice";
import { Table, message, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Chart, { CategoryScale } from "chart.js/auto";
import BarGraph from "./BarGraph";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DataType {
  key: React.ReactNode;
  name: string;
  value: any;
  children?: DataType[];
}

const columns: ColumnsType<DataType> = [
  {
    title: "Label",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
  },
];

function GeneralGraph() {
  const tableRef = useRef<any>();
  const dispatch = useDispatch();
  const [graphData, setGraphData] = useState<any>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [tableDataForPdf, setTableDataForPdf] = useState<DataType[]>([]);
  const [isVisible, setVisible] = useState(false);
  const [isPdfTableVisible, setPdfTableVisible] = useState(false);

  Chart.register(CategoryScale);

  const handleQueryButtonClick = async (queryValue: any) => {
    try {
      setVisible(false);
      dispatch(SetLoading(true));
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      let response: any;
      if (queryValue === "month") {
        response = await axios.get(
          `/api/products/queryAll?month=${currentMonth}`
        );
      } else if (queryValue === "year") {
        response = await axios.get(
          `/api/products/queryAll?year=${currentYear}`
        );
      }

      if (response.status === 201) {
        console.log("fetchGraphData");
        console.log(response.data);

        setGraphData(response.data);
        setTableData(response.data.tableData);
        setTableDataForPdf(response.data.tableDataForPdf);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      dispatch(SetLoading(false));
      setVisible(true);
    }
  };

  const downloadStockDataAsPDF = async () => {
    await setPdfTableVisible(true);

    const input = tableRef.current!;

    if (input) {
      
      // console.log("asd", input);
      try {
        
        const canvas = await html2canvas(input.nativeElement);
        // console.log("asd", canvas);
        const imgData = canvas.toDataURL("image/png", 100);
        // eslint-disable-next-line new-cap
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 0;

        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

        const pageCount = Math.ceil(canvas.height / 295); // Calculate number of pages based on height

        for (let i = 1; i < pageCount; i++) {
          pdf.addPage("a4");
          position = -(295 * i);
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        }

        pdf.save("stockData-General.pdf");
      } catch (error) {
        console.error("Error while generating PDF:", error);
      } finally{
        setPdfTableVisible(false);
      }
    }
  };

  return (
    <div>
      <div className="flex">
        <Button
          type="primary"
          block
          onClick={() => handleQueryButtonClick("month")}
          className="mx-3"
        >
          <i className="ri-bar-chart-2-fill">&nbsp;Monthly</i>
        </Button>

        <Button
          type="primary"
          block
          onClick={() => handleQueryButtonClick("year")}
          className="mx-3"
        >
          <i className="ri-bar-chart-2-fill">&nbsp;Yearly</i>
        </Button>
      </div>
      <div>
        {isVisible && (
          <>
            <div className="my-3">
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                
              />
              
              <Button onClick={downloadStockDataAsPDF}>
                Download Stock Data as PDF
              </Button>
            </div>

            <div>
              <h2>Sale Status Per Code of this month</h2>
              <BarGraph data={graphData?.sellingCode}></BarGraph>
            </div>

            <div>
              <h2>Sale Status Per Market of this month</h2>
              <BarGraph data={graphData?.sellingMarket} />
            </div>

            {isPdfTableVisible && ( 
                <div ref={tableRef}> 
                  <h1>Stock Data</h1>
                  <hr/>
                  <Table
                    
                    columns={columns}
                    dataSource={tableDataForPdf}
                    pagination={false}
                    expandable={{ defaultExpandAllRows: true }}
                  />
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

export default GeneralGraph;
