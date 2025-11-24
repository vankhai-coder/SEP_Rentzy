import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const TotalRevenueChartComponent = ({ data, labels }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tổng doanh thu',
        data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Biểu đồ Tổng doanh thu theo tháng',
        font: { size: 18 },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: "350px" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TotalRevenueChartComponent;
