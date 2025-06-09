// FORCE DEPLOYMENT v4.0 - Chart.js Professional Version
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [debug, setDebug] = useState('Initialisiere...');
  const [chartLoaded, setChartLoaded] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Supabase configuration
  const SUPABASE_URL = 'https://xdbufqslbajqzdtkbfar.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw';

  const SENSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const fetchData = async () => {
    try {
      setDebug('Lade Daten von Supabase...');
      setLoading(true);
      
      // Fetch latest data
      const latestResponse = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      // Fetch historical data (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const historicalResponse = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?select=*&created_at=gte.${twentyFourHoursAgo.toISOString()}&order=created_at.asc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!latestResponse.ok || !historicalResponse.ok) {
        throw new Error(`HTTP Error`);
      }
      
      const latestData = await latestResponse.json();
      const historicalData = await historicalResponse.json();
      
      setLatestData(latestData[0] || null);
      setHistoricalData(historicalData);
      setDebug(`✅ ${historicalData.length} Datensätze geladen`);
      setError(false);
      
    } catch (err) {
      setDebug(`❌ Fehler: ${err.message}`);
      setError(true);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createChart = () => {
    if (!chartLoaded || !window.Chart || !chartRef.current || historicalData.length === 0) {
      setDebug('❌ Chart kann nicht erstellt werden: ' + (!chartLoaded ? 'Chart.js nicht geladen' : !window.Chart ? 'window.Chart fehlt' : !chartRef.current ? 'chartRef fehlt' : 'keine Daten'));
      return;
    }

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Prepare data for chart
    const labels = historicalData.map(item => {
      const date = new Date(item.created_at);
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    });

    const datasets = [];
    for (let i = 1; i <= 5; i++) {
      datasets.push({
        label: `Sensor ${i}`,
        data: historicalData.map(item => item[`t${i}`]),
        borderColor: SENSOR_COLORS[i-1],
        backgroundColor: SENSOR_COLORS[i-1] + '30',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: SENSOR_COLORS[i-1],
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        fill: false,
        borderWidth: 3
      });
    }

    try {
      chartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: 'white',
                font: {
                  size: 14,
                  weight: 'bold'
                },
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                title: function(tooltipItems) {
                  return `Zeit: ${tooltipItems[0].label}`;
                },
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`;
                }
              }
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Zeit',
                color: 'white',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.8)',
                maxTicksLimit: 12,
                font: {
                  size: 12
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Temperatur (°C)',
                color: 'white',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.8)',
                font: {
                  size: 12
                },
                callback: function(value) {
                  return value.toFixed(1) + '°C';
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1
              }
            }
          }
        }
      });
      
      setDebug(`✅ Professional Chart erstellt mit ${historicalData.length} Datenpunkten!`);
    } catch (error) {
      setDebug(`❌ Chart Fehler: ${error.message}`);
      console.error('Chart creation error:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chartLoaded && historicalData.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(createChart, 100);
    }
  }, [chartLoaded, historicalData]);

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
        <title>Temperatur Logger - Professional Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Script 
        src="https://cdn.jsdelivr.net/npm/chart.js" 
        onLoad={() => {
          setChartLoaded(true);
          setDebug('✅ Chart.js Script geladen!');
        }}
        onError={() => {
          setDebug('❌ Chart.js Script Fehler!');
          setError(true);
        }}
        strategy="beforeInteractive"
      />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎨 PROFESSIONAL CHARTS 🎨</h1>
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
            📊 Interactive Chart.js Dashboard
          </div>
          <div style={styles.chartWrapper}>
            {!chartLoaded ? (
              <div style={styles.chartPlaceholder}>
                <p>📈 Lade Chart.js Script...</p>
              </div>
            ) : historicalData.length === 0 ? (
              <div style={styles.chartPlaceholder}>
                <p>📊 Warte auf Daten...</p>
              </div>
            ) : !chartRef.current ? (
              <div style={styles.chartPlaceholder}>
                <p>🔄 Bereite Chart vor...</p>
              </div>
            ) : (
              <canvas ref={chartRef} style={styles.canvas}></canvas>
            )}
          </div>
          {latestData && (
            <div style={styles.chartInfo}>
              <p>🕒 Letztes Update: {new Date(latestData.created_at).toLocaleString('de-DE')}</p>
              <p>📈 {historicalData.length} Datenpunkte (24h)</p>
              <p>🎨 Chart Status: {chartLoaded ? '✅ Geladen' : '❌ Lädt...'} | Chart.js: {chartLoaded && window.Chart ? window.Chart.version : 'N/A'}</p>
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
  chartWrapper: {
    height: '400px',
    position: 'relative'
  },
  chartPlaceholder: {
    textAlign: 'center',
    padding: '20px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem'
  },
  canvas: {
    width: '100%',
    height: '100%'
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
