export const handler = async (event) => {
    console.log('Received IoT event:', JSON.stringify(event, null, 2));
    
    // Supabase configuration
    const SUPABASE_URL = 'https://xdbufqslbajqzdtkbfar.supabase.co/rest/v1/sensor_data';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkYnVmcXNsYmFqcXpkdGtiZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkyMDMsImV4cCI6MjA2NDk4NTIwM30.3xEyfp3gXnWA2VAs1FGv8BrvaV8XdxepPEIHF4BSNEw';
    
    try {
        // Extract temperature data from IoT event
        const temperatureData = {
            device_id: 'Datenlogger_01',
            t1: event.T1,
            t2: event.T2,
            t3: event.T3,
            t4: event.T4,
            t5: event.T5,
            signal_strength: 0  // Default value since ESP32 doesn't send this via MQTT
        };
        
        console.log('Sending to Supabase:', temperatureData);
        
        // Send to Supabase
        const response = await fetch(SUPABASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(temperatureData)
        });
        
        if (response.ok) {
            console.log('✓ Supabase response status:', response.status);
            
            // Get response text first to debug
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            // Try to parse JSON only if there's content
            let result = {};
            if (responseText.trim()) {
                try {
                    result = JSON.parse(responseText);
                } catch (e) {
                    console.log('Response is not JSON, that\'s ok for INSERT');
                }
            }
            
            console.log('✓ Data sent to Supabase successfully');
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Data sent to Supabase successfully',
                    data: temperatureData
                })
            };
        } else {
            const error = await response.text();
            console.error('✗ Supabase error:', response.status, error);
            throw new Error(`Supabase error: ${response.status} ${error}`);
        }
        
    } catch (error) {
        console.error('Error processing IoT data:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error processing IoT data',
                error: error.message
            })
        };
    }
};
