import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Test() {
  const [status, setStatus] = useState('Initialisiere...');
  const [latestData, setLatestData] = useState(null);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [error, setError] = useState(false);

  const SUPABASE_URL = 'https://xdbufqslbajqzdtkbfar.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw';
  const SENSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const fetchData = async () => {
    try {
      setStatus('Lade Daten...');
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setLatestData(data[0]);
      setStatus(`✅ Daten geladen! Chart.js: ${chartLoaded ? 'Geladen' : 'Lädt...'}`);
      setError(false);
    } catch (err) {
      setStatus(`❌ Fehler: ${err.message}`);
      setError(true);
    }
  };

  useEffect(() => {
    // Load Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      setChartLoaded(true);
      setStatus('✅ Chart.js geladen!');
    };
    script.onerror = () => {
      setStatus('❌ Chart.js Fehler!');
      setError(true);
    };
    document.head.appendChild(script);

    fetchData();
  }, []);

  useEffect(() => {
    if (chartLoaded && latestData) {
      createSimpleChart();
    }
  }, [chartLoaded, latestData]);

  const createSimpleChart = () => {
    if (!window.Chart) return;

    const ctx = document.getElementById('testChart');
    if (!ctx) return;

    // Destroy existing chart
    if (window.testChartInstance) {
      window.testChartInstance.destroy();
    }

    // Create simple test data
    const testData = [
      { time: '10:00', t1: 20, t2: 21, t3: 22, t4: 23, t5: 24 },
      { time: '10:30', t1: 21, t2: 22, t3: 23, t4: 24, t5: 25 },
      { time: '11:00', t1: 22, t2: 23, t3: 24, t4: 25, t5: 26 }
    ];

    const datasets = [];
    for (let i = 1; i <= 5; i++) {
      datasets.push({
        label: `Sensor ${i}`,
        data: testData.map(item => item[`t${i}`]),
        borderColor: SENSOR_COLORS[i-1],
        backgroundColor: SENSOR_COLORS[i-1] + '40',
        tension: 0.4
      });
    }

    window.testChartInstance = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: testData.map(item => item.time),
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: 'white' }
          }
        },
        scales: {
          x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });

    setStatus('✅ Chart erstellt!');
  };

  return (
    <>
      <Head>
        <title>Chart Test</title>
      </Head>
      
      <div style={{
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center' }}>🧪 CHART TEST</h1>
          
          <div style={{
            background: error ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)',
            border: `1px solid ${error ? '#f44336' : '#4CAF50'}`,
            borderRadius: '10px',
            padding: '15px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <strong>Status:</strong> {status}
          </div>

          {latestData && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '15px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  borderLeft: `4px solid ${SENSOR_COLORS[i-1]}`
                }}>
                  <div>Sensor {i}</div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: SENSOR_COLORS[i-1]
                  }}>
                    {latestData[`t${i}`]?.toFixed(1) || '--'}°C
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '20px'
          }}>
            <h2 style={{ textAlign: 'center' }}>📊 TEST CHART</h2>
            <div style={{ height: '400px', position: 'relative' }}>
              <canvas id="testChart"></canvas>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p>Chart.js geladen: {chartLoaded ? '✅' : '❌'}</p>
            <p>Supabase Daten: {latestData ? '✅' : '❌'}</p>
            <p>Chart erstellt: {window.testChartInstance ? '✅' : '❌'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
