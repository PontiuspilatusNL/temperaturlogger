// pages/index.js
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function Home() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sensors');
      const data = await response.json();
      
      if (data.success) {
        setSensorData(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getCurrentTemp = (sensorKey) => {
    if (!sensorData?.latest) return '--';
    const temp = sensorData.latest[sensorKey.toLowerCase()];
    return temp !== null && temp !== undefined ? `${temp.toFixed(1)}°C` : '--';
  };

  const getSignalIcon = () => {
    if (!sensorData?.latest?.signal_strength) return '📶';
    const signal = sensorData.latest.signal_strength;
    if (signal > 20) return '📶';
    if (signal > 10) return '📶';
    if (signal > 5) return '📶';
    return '📶';
  };

  const getChartData = () => {
    if (!sensorData?.historical) return null;

    const sensorColors = [
      'rgb(255, 99, 132)',   // T1 - Red
      'rgb(54, 162, 235)',   // T2 - Blue  
      'rgb(255, 205, 86)',   // T3 - Yellow
      'rgb(75, 192, 192)',   // T4 - Teal
      'rgb(153, 102, 255)',  // T5 - Purple
    ];

    const datasets = [];
    
    for (let i = 1; i <= 5; i++) {
      const sensorKey = `t${i}`;
      const dataPoints = sensorData.historical
        .filter(row => row[sensorKey] !== null && row[sensorKey] !== undefined)
        .map(row => ({
          x: new Date(row.timestamp),
          y: parseFloat(row[sensorKey])
        }));

      if (dataPoints.length > 0) {
        datasets.push({
          label: `Sensor ${i}`,
          data: dataPoints,
          borderColor: sensorColors[i-1],
          backgroundColor: sensorColors[i-1] + '33',
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 5,
        });
      }
    }

    return { datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Temperature History (24 Hours)',
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)'
        },
        min: 0,
        max: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading temperature data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">🌡️ TemperaturLogger</h1>
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{getSignalIcon()}</span>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Update</p>
                <p className="text-sm font-mono">
                  {lastUpdate ? format(lastUpdate, 'HH:mm:ss') : '--:--:--'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Current Temperature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {[1, 2, 3, 4, 5].map((sensorNum) => (
            <div 
              key={sensorNum} 
              className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Sensor {sensorNum}
              </h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {getCurrentTemp(`t${sensorNum}`)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, (parseFloat(getCurrentTemp(`t${sensorNum}`)) || 0) * 2)}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="h-96">
            {getChartData() ? (
              <Line data={getChartData()} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg">No historical data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Device Info */}
        {sensorData?.latest && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Device Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500">Device ID</p>
                <p className="font-mono">{sensorData.latest.device_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Signal Strength</p>
                <p className="font-mono">{sensorData.latest.signal_strength || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Reading</p>
                <p className="font-mono">
                  {sensorData.latest.timestamp ? 
                    format(new Date(sensorData.latest.timestamp), 'dd.MM.yyyy HH:mm:ss') : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}