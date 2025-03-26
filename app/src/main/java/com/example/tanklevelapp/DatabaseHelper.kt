package com.example.tanklevelapp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.sql.Connection
import java.sql.DriverManager
import java.sql.SQLException

class DatabaseHelper {
    // Database credentials
    private val host = "sql12.freesqldatabase.com"
    private val dbName = "sql12768977"
    private val user = "sql12768977"
    private val password = "pVArQ3sb5f"
    private val port = 3306
    
    // JDBC URL
    private val url = "jdbc:mysql://$host:$port/$dbName"
    
    /**
     * Fetches tank data from the database
     * @return TankDataResult containing list of tank data and air pressure
     */
    suspend fun fetchTankData(): TankDataResult = withContext(Dispatchers.IO) {
        var connection: Connection? = null
        
        try {
            // Load the MySQL JDBC driver
            Class.forName("com.mysql.jdbc.Driver")
            
            // Connect to the database
            connection = DriverManager.getConnection(url, user, password)
            
            // Query the database
            val statement = connection.createStatement()
            val query = "SELECT * FROM Tank_data_luxam ORDER BY id DESC LIMIT 1"
            val resultSet = statement.executeQuery(query)
            
            val tanks = mutableListOf<TankData>()
            var airPressure = 0.0
            
            // Process the result set
            if (resultSet.next()) {
                // Get tank levels (DATA0 to DATA5)
                for (i in 0..5) {
                    val level = resultSet.getDouble("DATA$i")
                    tanks.add(TankData(i, level, 0.0)) // Temperature will be set in the next loop
                }
                
                // Get tank temperatures (DATA7 to DATA11)
                for (i in 0..4) {
                    val temperatureIndex = i + 7
                    val temperature = resultSet.getDouble("DATA$temperatureIndex")
                    tanks[i].temperature = temperature
                }
                
                // Get air pressure (DATA12)
                airPressure = resultSet.getDouble("DATA12")
            }
            
            // Return the tank data and air pressure
            TankDataResult(tanks, airPressure)
        } catch (e: ClassNotFoundException) {
            throw Exception("MySQL JDBC driver not found: ${e.message}")
        } catch (e: SQLException) {
            throw Exception("Database error: ${e.message}")
        } finally {
            // Close the connection
            try {
                connection?.close()
            } catch (e: SQLException) {
                // Just log the error
                e.printStackTrace()
            }
        }
    }
}

data class TankDataResult(
    val tanks: List<TankData>,
    val airPressure: Double
)
