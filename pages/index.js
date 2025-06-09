import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [debug, setDebug] = useState('Initialisiere...');

  // Supabase configuration
  const SUPABASE_URL = 'https://xdbufqslbajqzdtkbfar.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw';

  const SENSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const fetchData = async () => {
    try {
      setDebug('Lade Daten von Supabase...');
      setLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=10`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLatestData(data[0] || null);
      setHistoricalData(data);
      setDebug(`✅ ${data.length} Datensätze geladen`);
      setError(false);
    } catch (err) {
      setDebug(`❌ Fehler: ${err.message}`);
      setError(true);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Einfache Canvas-Chart (ohne Chart.js)
  useEffect(() => {
    if (historicalData.length > 0) {
      drawSimpleChart();
    }
  }, [historicalData]);

  const drawSimpleChart = () => {
    const canvas = document.getElementById('simpleChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, width, height);
    
    if (historicalData.length === 0) {
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Daten verfügbar', width/2, height/2);
      return;
    }
    
    // Draw simple lines for each sensor
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
    
    // Find min/max for scaling
    let minTemp = Infinity, maxTemp = -Infinity;
    historicalData.forEach(item => {
      for (let i = 1; i <= 5; i++) {
        const temp = item[`t${i}`];
        if (temp !== null && temp !== undefined) {
          minTemp = Math.min(minTemp, temp);
          maxTemp = Math.max(maxTemp, temp);
        }
      }
    });
    
    if (minTemp === Infinity) return;
    
    const tempRange = maxTemp - minTemp || 1;
    
    // Draw each sensor line
    for (let sensor = 1; sensor <= 5; sensor++) {
      ctx.strokeStyle = SENSOR_COLORS[sensor - 1];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let firstPoint = true;
      historicalData.forEach((item, index) => {
        const temp = item[`t${sensor}`];
        if (temp !== null && temp !== undefined) {
          const x = margin + (index / (historicalData.length - 1)) * chartWidth;
          const y = margin + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
          
          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      
      ctx.stroke();
    }
    
    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Min: ${minTemp.toFixed(1)}°C`, 10, height - 10);
    ctx.textAlign = 'right';
    ctx.fillText(`Max: ${maxTemp.toFixed(1)}°C`, width - 10, height - 10);
    
    setDebug(`✅ Chart gezeichnet (${historicalData.length} Punkte)`);
  };

  if (loading && !latestData) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          🌡️ {debug}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Temperatur Logger - Simple Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎨 CHART.JS VERSION 🎨</h1>
          <div style={{
            ...styles.status,
            background: error ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)',
            borderColor: error ? '#f44336' : '#4CAF50'
          }}>
            <div style={styles.statusDot}></div>
            <span>{debug}</span>
          </div>
        </div>

        <div style={styles.tempGrid}>
          {[1, 2, 3, 4, 5].map(i => {
            const temp = latestData?.[`t${i}`];
            return (
              <div key={i} style={{...styles.tempCard, borderLeft: `4px solid ${SENSOR_COLORS[i-1]}`}}>
                <div style={styles.sensorName}>Sensor {i}</div>
                <div style={{...styles.tempValue, color: SENSOR_COLORS[i-1]}}>
                  {temp !== null && temp !== undefined ? temp.toFixed(1) : '--'}
                </div>
                <div style={styles.tempUnit}>°C</div>
              </div>
            );
          })}
        </div>

        <div style={styles.chartContainer}>
          <div style={styles.chartTitle}>
            📊 Temperaturverlauf (Simple Canvas Chart)
          </div>
          <canvas id="simpleChart" style={styles.canvas}></canvas>
          {latestData && (
            <div style={styles.chartInfo}>
              <p>🕒 Letztes Update: {new Date(latestData.created_at).toLocaleString('de-DE')}</p>
              <p>📈 {historicalData.length} Datenpunkte</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    minHeight: '100vh',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  status: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid'
  },
  statusDot: {
    width: '12px',
    height: '12px',
    background: '#4CAF50',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  tempGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  tempCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '20px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  sensorName: {
    fontSize: '1.1rem',
    marginBottom: '10px',
    opacity: '0.8'
  },
  tempValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  tempUnit: {
    fontSize: '1.2rem',
    opacity: '0.7'
  },
  chartContainer: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  chartTitle: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '1.5rem'
  },
  canvas: {
    width: '100%',
    height: '300px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px'
  },
  chartInfo: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '0.9rem',
    opacity: '0.8'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '1.5rem'
  }
};
