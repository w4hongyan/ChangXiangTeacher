<template>
  <div class="ppt-charts">
    <!-- 柱状图 -->
    <div v-if="chartType === 'bar'" class="chart-container bar-chart">
      <div class="chart-title" v-if="title">{{ title }}</div>
      <div class="chart-content">
        <div class="chart-y-axis">
          <div v-for="(label, index) in yAxisLabels" :key="index" class="y-axis-label">
            {{ label }}
          </div>
        </div>
        <div class="chart-bars">
          <div v-for="(item, index) in chartData" :key="index" class="bar-group">
            <div 
              class="bar" 
              :style="{
                height: `${(item.value / maxValue) * 100}%`,
                background: getBarColor(index),
                animationDelay: `${index * 0.1}s`
              }"
            >
              <div class="bar-value">{{ item.value }}</div>
            </div>
            <div class="bar-label">{{ item.label }}</div>
          </div>
        </div>
      </div>
      <div class="chart-legend" v-if="showLegend">
        <div v-for="(item, index) in chartData" :key="index" class="legend-item">
          <div class="legend-color" :style="{ background: getBarColor(index) }"></div>
          <span class="legend-text">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 饼图 -->
    <div v-else-if="chartType === 'pie'" class="chart-container pie-chart">
      <div class="chart-title" v-if="title">{{ title }}</div>
      <div class="chart-content">
        <div class="pie-container">
          <svg class="pie-svg" viewBox="0 0 200 200">
            <circle 
              v-for="(segment, index) in pieSegments" 
              :key="index"
              class="pie-segment"
              :cx="100" 
              :cy="100" 
              :r="80"
              :stroke="segment.color"
              :stroke-width="40"
              :stroke-dasharray="`${segment.circumference} ${totalCircumference - segment.circumference}`"
              :stroke-dashoffset="segment.offset"
              :style="{ animationDelay: `${index * 0.2}s` }"
              fill="transparent"
            />
          </svg>
          <div class="pie-center">
            <div class="pie-total">{{ totalValue }}</div>
            <div class="pie-label">总计</div>
          </div>
        </div>
        <div class="pie-legend">
          <div v-for="(item, index) in chartData" :key="index" class="legend-item">
            <div class="legend-color" :style="{ background: getPieColor(index) }"></div>
            <div class="legend-info">
              <span class="legend-text">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }} ({{ getPercentage(item.value) }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 折线图 -->
    <div v-else-if="chartType === 'line'" class="chart-container line-chart">
      <div class="chart-title" v-if="title">{{ title }}</div>
      <div class="chart-content">
        <div class="chart-y-axis">
          <div v-for="(label, index) in yAxisLabels" :key="index" class="y-axis-label">
            {{ label }}
          </div>
        </div>
        <div class="line-chart-area">
          <svg class="line-svg" :viewBox="`0 0 ${chartWidth} ${chartHeight}`">
            <!-- 网格线 -->
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" :stroke="theme.colors.text.light" stroke-width="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <!-- 折线 -->
            <polyline
              class="line-path"
              :points="linePoints"
              fill="none"
              :stroke="theme.colors.primary"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- 数据点 -->
            <circle
              v-for="(point, index) in dataPoints"
              :key="index"
              class="data-point"
              :cx="point.x"
              :cy="point.y"
              r="4"
              :fill="theme.colors.accent"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <title>{{ chartData[index].label }}: {{ chartData[index].value }}</title>
            </circle>
          </svg>
          <div class="chart-x-axis">
            <div v-for="(item, index) in chartData" :key="index" class="x-axis-label">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 面积图 -->
    <div v-else-if="chartType === 'area'" class="chart-container area-chart">
      <div class="chart-title" v-if="title">{{ title }}</div>
      <div class="chart-content">
        <div class="chart-y-axis">
          <div v-for="(label, index) in yAxisLabels" :key="index" class="y-axis-label">
            {{ label }}
          </div>
        </div>
        <div class="area-chart-area">
          <svg class="area-svg" :viewBox="`0 0 ${chartWidth} ${chartHeight}`">
            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="theme.colors.primary" stop-opacity="0.8"/>
                <stop offset="100%" :stop-color="theme.colors.primary" stop-opacity="0.1"/>
              </linearGradient>
            </defs>
            
            <!-- 面积 -->
            <path
              class="area-path"
              :d="areaPath"
              fill="url(#areaGradient)"
            />
            
            <!-- 边界线 -->
            <polyline
              class="area-line"
              :points="linePoints"
              fill="none"
              :stroke="theme.colors.primary"
              stroke-width="2"
            />
            
            <!-- 数据点 -->
            <circle
              v-for="(point, index) in dataPoints"
              :key="index"
              class="data-point"
              :cx="point.x"
              :cy="point.y"
              r="3"
              :fill="theme.colors.accent"
              :style="{ animationDelay: `${index * 0.1}s` }"
            />
          </svg>
          <div class="chart-x-axis">
            <div v-for="(item, index) in chartData" :key="index" class="x-axis-label">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 环形图 -->
    <div v-else-if="chartType === 'doughnut'" class="chart-container doughnut-chart">
      <div class="chart-title" v-if="title">{{ title }}</div>
      <div class="chart-content">
        <div class="doughnut-container">
          <svg class="doughnut-svg" viewBox="0 0 200 200">
            <circle 
              v-for="(segment, index) in pieSegments" 
              :key="index"
              class="doughnut-segment"
              :cx="100" 
              :cy="100" 
              :r="70"
              :stroke="segment.color"
              :stroke-width="25"
              :stroke-dasharray="`${segment.circumference} ${totalCircumference - segment.circumference}`"
              :stroke-dashoffset="segment.offset"
              :style="{ animationDelay: `${index * 0.2}s` }"
              fill="transparent"
            />
          </svg>
          <div class="doughnut-center">
            <div class="doughnut-total">{{ totalValue }}</div>
            <div class="doughnut-label">总计</div>
          </div>
        </div>
        <div class="doughnut-legend">
          <div v-for="(item, index) in chartData" :key="index" class="legend-item">
            <div class="legend-color" :style="{ background: getPieColor(index) }"></div>
            <div class="legend-info">
              <span class="legend-text">{{ item.label }}</span>
              <span class="legend-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 默认占位图表 -->
    <div v-else class="chart-container placeholder-chart">
      <div class="chart-title" v-if="title">{{ title }}</div>
      <div class="chart-placeholder">
        <div class="placeholder-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
        </div>
        <p class="placeholder-text">{{ chartType || '数据图表' }}</p>
        <p class="placeholder-desc">暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PPTTheme } from '../../utils/pptThemes'

interface ChartData {
  label: string
  value: number
}

interface Props {
  chartType: 'bar' | 'pie' | 'line' | 'area' | 'doughnut' | string
  chartData: ChartData[]
  title?: string
  theme: PPTTheme
  showLegend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLegend: true
})

