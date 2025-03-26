package com.example.tanklevelapp

/**
 * Data class representing tank data
 * @param id Tank ID (0-5)
 * @param level Tank level percentage (0-100)
 * @param temperature Tank temperature in Celsius
 */
data class TankData(
    val id: Int,
    val level: Double,
    var temperature: Double
)
