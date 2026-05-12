import React from "react";
import ReactECharts from "echarts-for-react";

const IndustrialChart = ({ option, style = { height: "300px", width: "100%" }, theme = "light" }) => {
  const baseOption = {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "Inter, sans-serif",
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      textStyle: {
        color: "#1e293b",
      },
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#64748b",
        },
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    ...option,
  };

  return (
    <ReactECharts
      option={baseOption}
      style={style}
      theme={theme}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default IndustrialChart;