// 图表尺寸
const chartWidth = 400
const chartHeight = 250

// 计算最大值
const maxValue = computed(() => {
  return Math.max(...props.chartData.map(item => item.value))
})

// 计算总值
const totalValue = computed(() => {
  return props.chartData.reduce((sum, item) => sum + item.value, 0)
})

// Y轴标签
const yAxisLabels = computed(() => {
  const max = maxValue.value
  const step = Math.ceil(max / 5)
  return Array.from({ length: 6 }, (_, i) => (5 - i) * step)
})

// 获取柱状图颜色
const getBarColor = (index: number): string => {
  const colors = [
    props.theme.colors.primary,
    props.theme.colors.secondary,
    props.theme.colors.accent,
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7'
  ]
  return colors[index % colors.length]
}

// 获取饼图颜色
const getPieColor = (index: number): string => {
  return getBarColor(index)
}

// 计算百分比
const getPercentage = (value: number): string => {
  return ((value / totalValue.value) * 100).toFixed(1)
}

// 饼图分段
const totalCircumference = 2 * Math.PI * 80
const pieSegments = computed(() => {
  let currentOffset = 0
  return props.chartData.map((item, index) => {
    const percentage = item.value / totalValue.value
    const circumference = percentage * totalCircumference
    const segment = {
      circumference,
      offset: -currentOffset,
      color: getPieColor(index)
    }
    currentOffset += circumference
    return segment
  })
})

// 折线图数据点
const dataPoints = computed(() => {
  const padding = 40
  const width = chartWidth - padding * 2
  const height = chartHeight - padding * 2
  
  return props.chartData.map((item, index) => {
    const x = padding + (index / (props.chartData.length - 1)) * width
    const y = padding + height - (item.value / maxValue.value) * height
    return { x, y }
  })
})

// 折线图路径点
const linePoints = computed(() => {
  return dataPoints.value.map(point => `${point.x},${point.y}`).join(' ')
})

