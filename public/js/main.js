// DOM elements
const refreshButton = document.getElementById('refresh-button');
const statusText = document.getElementById('status-text');
const airPressureElement = document.getElementById('air-pressure');
const currentTimeElement = document.getElementById('current-time');
const totalCapacityElement = document.getElementById('total-capacity');
const utilizedCapacityElement = document.getElementById('utilized-capacity');
const utilizationRateElement = document.getElementById('utilization-rate');
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');
const tabPanels = document.querySelectorAll('.tab-panel');

// Global variables
let lastUpdateTime = null;
let updateInterval = null;
let clockInterval = null;
let tanksConfig = [];

// Tank Management
const addTankBtn = document.getElementById('addTankBtn');
const addTankModal = document.getElementById('addTankModal');
const closeTankModal = document.getElementById('closeTankModal');
const cancelTankAdd = document.getElementById('cancelTankAdd');
const addTankForm = document.getElementById('addTankForm');
const tanksListBody = document.getElementById('tanksListBody');

// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize clock
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    
    // Set up sidebar tab navigation
    setupTabNavigation();
    
    // Load tank configurations and fetch data
    loadTanksConfig().then(() => {
    fetchTankData();
    // Set up automatic refresh every 60 seconds
    updateInterval = setInterval(fetchTankData, 60000);
    });
    
    // Set up manual refresh button
    refreshButton.addEventListener('click', () => {
        statusText.textContent = 'Refreshing data...';
        fetchTankData();
    });
    
    // Load saved theme or use system preference
    loadTheme();
});

// Function to update the clock in the navbar
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    currentTimeElement.querySelector('span').textContent = timeString;
}

// Function to set up tab navigation
function setupTabNavigation() {
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarMenuItems.forEach(menuItem => menuItem.classList.remove('active'));
            item.classList.add('active');
            
            const tabToShow = item.getAttribute('data-tab');
            tabPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(`${tabToShow}-panel`).classList.add('active');
        });
    });
}

// Function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to calculate total capacity
function calculateTotalCapacity() {
    const totalCapacity = tanksConfig.reduce((sum, tank) => sum + tank.capacity, 0);
    totalCapacityElement.textContent = formatNumber(totalCapacity) + ' L';
    return totalCapacity;
}

// Function to fetch tank data from the API
async function fetchTankData() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/tanks?t=${timestamp}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store'
        });
        
        if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch data');
        }
        
        const data = await response.json();
        updateTanks(data);
        updateTemperatureTab(data);
        lastUpdateTime = new Date();
        statusText.textContent = `Last updated: ${lastUpdateTime.toLocaleTimeString()}`;
        
    } catch (error) {
        console.error('Error fetching tank data:', error);
        statusText.textContent = `Error: ${error.message}`;
    }
}

