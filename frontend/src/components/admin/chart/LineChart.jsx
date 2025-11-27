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

const LineChartComponent = ({ data, labels, title , label }) => {
    const chartData = {
        labels,
        datasets: [
            {
                label: label ,
                data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: {
                    linearGradient: { x0: 0, y0: 0, x1: 0, y1: 1 },
                    stops: [
                        { offset: 0, color: 'rgba(75, 192, 192, 0.4)' },
                        { offset: 1, color: 'rgba(75, 192, 192, 0)' },
                    ],
                },
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
                text: title,
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

export default LineChartComponent;
