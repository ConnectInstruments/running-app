const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  host: 'sql12.freesqldatabase.com',
  user: 'sql12768977',
  password: 'pVArQ3sb5f',
  database: 'sql12768977',
  port: 3306
};

// API endpoint to fetch tank data
app.get('/api/tanks', async (req, res) => {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    
    // Query to get the latest record from the database
    const [rows] = await connection.execute('SELECT * FROM Tank_data_luxam ORDER BY id DESC LIMIT 1');
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No tank data found' });
    }
    
    // Latest record with all data
    const latestData = rows[0];
    
    // Tank capacities in liters
    const tankCapacities = {
      0: 20000,  // Tank 0: 20,000 L
      1: 150000, // Tank 1: 150,000 L
      2: 150000, // Tank 2: 150,000 L
      3: 150000, // Tank 3: 150,000 L
      4: 150000, // Tank 4: 150,000 L
      5: 150000  // Tank 5: 150,000 L
    };
    
    // Process data for all 6 tanks
    const tanks = [];
    for (let i = 0; i <= 5; i++) {
      // Tank level data are in DATA0 to DATA5 columns (raw values)
      const rawLevel = latestData[`DATA${i}`] || 0;
      
      // Temperature data are in DATA7 to DATA11 columns (Tank 0 = DATA7, Tank 1 = DATA8, etc.)
      const tempIndex = i + 7;
      const temperature = i < 5 ? latestData[`DATA${tempIndex}`] || 0 : 0.0;
      
      // Get the tank capacity
      const tankCapacity = tankCapacities[i];
      
      // Create tank object and add to array - passing raw values directly
      tanks.push({
        tankNumber: i,
        level: rawLevel, // Using raw level value directly
        rawLevel: rawLevel,
        rawTemperature: temperature,
        volumeInLiters: rawLevel, // Using raw value directly
        capacity: tankCapacity,
        temperature: temperature,
        airPressure: latestData.DATA12 || 0 // Air pressure is in DATA12 column
      });
    }
    
    res.json({
      tanks: tanks,
      airPressure: latestData.DATA12 || 0,
      timestamp: new Date(),
      rawData: latestData
    });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// Default route to serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});