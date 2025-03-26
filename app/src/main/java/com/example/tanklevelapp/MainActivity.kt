package com.example.tanklevelapp

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.card.MaterialCardView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var tankAdapter: TankAdapter
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var loadingProgressBar: ProgressBar
    private lateinit var airPressureTextView: TextView
    private lateinit var airPressureCard: MaterialCardView
    private lateinit var errorView: TextView
    private lateinit var retryButton: Button
    
    private val databaseHelper = DatabaseHelper()
    private val tanksList = mutableListOf<TankData>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize views
        recyclerView = findViewById(R.id.recyclerView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        loadingProgressBar = findViewById(R.id.loadingProgressBar)
        airPressureTextView = findViewById(R.id.airPressureValue)
        airPressureCard = findViewById(R.id.airPressureCard)
        errorView = findViewById(R.id.errorView)
        retryButton = findViewById(R.id.retryButton)

        // Set up RecyclerView with GridLayoutManager (2 columns)
        recyclerView.layoutManager = GridLayoutManager(this, 2)
        
        // Initialize tank adapter with empty list
        tankAdapter = TankAdapter(tanksList)
        recyclerView.adapter = tankAdapter

        // Set up swipe to refresh
        swipeRefreshLayout.setOnRefreshListener {
            fetchData()
        }

        // Set up retry button
        retryButton.setOnClickListener {
            loadingProgressBar.visibility = View.VISIBLE
            errorView.visibility = View.GONE
            retryButton.visibility = View.GONE
            fetchData()
        }

        // Initial data fetch
        fetchData()
    }

    private fun fetchData() {
        lifecycleScope.launch {
            try {
                // Show loading indicator
                withContext(Dispatchers.Main) {
                    if (!swipeRefreshLayout.isRefreshing) {
                        loadingProgressBar.visibility = View.VISIBLE
                    }
                    recyclerView.visibility = View.GONE
                    airPressureCard.visibility = View.GONE
                    errorView.visibility = View.GONE
                    retryButton.visibility = View.GONE
                }

                // Perform database query in background
                val result = withContext(Dispatchers.IO) {
                    databaseHelper.fetchTankData()
                }

                // Update UI with results
                withContext(Dispatchers.Main) {
                    if (result.tanks.isNotEmpty()) {
                        tanksList.clear()
                        tanksList.addAll(result.tanks)
                        tankAdapter.notifyDataSetChanged()
                        
                        // Update air pressure
                        airPressureTextView.text = "${result.airPressure} hPa"
                        
                        // Show content
                        recyclerView.visibility = View.VISIBLE
                        airPressureCard.visibility = View.VISIBLE
                    } else {
                        // Show empty state
                        showError("No tank data available")
                    }
                }
            } catch (e: Exception) {
                // Handle errors
                withContext(Dispatchers.Main) {
                    showError("Error fetching data: ${e.message}")
                }
            } finally {
                // Hide loading indicators
                withContext(Dispatchers.Main) {
                    loadingProgressBar.visibility = View.GONE
                    swipeRefreshLayout.isRefreshing = false
                }
            }
        }
    }

    private fun showError(message: String) {
        errorView.text = message
        errorView.visibility = View.VISIBLE
        retryButton.visibility = View.VISIBLE
        recyclerView.visibility = View.GONE
        airPressureCard.visibility = View.GONE
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}

class TankAdapter(private val tanks: List<TankData>) : RecyclerView.Adapter<TankAdapter.TankViewHolder>() {
    
    class TankViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tankTitleTextView: TextView = itemView.findViewById(R.id.tankTitle)
        val tankView: TankView = itemView.findViewById(R.id.tankView)
        val levelTextView: TextView = itemView.findViewById(R.id.levelValue)
        val temperatureTextView: TextView = itemView.findViewById(R.id.temperatureValue)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TankViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.tank_item, parent, false)
        return TankViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: TankViewHolder, position: Int) {
        val tank = tanks[position]
        
        holder.tankTitleTextView.text = "Tank ${position}"
        holder.levelTextView.text = "${tank.level}%"
        holder.temperatureTextView.text = "${tank.temperature}°C"
        
        // Animate the tank level
        holder.tankView.setLevel(tank.level)
    }
    
    override fun getItemCount() = tanks.size
}
