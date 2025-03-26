// DOM elements
const refreshButton = document.getElementById('refresh-button');
const statusText = document.getElementById('status-text');
const airPressureElement = document.getElementById('air-pressure');

// Global variables
let lastUpdateTime = null;
let updateInterval = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Fetch tank data when the page loads
    fetchTankData();
    
    // Set up automatic refresh every 60 seconds
    updateInterval = setInterval(fetchTankData, 60000);
    
    // Set up manual refresh button
    refreshButton.addEventListener('click', () => {
        statusText.textContent = 'Refreshing data...';
        fetchTankData();
    });
});

// Function to fetch tank data from the API
async function fetchTankData() {
    try {
        const response = await fetch('/api/tanks');
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data');
        }
        
        const data = await response.json();
        updateTanks(data);
        lastUpdateTime = new Date();
        
        // Update status text with last update time
        const timeString = lastUpdateTime.toLocaleTimeString();
        statusText.textContent = `Last updated: ${timeString}`;
        
    } catch (error) {
        console.error('Error fetching tank data:', error);
        statusText.textContent = `Error: ${error.message}`;
    }
}

// Function to update tank visualizations
function updateTanks(data) {
    // Update air pressure display
    airPressureElement.textContent = `Air Pressure: ${data.airPressure.toFixed(2)} hPa`;
    
    // Update each tank
    data.tanks.forEach(tank => {
        const tankElement = document.getElementById(`tank${tank.tankNumber}`);
        if (!tankElement) return;
        
        // Update level
        const levelPercent = Math.min(Math.max(tank.level, 0), 100); // Ensure between 0-100
        const levelElement = tankElement.querySelector('.tank-level');
        const levelText = tankElement.querySelector('.level-text');
        
        levelElement.style.height = `${levelPercent}%`;
        levelText.textContent = `${levelPercent.toFixed(1)}%`;
        
        // Update color based on level
        if (levelPercent < 20) {
            levelElement.style.backgroundColor = '#ff3b30'; // Red for low level
        } else if (levelPercent < 50) {
            levelElement.style.backgroundColor = '#ff9500'; // Orange for medium level
        } else {
            levelElement.style.backgroundColor = '#0096ff'; // Blue for good level
        }
        
        // Update temperature
        const tempText = tankElement.querySelector('.temp-text');
        tempText.textContent = `${tank.temperature.toFixed(1)}°C`;
        
        // Optional: Add visual indicator for temperature
        if (tank.temperature > 30) {
            tempText.style.color = '#ff3b30'; // Red for high temperature
        } else if (tank.temperature < 10) {
            tempText.style.color = '#007aff'; // Blue for low temperature
        } else {
            tempText.style.color = '#666'; // Default color
        }
    });
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});