// Function to update tank visualizations
function updateTanks(data) {
    if (!data || !data.tanks) {
        console.error('No data received');
        return;
    }
    
    // Update air pressure display
    const airPressureValue = (typeof data.airPressure === 'number' && !isNaN(data.airPressure)) ? data.airPressure : 0;
    airPressureElement.textContent = `${airPressureValue.toFixed(2)} bar`;
    
    let totalUtilizedVolume = 0;
    const totalCapacity = calculateTotalCapacity();
    
    // Update each tank
    data.tanks.forEach(tank => {
        const tankElement = document.getElementById(`tank${tank.tankNumber}`);
        if (!tankElement) {
            console.error(`Tank element ${tank.tankNumber} not found`);
            return;
        }
        
        const rawLevel = Number(tank.rawLevel || 0);
        totalUtilizedVolume += rawLevel;
        
        const levelElement = tankElement.querySelector('.tank-level');
        const volumeText = tankElement.querySelector('.volume-text span');
        const tempText = tankElement.querySelector('.temp-text span');
        const capacityText = tankElement.querySelector('.tank-capacity');
        
        if (!levelElement || !volumeText || !tempText || !capacityText) {
            console.error(`Missing elements for tank ${tank.tankNumber}`);
            return;
        }
        
        // Set actual level display height based on tank capacity
        const tankCapacity = Number(tank.capacity || 0);
        const levelHeightPercent = tankCapacity > 0 ? 
            Math.min(Math.round((rawLevel / tankCapacity) * 100), 100) : 0;
        levelElement.style.height = `${levelHeightPercent}%`;
        
        // Display volume with formatting
        volumeText.innerHTML = `<i class="fas fa-water"></i> ${formatNumber(rawLevel)}/${formatNumber(tankCapacity)} L`;
        
        // Update capacity display to show percentage filled
        capacityText.textContent = `${levelHeightPercent}%`;
        
        // Update color gradient based on level height percentage
        if (levelHeightPercent < 20) {
            levelElement.style.background = 'linear-gradient(180deg, #fca5a5, #ef4444)';
        } else if (levelHeightPercent < 50) {
            levelElement.style.background = 'linear-gradient(180deg, #fdba74, #f97316)';
        } else {
            levelElement.style.background = 'linear-gradient(180deg, #60a5fa, #3b82f6)';
        }
        
        // Update temperature
        const temperature = (typeof tank.temperature === 'number' && !isNaN(tank.temperature)) ? tank.temperature : 0;
        tempText.textContent = `${temperature.toFixed(1)}°C`;
        
        // Add visual indicator for temperature
        if (temperature > 30) {
            tempText.style.color = '#ef4444';
        } else if (temperature < 10) {
            tempText.style.color = '#3b82f6';
        } else {
            tempText.style.color = '#fff';
        }
    });
    
    // Update utilized capacity and utilization rate
    utilizedCapacityElement.textContent = `${formatNumber(Math.round(totalUtilizedVolume))} L`;
    const utilizationRate = totalCapacity > 0 ? (totalUtilizedVolume / totalCapacity * 100).toFixed(1) : 0;
    utilizationRateElement.textContent = `${utilizationRate}%`;
}

// Function to update temperature tab
function updateTemperatureTab(data) {
    if (!data || !data.tanks) {
        console.error('Invalid data for temperature tab');
        return;
    }

    const tempReadings = document.querySelector('.temp-readings');
    tempReadings.innerHTML = ''; // Clear existing temperature cards

    data.tanks.forEach(tank => {
        const tempCard = document.createElement('div');
        tempCard.className = 'temp-card';
        tempCard.id = `temp-card-${tank.tankNumber}`;
        
        const temperature = Number(tank.temperature || 0);
        const tempColor = temperature > 30 ? '#ef4444' : temperature < 10 ? '#3b82f6' : '#fff';
        
        tempCard.innerHTML = `
            <div class="temp-title">${tank.name}</div>
            <div class="temp-value" style="color: ${tempColor}">${temperature.toFixed(1)}°C</div>
        `;
        
        tempReadings.appendChild(tempCard);
    });
}

// Load tanks configuration from API
async function loadTanksConfig() {
    try {
        const response = await fetch('/api/tanks/config');
        if (!response.ok) {
            throw new Error('Failed to fetch tank configurations');
        }
        tanksConfig = await response.json();
        renderTanksList();
        updateTankPanels();
    } catch (error) {
        console.error('Error loading tank configurations:', error);
        statusText.textContent = `Error: ${error.message}`;
    }
}

// Save tank configuration to API
async function saveTankConfig(tankData) {
    try {
        const response = await fetch('/api/tanks/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: tankData.name,
                capacity: tankData.capacity,
                levelField: tankData.levelField,
                tempField: tankData.tempField
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save tank configuration');
        }
        
        await loadTanksConfig();
    } catch (error) {
        console.error('Error saving tank configuration:', error);
        alert('Failed to save tank configuration: ' + error.message);
    }
}

// Update tank configuration
async function updateTankConfig(id, tankData) {
    try {
        const response = await fetch(`/api/tanks/config/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: tankData.name,
                capacity: tankData.capacity,
                levelField: tankData.levelField,
                tempField: tankData.tempField
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update tank configuration');
        }
        
        await loadTanksConfig();
    } catch (error) {
        console.error('Error updating tank configuration:', error);
        alert('Failed to update tank configuration: ' + error.message);
    }
}

// Delete tank configuration
async function deleteTankConfig(id) {
    try {
        const response = await fetch(`/api/tanks/config/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete tank configuration');
        }
        
        await loadTanksConfig();
    } catch (error) {
        console.error('Error deleting tank configuration:', error);
        alert('Failed to delete tank configuration: ' + error.message);
    }
}

