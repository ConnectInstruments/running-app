package com.tanklevel.app

/**
 * Data class to hold tank information
 */
data class TankData(
    val tankNumber: Int,
    val level: Double,        // Tank level (0-100%)
    val temperature: Double,  // Temperature in celsius
    val airPressure: Double   // Air pressure in hPa
)
