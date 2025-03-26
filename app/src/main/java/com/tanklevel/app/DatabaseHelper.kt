package com.tanklevel.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet
import java.sql.SQLException

class DatabaseHelper {
    // Database credentials
    private val host = "sql12.freesqldatabase.com"
    private val dbName = "sql12768977"
    private val user = "sql12768977"
    private val password = "pVArQ3sb5f"
    private val port = 3306
    
    // JDBC URL
    private val jdbcUrl = "jdbc:mysql://$host:$port/$dbName"
    
    /**
     * Fetch tank data from the MySQL database
     */
    suspend fun fetchTankData(): List<TankData> = withContext(Dispatchers.IO) {
        val tankDataList = mutableListOf<TankData>()
        var connection: Connection? = null
        
        try {
            // Load the MySQL JDBC driver
            Class.forName("com.mysql.jdbc.Driver")
            
            // Create connection
            connection = DriverManager.getConnection(jdbcUrl, user, password)
            
            // Create SQL query to fetch the tank data
            val query = "SELECT * FROM Tank_data_luxam ORDER BY id DESC LIMIT 1"
            val statement = connection.createStatement()
            val resultSet = statement.executeQuery(query)
            
            if (resultSet.next()) {
                // Get latest record with all tanks data
                for (i in 0..5) {
                    // Tank level data are in DATA0 to DATA5 columns
                    val level = resultSet.getDouble("DATA$i")
                    
                    // Temperature data are in DATA7 to DATA11 columns
                    // Tank 0 = DATA7, Tank 1 = DATA8, etc.
                    val tempIndex = i + 7
                    val temperature = if (i < 5) resultSet.getDouble("DATA$tempIndex") else 0.0
                    
                    // Air pressure is in DATA12 column
                    val airPressure = resultSet.getDouble("DATA12")
                    
                    // Create TankData object and add to list
                    tankDataList.add(
                        TankData(
                            tankNumber = i,
                            level = level,
                            temperature = temperature,
                            airPressure = airPressure
                        )
                    )
                }
            }
            
        } catch (e: ClassNotFoundException) {
            throw Exception("MySQL JDBC Driver not found", e)
        } catch (e: SQLException) {
            throw Exception("Database error: ${e.message}", e)
        } finally {
            try {
                connection?.close()
            } catch (e: SQLException) {
                // Ignore close error
            }
        }
        
        return@withContext tankDataList
    }
}
