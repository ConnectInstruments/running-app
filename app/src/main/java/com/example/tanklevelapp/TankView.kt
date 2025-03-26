package com.example.tanklevelapp

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import android.view.animation.DecelerateInterpolator

/**
 * Custom view to display an animated tank level
 */
class TankView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val tankPaint = Paint().apply {
        color = Color.LTGRAY
        style = Paint.Style.STROKE
        strokeWidth = 4f
    }
    
    private val liquidPaint = Paint().apply {
        color = Color.BLUE
        style = Paint.Style.FILL
    }
    
    private val tankRect = RectF()
    private val liquidRect = RectF()
    
    private var currentLevel = 0f
    private var cornerRadius = 16f
    
    /**
     * Set the level of the tank and animate to it
     * @param level Tank level percentage (0-100)
     */
    fun setLevel(level: Double) {
        val targetLevel = level.toFloat()
        val animator = ValueAnimator.ofFloat(currentLevel, targetLevel)
        animator.interpolator = DecelerateInterpolator()
        animator.duration = 1000
        animator.addUpdateListener { animation ->
            currentLevel = animation.animatedValue as Float
            invalidate()
        }
        animator.start()
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        
        // Calculate the tank rectangle
        val padding = 16f
        tankRect.set(padding, padding, width - padding, height - padding)
        
        // Update the liquid rectangle based on the current level
        updateLiquidRect()
    }
    
    private fun updateLiquidRect() {
        val levelHeight = (tankRect.height() * currentLevel / 100f)
        liquidRect.set(
            tankRect.left,
            tankRect.bottom - levelHeight,
            tankRect.right,
            tankRect.bottom
        )
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        // Update the liquid rectangle
        updateLiquidRect()
        
        // Draw the liquid
        canvas.drawRoundRect(liquidRect, cornerRadius, cornerRadius, liquidPaint)
        
        // Draw the tank outline
        canvas.drawRoundRect(tankRect, cornerRadius, cornerRadius, tankPaint)
    }
}
