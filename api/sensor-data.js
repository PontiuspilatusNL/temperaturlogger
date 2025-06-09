// api/sensor-data.js
export default async function handler(req, res) {
  // Nur POST-Requests erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received data from ESP32:', req.body);

    // Daten an Supabase weiterleiten
    const supabaseResponse = await fetch('https://xdbufqslbajqzdtkbfar.supabase.co/rest/v1/sensor_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw'
      },
      body: JSON.stringify(req.body)
    });

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error('Supabase error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to send to Supabase', 
        details: errorText 
      });
    }

    const result = await supabaseResponse.json();
    console.log('Supabase success:', result);

    // Erfolgreiche Antwort an ESP32
    res.status(200).json({ 
      success: true, 
      message: 'Data saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}