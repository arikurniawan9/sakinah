// components/charts/SalesChart.js
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart } from 'recharts';
import { useState } from 'react';

const SalesChart = ({ data, title = "Grafik Penjualan", chartType = "bar" }) => {
  const [activeChart, setActiveChart] = useState(chartType);

  const renderChart = () => {
    if (activeChart === "line") {
      return (
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" tickFormatter={(value) => `Rp${value.toLocaleString()}`} />
          <Tooltip
            formatter={(value) => [`Rp${Number(value).toLocaleString()}`, 'Jumlah']}
            labelFormatter={(label) => `Tanggal: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              color: '#1f2937'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            name="Penjualan"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      );
    } else {
      return (
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" tickFormatter={(value) => `Rp${value.toLocaleString()}`} />
          <Tooltip
            formatter={(value) => [`Rp${Number(value).toLocaleString()}`, 'Jumlah']}
            labelFormatter={(label) => `Tanggal: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              color: '#1f2937'
            }}
          />
          <Legend />
          <Bar dataKey="sales" name="Penjualan" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveChart("bar")}
            className={`px-3 py-1 text-xs rounded ${
              activeChart === "bar"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Batang
          </button>
          <button
            onClick={() => setActiveChart("line")}
            className={`px-3 py-1 text-xs rounded ${
              activeChart === "line"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Garis
          </button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;