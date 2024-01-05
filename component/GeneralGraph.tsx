"use client";
import { SetLoading } from "@/redux/loadersSlice";
import { Table, message, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Chart, { CategoryScale } from "chart.js/auto";
import BarGraph from "./BarGraph";

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
  const dispatch = useDispatch();
  const [graphData, setGraphData] = useState<any>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isVisible, setVisible] = useState(false);

  Chart.register(CategoryScale);

  const handleQueryButtonClick = async (queryValue: any) => {
    try {
      setVisible(false);
      dispatch(SetLoading(true));
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      let response: any;
      if(queryValue === 'month'){
        response = await axios.get(
          `/api/products/queryAll?month=${currentMonth}`
        );
      }else if(queryValue === 'year'){
        response = await axios.get(
          `/api/products/queryAll?year=${currentYear}`
        );
      }

      
      if (response.status === 201) {
        console.log("fetchGraphData");
        console.log(response.data);

        setGraphData(response.data);
        setTableData(response.data.tableData);
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      dispatch(SetLoading(false));
      setVisible(true);
    }
  };

  return (
    <div>
      <div className="flex">
        <Button
          type="primary"
          block
          onClick={() => handleQueryButtonClick('month')} 
          className="mx-3"
        >
          <i className="ri-bar-chart-2-fill">&nbsp;Monthly</i>
        </Button>

        <Button
          type="primary"
          block
          onClick={() => handleQueryButtonClick('year')} 
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
            </div>

            <div>
              <h2>Bar Graph - Profit Per Code of this month</h2>
              <BarGraph data={graphData?.profitCode}></BarGraph>
            </div>

            <div>
              <h2>Bar Graph - Profit Per Market of this month</h2>
              <BarGraph data={graphData?.profitMarket} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GeneralGraph;
