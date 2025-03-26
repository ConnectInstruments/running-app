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
    
    // Process data for all 6 tanks
    const tanks = [];
    for (let i = 0; i <= 5; i++) {
      // Tank level data are in DATA0 to DATA5 columns
      const level = latestData[`DATA${i}`];
      
      // Temperature data are in DATA7 to DATA11 columns (Tank 0 = DATA7, Tank 1 = DATA8, etc.)
      const tempIndex = i + 7;
      const temperature = i < 5 ? latestData[`DATA${tempIndex}`] : 0.0;
      
      // Create tank object and add to array
      tanks.push({
        tankNumber: i,
        level: level || 0,
        temperature: temperature || 0,
        airPressure: latestData.DATA12 || 0 // Air pressure is in DATA12 column
      });
    }
    
    res.json({
      tanks: tanks,
      airPressure: latestData.DATA12 || 0,
      timestamp: new Date()
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