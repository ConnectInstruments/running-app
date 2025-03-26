// DOM elements
const refreshButton = document.getElementById('refresh-button');
const statusText = document.getElementById('status-text');
const airPressureElement = document.getElementById('air-pressure');
const currentTimeElement = document.getElementById('current-time');
const totalCapacityElement = document.getElementById('total-capacity');
const utilizedCapacityElement = document.getElementById('utilized-capacity');
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
const tabPanels = document.querySelectorAll('.tab-panel');

// Tank capacities in liters
const TANK_CAPACITIES = {
    0: 20000,  // Tank 0: 20,000 L
    1: 150000, // Tank 1: 150,000 L
    2: 150000, // Tank 2: 150,000 L
    3: 150000, // Tank 3: 150,000 L
    4: 150000, // Tank 4: 150,000 L
    5: 150000  // Tank 5: 150,000 L
};

// Global variables
let lastUpdateTime = null;
let updateInterval = null;
let clockInterval = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize clock
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    
    // Set up sidebar tab navigation
    setupTabNavigation();
    
    // Fetch tank data when the page loads
    fetchTankData();
    
    // Set up automatic refresh every 60 seconds
    updateInterval = setInterval(fetchTankData, 60000);
    
    // Set up manual refresh button
    refreshButton.addEventListener('click', () => {
        statusText.textContent = 'Refreshing data...';
        fetchTankData();
    });
    
    // Calculate and display total capacity
    calculateTotalCapacity();
});

// Function to update the clock in the navbar
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    currentTimeElement.textContent = timeString;
}

// Function to set up tab navigation
function setupTabNavigation() {
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all menu items
            sidebarMenuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            // Add active class to clicked menu item
            item.classList.add('active');
            
            // Get the tab to show
            const tabToShow = item.getAttribute('data-tab');
            
            // Hide all tab panels
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Show the selected tab panel
            document.getElementById(`${tabToShow}-panel`).classList.add('active');
        });
    });
}

// Function to calculate and display total capacity
function calculateTotalCapacity() {
    const totalCapacity = Object.values(TANK_CAPACITIES).reduce((sum, capacity) => sum + capacity, 0);
    totalCapacityElement.textContent = formatNumber(totalCapacity) + ' L';
}

// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to fetch tank data from the API
async function fetchTankData() {
    try {
        const response = await fetch('/api/tanks');
        
        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
            } catch (e) {
                throw new Error('Failed to fetch data: ' + response.status);
            }
        }
        
        const data = await response.json();
        updateTanks(data);
        updateTemperatureTab(data);
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
    airPressureElement.textContent = `${data.airPressure.toFixed(2)} hPa`;
    
    let totalUtilizedVolume = 0;
    
    // Update each tank
    data.tanks.forEach(tank => {
        const tankElement = document.getElementById(`tank${tank.tankNumber}`);
        if (!tankElement) return;
        
        // Get raw tank data from server
        const rawLevel = tank.rawLevel;
        totalUtilizedVolume += rawLevel;
        
        const levelElement = tankElement.querySelector('.tank-level');
        const volumeText = tankElement.querySelector('.volume-text');
        
        // Set actual level display height based on tank capacity
        const levelHeightPercent = Math.min(Math.round((rawLevel / tank.capacity) * 100), 100);
        levelElement.style.height = `${levelHeightPercent}%`;
        
        // Display volume with formatting
        volumeText.textContent = `${formatNumber(rawLevel)} L`;
        
        // Add data attribute for raw level for debugging
        tankElement.setAttribute('data-raw-level', tank.rawLevel);
        
        // Update color based on level height percentage
        if (levelHeightPercent < 20) {
            levelElement.style.backgroundColor = '#ef4444'; // Red for low level
        } else if (levelHeightPercent < 50) {
            levelElement.style.backgroundColor = '#f97316'; // Orange for medium level
        } else {
            levelElement.style.backgroundColor = '#3b82f6'; // Blue for good level
        }
        
        // Update temperature
        const tempText = tankElement.querySelector('.temp-text');
        tempText.textContent = `${tank.temperature.toFixed(1)}°C`;
        
        // Add visual indicator for temperature
        if (tank.temperature > 30) {
            tempText.style.color = '#ef4444'; // Red for high temperature
        } else if (tank.temperature < 10) {
            tempText.style.color = '#3b82f6'; // Blue for low temperature
        } else {
            tempText.style.color = '#555'; // Default color
        }
    });
    
    // Update utilized capacity
    utilizedCapacityElement.textContent = `${formatNumber(Math.round(totalUtilizedVolume))} L`;
    
    // Add diagnostic info in console
    console.log('Raw data from server:', data.rawData);
}

// Function to update temperature tab
function updateTemperatureTab(data) {
    data.tanks.forEach(tank => {
        if (tank.tankNumber > 4) return; // Only tanks 0-4 have temperatures
        
        const tempCard = document.getElementById(`temp-card-${tank.tankNumber}`);
        if (!tempCard) return;
        
        const tempValue = tempCard.querySelector('.temp-value');
        tempValue.textContent = `${tank.temperature.toFixed(1)}°C`;
        
        // Color coding based on temperature
        if (tank.temperature > 30) {
            tempValue.style.color = '#ef4444'; // Red for high temperature
        } else if (tank.temperature < 10) {
            tempValue.style.color = '#3b82f6'; // Blue for low temperature
        } else {
            tempValue.style.color = '#1e3a8a'; // Default color
        }
    });
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    if (clockInterval) {
        clearInterval(clockInterval);
    }
});