package com.tanklevel.app

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*
import kotlin.concurrent.scheduleAtFixedRate

class MainActivity : AppCompatActivity() {
    
    private lateinit var dbHelper: DatabaseHelper
    private lateinit var tankViews: Array<TankView>
    private lateinit var airPressureText: TextView
    private lateinit var refreshButton: Button
    private lateinit var statusText: TextView
    private var timer: Timer? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize views
        tankViews = Array(6) { index ->
            findViewById<TankView>(resources.getIdentifier("tank$index", "id", packageName))
        }
        
        airPressureText = findViewById(R.id.airPressureText)
        refreshButton = findViewById(R.id.refreshButton)
        statusText = findViewById(R.id.statusText)
        
        // Initialize database helper
        dbHelper = DatabaseHelper()
        
        // Set refresh button click listener
        refreshButton.setOnClickListener {
            fetchData()
        }
        
        // Initial data fetch
        fetchData()
        
        // Setup auto-refresh every 30 seconds
        timer = Timer()
        timer?.scheduleAtFixedRate(0, 30000) {
            runOnUiThread {
                fetchData()
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        timer?.cancel()
        timer = null
    }
    
    private fun fetchData() {
        statusText.text = "Updating data..."
        statusText.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            try {
                val tankDataList = withContext(Dispatchers.IO) {
                    dbHelper.fetchTankData()
                }
                
                updateUI(tankDataList)
                statusText.text = "Last updated: ${Date()}"
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                    statusText.text = "Failed to fetch data: ${e.message}"
                }
            }
        }
    }
    
    private fun updateUI(tankDataList: List<TankData>) {
        // Update tank views
        tankDataList.forEachIndexed { index, data ->
            if (index < tankViews.size) {
                tankViews[index].setTankData(data)
            }
        }
        
        // Update air pressure display
        val airPressure = tankDataList.firstOrNull()?.airPressure ?: 0.0
        airPressureText.text = String.format("Air Pressure: %.2f hPa", airPressure)
    }
}
