import React from 'react';
import { Pie } from 'react-chartjs-2';
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
        labels: labels,
        datasets: [
            {
                label: 'Dataset 1',
                data: data,
                // random colors for each section
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
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
                text: 'Biểu đồ số lượng trạng thái yêu cầu thành chủ xe',
            },
        },
    };

    return <Pie data={chartData} options={options} />;
};

export default DoughnutChart;
