import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DoughnutChart = ({ data, labels }) => {
  const chartData = {
    labels : labels,
    datasets: [
      {
        label: 'Dataset 1',
        data: data, 
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        // text: 'Chart.js Doughnut Chart',
        text : 'Biểu đồ số lượng người dùng theo vai trò',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

export default DoughnutChart;
