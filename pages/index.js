import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Supabase configuration
  const SUPABASE_URL = 'https://xdbufqslbajqzdtkbfar.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw';

  const SENSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

  const fetchLatestData = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      throw error;
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?select=*&created_at=gte.${twentyFourHoursAgo.toISOString()}&order=created_at.asc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [latest, historical] = await Promise.all([
        fetchLatestData(),
        fetchHistoricalData()
      ]);
      
      setLatestData(latest);
      setHistoricalData(historical);
      setError(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          🌡️ Lade Temperaturdaten...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Fehler beim Laden der Daten</strong><br/>
          Bitte prüfe die Supabase-Verbindung
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Temperatur Logger - Live Dashboard</title>
        <meta name="description" content="Live Temperatur Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🌡️ Temperatur Logger</h1>
          <div style={styles.status}>
            <div style={styles.statusDot}></div>
            <span>Live Daten • Aktualisiert alle 30 Sekunden</span>
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
            📊 Temperaturverlauf (letzte 24 Stunden)
          </div>
          <div style={styles.chartPlaceholder}>
            {historicalData.length > 0 ? (
              <div>
                <p>📈 {historicalData.length} Datenpunkte geladen</p>
                <p>🕒 Letztes Update: {latestData?.created_at ? new Date(latestData.created_at).toLocaleString('de-DE') : 'Unbekannt'}</p>
                <div style={styles.dataPreview}>
                  {historicalData.slice(-5).map((item, idx) => (
                    <div key={idx} style={styles.dataRow}>
                      <span>{new Date(item.created_at).toLocaleTimeString('de-DE')}</span>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{color: SENSOR_COLORS[i-1]}}>
                          T{i}: {item[`t${i}`]?.toFixed(1) || '--'}°C
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>Keine historischen Daten verfügbar</p>
            )}
          </div>
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
    marginBottom: '20px'
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
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.3s ease'
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
  chartPlaceholder: {
    textAlign: 'center',
    padding: '20px'
  },
  dataPreview: {
    marginTop: '20px',
    textAlign: 'left'
  },
  dataRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '8px',
    fontSize: '0.9rem',
    flexWrap: 'wrap'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '1.5rem'
  },
  error: {
    background: 'rgba(244, 67, 54, 0.2)',
    border: '1px solid rgba(244, 67, 54, 0.5)',
    borderRadius: '10px',
    padding: '15px',
    margin: '20px 0',
    textAlign: 'center'
  }
};