// 面积图路径
const areaPath = computed(() => {
  if (dataPoints.value.length === 0) return ''
  
  const points = dataPoints.value
  const padding = 40
  const height = chartHeight - padding
  
  let path = `M ${points[0].x} ${height}`
  points.forEach(point => {
    path += ` L ${point.x} ${point.y}`
  })
  path += ` L ${points[points.length - 1].x} ${height} Z`
  
  return path
})
</script>

<style scoped>
.ppt-charts {
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ppt-text-primary, #2c3e50);
  margin-bottom: 20px;
  text-align: center;
}

.chart-content {
  flex: 1;
  display: flex;
  position: relative;
}

/* 柱状图样式 */
.bar-chart .chart-content {
  align-items: flex-end;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 40px;
  height: 200px;
  margin-right: 10px;
}

.y-axis-label {
  font-size: 12px;
  color: var(--ppt-text-light, #6c757d);
  text-align: right;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  position: relative;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.bar {
  width: 100%;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  position: relative;
  animation: barGrow 0.8s ease-out forwards;
  transform-origin: bottom;
  transform: scaleY(0);
  margin-bottom: 8px;
}

@keyframes barGrow {
  to {
    transform: scaleY(1);
  }
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--ppt-text-primary, #2c3e50);
  white-space: nowrap;
}

.bar-label {
  font-size: 11px;
  color: var(--ppt-text-secondary, #6c757d);
  text-align: center;
  margin-top: 4px;
  line-height: 1.2;
}

/* 饼图样式 */
.pie-chart .chart-content,
.doughnut-chart .chart-content {
  align-items: center;
  gap: 30px;
}

.pie-container,
.doughnut-container {
  position: relative;
  width: 200px;
  height: 200px;
}

.pie-svg,
.doughnut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.pie-segment,
.doughnut-segment {
  transition: stroke-width 0.3s ease;
  animation: segmentGrow 1s ease-out forwards;
  stroke-dashoffset: 502; /* 2 * π * 80 */
}

@keyframes segmentGrow {
  from {
    stroke-dashoffset: 502;
  }
}

.pie-segment:hover,
.doughnut-segment:hover {
  stroke-width: 45;
}

.doughnut-segment:hover {
  stroke-width: 30;
}

.pie-center,
.doughnut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-total,
.doughnut-total {
  font-size: 24px;
  font-weight: 700;
  color: var(--ppt-primary, #2c5282);
}

.pie-label,
.doughnut-label {
  font-size: 12px;
  color: var(--ppt-text-light, #6c757d);
  margin-top: 4px;
}

.pie-legend,
.doughnut-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 折线图和面积图样式 */
.line-chart .chart-content,
.area-chart .chart-content {
  align-items: flex-start;
}

.line-chart-area,
.area-chart-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.line-svg,
.area-svg {
  width: 100%;
  height: 200px;
  border: 1px solid var(--ppt-surface, #f8f9fa);
  border-radius: 4px;
}

.line-path {
  animation: pathDraw 2s ease-out forwards;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

.area-path {
  animation: areaFill 1.5s ease-out forwards;
  opacity: 0;
}

.area-line {
  animation: pathDraw 2s ease-out forwards;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
}

@keyframes pathDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes areaFill {
  to {
    opacity: 1;
  }
}

.data-point {
  animation: pointAppear 0.5s ease-out forwards;
  transform: scale(0);
}

@keyframes pointAppear {
  to {
    transform: scale(1);
  }
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 20px;
}

.x-axis-label {
  font-size: 11px;
  color: var(--ppt-text-light, #6c757d);
  text-align: center;
}

/* 图例样式 */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 12px;
  color: var(--ppt-text-secondary, #6c757d);
}

.legend-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.legend-value {
  font-size: 11px;
  color: var(--ppt-text-light, #6c757d);
}

/* 占位图表样式 */
.placeholder-chart {
  justify-content: center;
  align-items: center;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ppt-text-light, #6c757d);
  text-align: center;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  color: var(--ppt-accent, #38B2AC);
}

.placeholder-text {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--ppt-text-secondary, #6c757d);
}

.placeholder-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-container {
    padding: 16px;
  }
  
  .pie-chart .chart-content,
  .doughnut-chart .chart-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .pie-container,
  .doughnut-container {
    width: 160px;
    height: 160px;
  }
  
  .chart-bars {
    height: 150px;
  }
  
  .line-svg,
  .area-svg {
    height: 150px;
  }
}
</style>