// Render tanks list in settings
function renderTanksList() {
    tanksListBody.innerHTML = '';
    tanksConfig.forEach(tank => {
        const tankItem = document.createElement('div');
        tankItem.className = 'tank-item';
        tankItem.innerHTML = `
            <div>${tank.name}</div>
            <div>${formatNumber(tank.capacity)} L</div>
            <div>${tank.level_field}</div>
            <div>${tank.temp_field}</div>
            <div class="tank-actions">
                <button class="edit-btn" onclick="editTank(${tank.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTank(${tank.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        tanksListBody.appendChild(tankItem);
    });
}

// Update tank panels in the main view
function updateTankPanels() {
    const tankLevelsPanel = document.getElementById('tank-levels-panel');
    const tanksContainer = tankLevelsPanel.querySelector('.tanks-container');
    tanksContainer.innerHTML = '';
    
    // Create rows of 3 tanks each
    for (let i = 0; i < tanksConfig.length; i += 3) {
        const row = document.createElement('div');
        row.className = 'tanks-row';
        
        // Add up to 3 tanks in this row
        for (let j = i; j < Math.min(i + 3, tanksConfig.length); j++) {
            const tank = tanksConfig[j];
            const tankHtml = `
                <div class="tank-wrapper">
                    <div class="tank" id="tank${tank.id}">
                        <div class="tank-label">
                            <i class="fas fa-tint"></i> ${tank.name}
                        </div>
                        <div class="tank-capacity">${formatNumber(tank.capacity)} L</div>
                        <div class="tank-container">
                            <div class="tank-level"></div>
                            <div class="tank-markings">
                                <span>100%</span>
                                <span>50%</span>
                                <span>0%</span>
                            </div>
                        </div>
                        <div class="tank-info">
                            <div class="volume-text">
                                <span>0 L</span>
                            </div>
                            <div class="temp-text">
                                <i class="fas fa-temperature-high"></i>
                                <span>0.0°C</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            row.innerHTML += tankHtml;
        }
        
        tanksContainer.appendChild(row);
    }
}

// Add new tank
async function addTank(tankData) {
    await saveTankConfig(tankData);
    closeModal();
}

// Edit existing tank
function editTank(id) {
    const tank = tanksConfig.find(t => t.id === id);
    if (!tank) return;
    
    document.getElementById('tankName').value = tank.name;
    document.getElementById('tankCapacity').value = tank.capacity;
    document.getElementById('levelField').value = tank.level_field;
    document.getElementById('tempField').value = tank.temp_field;
    
    addTankForm.onsubmit = async (e) => {
        e.preventDefault();
        await updateTankConfig(id, {
            name: document.getElementById('tankName').value,
            capacity: parseInt(document.getElementById('tankCapacity').value),
            levelField: document.getElementById('levelField').value,
            tempField: document.getElementById('tempField').value
        });
        closeModal();
    };
    
    openModal();
}

// Delete tank
async function deleteTank(id) {
    if (confirm('Are you sure you want to delete this tank?')) {
        await deleteTankConfig(id);
    }
}

// Modal functions
function openModal() {
    addTankModal.classList.add('active');
}

function closeModal() {
    addTankModal.classList.remove('active');
    addTankForm.reset();
    addTankForm.onsubmit = handleAddTankSubmit;
}

// Event listeners
addTankBtn.addEventListener('click', openModal);
closeTankModal.addEventListener('click', closeModal);
cancelTankAdd.addEventListener('click', closeModal);

async function handleAddTankSubmit(e) {
    e.preventDefault();
    const newTank = {
        name: document.getElementById('tankName').value,
        capacity: parseInt(document.getElementById('tankCapacity').value),
        levelField: document.getElementById('levelField').value,
        tempField: document.getElementById('tempField').value
    };
    await addTank(newTank);
}

addTankForm.onsubmit = handleAddTankSubmit;

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) clearInterval(updateInterval);
    if (clockInterval) clearInterval(clockInterval);
});

// Load saved theme or use system preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    }
}

// Update theme icon based on current theme
function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});