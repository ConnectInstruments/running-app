const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with specific origin
app.use(cors({
  origin: ['https://connectpro.connectinstruments.ae', 'http://localhost:5000'],
  credentials: true
}));

// Enable JSON parsing for POST requests
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306
};

// Initialize database tables
async function initializeDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Create tanks_config table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tanks_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        capacity INT NOT NULL,
        level_field VARCHAR(50) NOT NULL,
        temp_field VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Initialize database on startup
initializeDatabase();

// API endpoint to fetch tank data
app.get('/api/tanks', async (req, res) => {
  let connection;
  
  // Add cache control headers
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    console.log('Attempting to connect to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful');
    
    // First get tank configurations
    const [tankConfigs] = await connection.execute('SELECT * FROM tanks_config ORDER BY id');
    
    // Query to get the latest record from the data table
    const [rows] = await connection.execute('SELECT * FROM connect2_Tankpro ORDER BY id DESC LIMIT 1');
    
    if (rows.length === 0) {
      console.log('No tank data found in database');
      return res.status(404).json({ error: 'No tank data found' });
    }
    
    // Latest record with all data
    const latestData = rows[0];
    const airPressure = (latestData.DATA12 !== null && latestData.DATA12 !== undefined) ? 
        Number(latestData.DATA12) : null;
    
    const tanks = tankConfigs.map(config => {
      const rawLevel = Number(latestData[config.level_field] || 0);
      const temperature = Number(latestData[config.temp_field] || 0);
      
      return {
        tankNumber: config.id,
        name: config.name,
        level: rawLevel,
        rawLevel: rawLevel,
        rawTemperature: temperature,
        volumeInLiters: rawLevel,
        capacity: config.capacity,
        temperature: temperature,
        airPressure: airPressure
      };
    });
    
    const response = {
      tanks,
      airPressure: airPressure || 0,
      timestamp: new Date().toISOString(),
      rawData: latestData
    };
    
    console.log('Sending response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: `Database error: ${error.message}`,
      details: { code: error.code, errno: error.errno }
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// API endpoint to manage tank configurations
app.post('/api/tanks/config', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { name, capacity, levelField, tempField } = req.body;
    
    const [result] = await connection.execute(
      'INSERT INTO tanks_config (name, capacity, level_field, temp_field) VALUES (?, ?, ?, ?)',
      [name, capacity, levelField, tempField]
    );
    
    res.json({
      success: true,
      id: result.insertId,
      message: 'Tank configuration added successfully'
    });
  } catch (error) {
    console.error('Error adding tank configuration:', error);
    res.status(500).json({
      error: 'Failed to add tank configuration',
      details: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// API endpoint to update tank configuration
app.put('/api/tanks/config/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { name, capacity, levelField, tempField } = req.body;
    const { id } = req.params;
    
    await connection.execute(
      'UPDATE tanks_config SET name = ?, capacity = ?, level_field = ?, temp_field = ? WHERE id = ?',
      [name, capacity, levelField, tempField, id]
    );
    
    res.json({
      success: true,
      message: 'Tank configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating tank configuration:', error);
    res.status(500).json({
      error: 'Failed to update tank configuration',
      details: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// API endpoint to delete tank configuration
app.delete('/api/tanks/config/:id', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { id } = req.params;
    
    await connection.execute('DELETE FROM tanks_config WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Tank configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tank configuration:', error);
    res.status(500).json({
      error: 'Failed to delete tank configuration',
      details: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// API endpoint to get all tank configurations
app.get('/api/tanks/config', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [configs] = await connection.execute('SELECT * FROM tanks_config ORDER BY id');
    res.json(configs);
  } catch (error) {
    console.error('Error fetching tank configurations:', error);
    res.status(500).json({
      error: 'Failed to fetch tank configurations',
      details: error.message
    });
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
