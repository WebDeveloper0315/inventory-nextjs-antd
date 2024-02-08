import React from "react";
import { Bar } from "react-chartjs-2";

function BarGraph({ data }: any) {
  if (!data) {
    // Return null or handle the case when data is not available
    return null;
  }
  // console.log("object")
  const graphLabels = Object.keys(data);
  const values = Object.values(data);

  const barData = {
    labels: graphLabels,
    datasets: [
      {
        label: "Profit",
        data: values,
        backgroundColor: "rgba(75,192,192,0.6)",
        borderColor: "rgba(75,192,192,1)",
        borderWidth: 1,
      },
    ],
  };
  return (
    <div>
      <Bar
        data={barData}
        options={{
          indexAxis: "x",
          scales: {
            y: {
              beginAtZero: true,
              stacked: true,
            },
          },
        }}
      />
    </div>
  );
}

export default BarGraph;
