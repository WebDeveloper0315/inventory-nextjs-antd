"use client";
import { SetLoading } from "@/redux/loadersSlice";
import { Table, message } from "antd";
import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Chart, { CategoryScale } from "chart.js/auto";
import BarGraph from "./BarGraph";

function GeneralGraph() {
  const dispatch = useDispatch();
  const [graphData, setGraphData] = useState<any>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  Chart.register(CategoryScale);

  React.useEffect(() => {
    const fetchGraphData = async () => {
      try {
        dispatch(SetLoading(true));
        const response = await axios.get(`/api/products/queryAll`);
        if (response.status === 201) {
          console.log("fetchGraphData");
          console.log(response.data);

          setGraphData(response.data);
          setTableData([
            { label: "Total Units Sold", value: response.data.TotalUnitsSold },
            {
              label: "Average Buy Price(Total)",
              value: response.data.TotalAverageBuyPrice,
            },
            {
              label: "Average Sell Price(Total)",
              value: response.data.TotalAverageSellPrice,
            },
            { label: "Total Profit", value: response.data.TotalProfit },
            {
              label: "Average Money in taxes",
              value: response.data.AverageMoneyInTaxes,
            },
          ]);
        }
      } catch (error: any) {
        message.error(error.message);
      } finally {
        dispatch(SetLoading(false));
      }
    };
    fetchGraphData();
  },[dispatch, setGraphData, setTableData]);

  const columns = [
    {
      title: "Field",
      dataIndex: "label",
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
      <div className="my-3">
        <Table columns={columns} dataSource={tableData} pagination={false} />
      </div>

      <div>
        <h2>Bar Graph - Profit Per Code</h2>
        <BarGraph data={graphData?.profitCode} />
      </div>
      <div>
        <h2>Bar Graph - Profit Per Market</h2>
        <BarGraph data={graphData?.profitMarket} />
      </div>
    </div>
  );
}

export default GeneralGraph;
