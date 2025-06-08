// pages/api/sensors.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (req.method === 'POST') {
    try {
      const { T1, T2, T3, T4, T5, device_id, signal } = req.body;
      
      console.log('Received data:', req.body);
      
      // Insert into Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/sensor_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          device_id: device_id || 'Unknown',
          t1: T1,
          t2: T2, 
          t3: T3,
          t4: T4,
          t5: T5,
          signal_strength: signal
        })
      });
      
      if (response.ok) {
        console.log('Data inserted successfully');
        res.status(200).json({ 
          success: true, 
          message: 'Data received successfully'
        });
      } else {
        const errorText = await response.text();
        console.error('Supabase error:', errorText);
        res.status(500).json({ 
          success: false, 
          error: 'Database error: ' + errorText 
        });
      }
      
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Server error: ' + error.message 
      });
    }
  } 
  
  else if (req.method === 'GET') {
    try {
      // Get latest data
      const latestResponse = await fetch(`${supabaseUrl}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      // Get historical data (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const historicalResponse = await fetch(`${supabaseUrl}/rest/v1/sensor_data?select=*&created_at=gte.${oneDayAgo}&order=created_at.asc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      const latest = await latestResponse.json();
      const historical = await historicalResponse.json();
      
      res.status(200).json({
        success: true,
        latest: latest[0] || null,
        historical: historical || []
      });
      
    } catch (error) {
      console.error('API error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Server error: ' + error.message 
      });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}