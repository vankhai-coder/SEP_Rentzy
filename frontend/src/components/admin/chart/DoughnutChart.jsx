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

const DoughnutChart = ({ data, labels, title }) => {
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Dataset 1',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(52, 162, 235, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(201, 203, 207, 0.6)',
                    'rgba(25, 189, 64, 0.6)',

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
                text: title,
            },
        },
    };

    return <Doughnut data={chartData} options={options} />;
};

export default DoughnutChart;
