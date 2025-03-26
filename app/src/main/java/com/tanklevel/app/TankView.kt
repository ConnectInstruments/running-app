package com.tanklevel.app

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.animation.doOnEnd

class TankView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private var tankNumber: Int = 0
    private var level: Double = 0.0
    private var temperature: Double = 0.0
    
    private var currentDisplayedLevel: Float = 0f
    private val animator = ValueAnimator()
    
    private lateinit var levelView: View
    private lateinit var tankNumberText: TextView
    private lateinit var levelText: TextView
    private lateinit var temperatureText: TextView
    
    private val tankPaint = Paint().apply {
        color = Color.rgb(0, 150, 255) // Blue color for the tank liquid
        style = Paint.Style.FILL
    }
    
    private val tankBorderPaint = Paint().apply {
        color = Color.rgb(70, 70, 70) // Dark grey for tank border
        style = Paint.Style.STROKE
        strokeWidth = 5f
    }
    
    init {
        inflate(context, R.layout.tank_view, this)
        
        levelView = findViewById(R.id.tankLevelView)
        tankNumberText = findViewById(R.id.tankNumberText)
        levelText = findViewById(R.id.levelText)
        temperatureText = findViewById(R.id.temperatureText)
    }
    
    fun setTankData(tankData: TankData) {
        this.tankNumber = tankData.tankNumber
        this.level = tankData.level
        this.temperature = tankData.temperature
        
        // Update the UI
        tankNumberText.text = "Tank ${tankData.tankNumber}"
        levelText.text = String.format("%.1f%%", tankData.level)
        temperatureText.text = String.format("%.1f°C", tankData.temperature)
        
        // Animate the tank level
        animateTankLevel(tankData.level.toFloat())
        
        invalidate()
    }
    
    private fun animateTankLevel(newLevel: Float) {
        animator.cancel()
        
        animator.setFloatValues(currentDisplayedLevel, newLevel)
        animator.duration = 1000
        animator.interpolator = DecelerateInterpolator()
        
        animator.addUpdateListener { animation ->
            currentDisplayedLevel = animation.animatedValue as Float
            updateLevelView()
        }
        
        animator.doOnEnd {
            currentDisplayedLevel = newLevel
        }
        
        animator.start()
    }
    
    private fun updateLevelView() {
        // Calculate height based on level percentage
        val layoutParams = levelView.layoutParams
        val parentHeight = (parent as? android.view.View)?.height ?: height
        
        layoutParams.height = (parentHeight * (currentDisplayedLevel / 100f)).toInt()
        levelView.layoutParams = layoutParams
        
        // Change color based on level
        val levelColor = when {
            currentDisplayedLevel < 20 -> Color.RED
            currentDisplayedLevel < 50 -> Color.YELLOW
            else -> Color.rgb(0, 150, 255) // Blue
        }
        
        levelView.setBackgroundColor(levelColor)
    }
}
