<template>
  <div class="ppt-layouts">
    <!-- 标题页布局 -->
    <div v-if="layout === 'title'" class="ppt-slide ppt-title-slide" :style="themeStyles">
      <div class="title-container">
        <div class="title-icon">
          <PPTIcons 
            :name="slide.icon || 'lightbulb'" 
            :size="48" 
            :theme="theme"
          />
        </div>
        <h1 class="main-title">{{ slide.title }}</h1>
        <h2 v-if="slide.subtitle" class="subtitle">{{ slide.subtitle }}</h2>
        <div v-if="slide.author" class="author-info">
          <span class="author">
            <PPTIcons name="team" :size="16" :theme="theme" />
            {{ slide.author }}
          </span>
          <span v-if="slide.date" class="date">
            <PPTIcons name="calendar" :size="16" :theme="theme" />
            {{ slide.date }}
          </span>
        </div>
      </div>
      <div class="title-decoration">
        <div class="decoration-line"></div>
        <div class="decoration-accent"></div>
      </div>
    </div>

    <!-- 内容页布局 -->
    <div v-else-if="layout === 'content'" class="ppt-slide ppt-content-slide" :style="themeStyles">
      <div class="slide-header">
        <h2 class="slide-title">{{ slide.title }}</h2>
        <div class="title-underline"></div>
      </div>
      <div class="slide-content">
        <div class="content-main">
          <ul v-if="slide.content && Array.isArray(slide.content)" class="content-list">
            <li v-for="(item, index) in slide.content" :key="index" class="content-item">
              <span class="bullet-point"></span>
              <span class="item-text">{{ item }}</span>
            </li>
          </ul>
          <div v-else-if="slide.content" class="content-text" v-html="formatContent(slide.content)"></div>
        </div>
        <div v-if="slide.image" class="content-visual">
          <div class="image-container">
            <img :src="slide.image" :alt="slide.title" class="slide-image" />
            <div class="image-overlay"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 两栏布局 -->
    <div v-else-if="layout === 'two-column'" class="ppt-slide ppt-two-column-slide" :style="themeStyles">
      <div class="slide-header">
        <h2 class="slide-title">{{ slide.title }}</h2>
        <div class="title-underline"></div>
      </div>
      <div class="two-column-content">
        <div class="column column-left">
          <h3 v-if="slide.leftTitle" class="column-title">{{ slide.leftTitle }}</h3>
          <ul v-if="slide.leftContent && Array.isArray(slide.leftContent)" class="content-list">
            <li v-for="(item, index) in slide.leftContent" :key="index" class="content-item">
              <span class="bullet-point"></span>
              <span class="item-text">{{ item }}</span>
            </li>
          </ul>
          <div v-else-if="slide.leftContent" class="content-text" v-html="formatContent(slide.leftContent)"></div>
        </div>
        <div class="column-divider"></div>
        <div class="column column-right">
          <h3 v-if="slide.rightTitle" class="column-title">{{ slide.rightTitle }}</h3>
          <ul v-if="slide.rightContent && Array.isArray(slide.rightContent)" class="content-list">
            <li v-for="(item, index) in slide.rightContent" :key="index" class="content-item">
              <span class="bullet-point"></span>
              <span class="item-text">{{ item }}</span>
            </li>
          </ul>
          <div v-else-if="slide.rightContent" class="content-text" v-html="formatContent(slide.rightContent)"></div>
          <div v-if="slide.rightImage" class="image-container">
            <img :src="slide.rightImage" :alt="slide.rightTitle || slide.title" class="slide-image" />
            <div class="image-overlay"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表布局 -->
    <div v-else-if="layout === 'chart'" class="ppt-slide ppt-chart-slide" :style="themeStyles">
      <div class="slide-header">
        <h2 class="slide-title">{{ slide.title }}</h2>
        <div class="title-underline"></div>
      </div>
      <div class="chart-content">
        <div class="chart-container">
          <PPTCharts 
            v-if="slide.chartData && slide.chartData.length > 0"
            :chart-type="slide.chartType || 'bar'"
            :chart-data="slide.chartData"
            :title="slide.chartTitle"
            :theme="theme"
            :show-legend="slide.showLegend !== false"
          />
          <div v-else class="chart-placeholder">
            <div class="chart-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <p class="chart-label">{{ slide.chartType || '数据图表' }}</p>
            <p class="chart-desc">暂无数据</p>
          </div>
        </div>
        <div v-if="slide.description" class="chart-description">
          <div class="description-content" v-html="formatContent(slide.description)"></div>
        </div>
      </div>
    </div>

    <!-- 图片展示布局 -->
    <div v-else-if="layout === 'image-focus'" class="ppt-slide ppt-image-focus-slide" :style="themeStyles">
      <div class="slide-header">
        <h2 class="slide-title">{{ slide.title }}</h2>
        <div class="title-underline"></div>
      </div>
      <div class="image-focus-content">
        <div class="main-image-container">
          <img v-if="slide.image" :src="slide.image" :alt="slide.title" class="main-image" />
          <div v-else class="image-placeholder">
            <div class="placeholder-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
            <p>图片展示区域</p>
          </div>
          <div class="image-overlay"></div>
        </div>
        <div v-if="slide.caption" class="image-caption">
          <p>{{ slide.caption }}</p>
        </div>
      </div>
    </div>

    <!-- 总结页布局 -->
    <div v-else-if="layout === 'summary'" class="ppt-slide ppt-summary-slide" :style="themeStyles">
      <div class="summary-header">
        <h2 class="slide-title">{{ slide.title || '总结' }}</h2>
        <div class="title-underline"></div>
      </div>
      <div class="summary-content">
        <div class="key-points">
          <ul v-if="slide.keyPoints && Array.isArray(slide.keyPoints)" class="summary-list">
            <li v-for="(point, index) in slide.keyPoints" :key="index" class="summary-item">
              <div class="point-number">{{ index + 1 }}</div>
              <div class="point-content">
                <h4 v-if="point.title" class="point-title">{{ point.title }}</h4>
                <p class="point-text">{{ point.content || point }}</p>
              </div>
            </li>
          </ul>
          <div v-else-if="slide.content" class="summary-text" v-html="formatContent(slide.content)"></div>
        </div>
        <div class="summary-decoration">
          <div class="decoration-circle"></div>
          <div class="decoration-lines"></div>
        </div>
      </div>
    </div>

    <!-- 默认布局 -->
    <div v-else class="ppt-slide ppt-default-slide" :style="themeStyles">
      <div class="slide-header">
        <h2 class="slide-title">{{ slide.title }}</h2>
        <div class="title-underline"></div>
      </div>
      <div class="slide-content">
        <div class="content-text" v-html="formatContent(slide.content || '')"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PPTTheme } from '../utils/pptThemes'
import PPTCharts from './PPTCharts.vue'
import PPTIcons from './PPTIcons.vue'

interface Props {
  slide: any
  layout: string
  theme: PPTTheme
}

const props = defineProps<Props>()

// 注册组件
const components = {
  PPTCharts,
  PPTIcons
}

// 生成主题样式
const themeStyles = computed(() => {
  const theme = props.theme
  return {
    '--ppt-primary': theme.colors.primary,
    '--ppt-secondary': theme.colors.secondary,
    '--ppt-accent': theme.colors.accent,
    '--ppt-background': theme.colors.background,
    '--ppt-surface': theme.colors.surface,
    '--ppt-text-primary': theme.colors.text.primary,
    '--ppt-text-secondary': theme.colors.text.secondary,
    '--ppt-text-light': theme.colors.text.light,
    '--ppt-gradient': `linear-gradient(${theme.colors.gradient?.direction || '135deg'}, ${theme.colors.gradient?.start}, ${theme.colors.gradient?.end})`,
    '--ppt-title-font': theme.typography.titleFont,
    '--ppt-body-font': theme.typography.bodyFont,
    '--ppt-title-h1': theme.typography.titleSize.h1,
    '--ppt-title-h2': theme.typography.titleSize.h2,
    '--ppt-title-h3': theme.typography.titleSize.h3,
    '--ppt-body-large': theme.typography.bodySize.large,
    '--ppt-body-normal': theme.typography.bodySize.normal,
    '--ppt-body-small': theme.typography.bodySize.small,
    '--ppt-line-height-title': theme.typography.lineHeight.title,
    '--ppt-line-height-body': theme.typography.lineHeight.body,
    '--ppt-padding': theme.layout.padding,
    '--ppt-margin': theme.layout.margin,
    '--ppt-border-radius': theme.layout.borderRadius,
    '--ppt-shadow': theme.layout.shadow,
    '--ppt-spacing-small': theme.layout.spacing.small,
    '--ppt-spacing-medium': theme.layout.spacing.medium,
    '--ppt-spacing-large': theme.layout.spacing.large,
    '--ppt-bullet-color': theme.elements.bullet.color,
    '--ppt-bullet-size': theme.elements.bullet.size,
    '--ppt-divider-color': theme.elements.divider.color,
    '--ppt-divider-width': theme.elements.divider.width,
    '--ppt-highlight-bg': theme.elements.highlight.background,
    '--ppt-highlight-color': theme.elements.highlight.color,
    '--ppt-highlight-radius': theme.elements.highlight.borderRadius
  }
})

// 格式化内容
const formatContent = (content: string): string => {
  if (!content) return ''
  
  // 处理换行
  content = content.replace(/\n/g, '<br>')
  
  // 处理加粗
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 处理斜体
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 处理高亮
  content = content.replace(/==(.*?)==/g, '<mark>$1</mark>')
  
  return content
}
</script>

<style scoped>
.ppt-layouts {
  width: 100%;
  height: 100%;
}

.ppt-slide {
  width: 100%;
  height: 100%;
  background: var(--ppt-background);
  color: var(--ppt-text-primary);
  font-family: var(--ppt-body-font);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: var(--ppt-shadow);
  border-radius: var(--ppt-border-radius);
}

/* 标题页样式 */
.ppt-title-slide {
  justify-content: center;
  align-items: center;
  text-align: center;
  background: var(--ppt-gradient);
  color: white;
}

.title-container {
  z-index: 2;
  max-width: 80%;
}

.title-icon {
  margin-bottom: 20px;
  opacity: 0.8;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 0.8;
    transform: translateY(0);
  }
}

.main-title {
  font-size: var(--ppt-title-h1);
  font-family: var(--ppt-title-font);
  font-weight: 700;
  line-height: var(--ppt-line-height-title);
  margin: 0 0 var(--ppt-spacing-medium) 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: var(--ppt-title-h3);
  font-weight: 400;
  line-height: var(--ppt-line-height-title);
  margin: 0 0 var(--ppt-spacing-large) 0;
  opacity: 0.9;
}

.author-info {
  display: flex;
  justify-content: center;
  gap: var(--ppt-spacing-medium);
  font-size: var(--ppt-body-normal);
  opacity: 0.8;
}

.author, .date {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.title-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.decoration-line {
  position: absolute;
  top: 20%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  transform: skewY(-2deg);
}

.decoration-accent {
  position: absolute;
  bottom: 20%;
  right: 15%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: scale(1.5);
}

/* 内容页样式 */
.ppt-content-slide,
.ppt-two-column-slide,
.ppt-chart-slide,
.ppt-image-focus-slide,
.ppt-summary-slide,
.ppt-default-slide {
  padding: var(--ppt-padding);
}

.slide-header {
  margin-bottom: var(--ppt-spacing-large);
}

.slide-title {
  font-size: var(--ppt-title-h2);
  font-family: var(--ppt-title-font);
  font-weight: 600;
  line-height: var(--ppt-line-height-title);
  margin: 0;
  color: var(--ppt-primary);
}

.title-underline {
  width: 60px;
  height: var(--ppt-divider-width);
  background: var(--ppt-accent);
  margin-top: var(--ppt-spacing-small);
  border-radius: 2px;
}

.slide-content {
  flex: 1;
  display: flex;
  gap: var(--ppt-spacing-large);
  align-items: flex-start;
}

.content-main {
  flex: 2;
}

.content-visual {
  flex: 1;
}

.content-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.content-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--ppt-spacing-medium);
  line-height: var(--ppt-line-height-body);
}

.bullet-point {
  width: var(--ppt-bullet-size);
  height: var(--ppt-bullet-size);
  background: var(--ppt-bullet-color);
  border-radius: 50%;
  margin-right: var(--ppt-spacing-small);
  margin-top: 8px;
  flex-shrink: 0;
}

.item-text {
  font-size: var(--ppt-body-normal);
  color: var(--ppt-text-secondary);
}

.content-text {
  font-size: var(--ppt-body-normal);
  line-height: var(--ppt-line-height-body);
  color: var(--ppt-text-secondary);
}

.content-text :deep(strong) {
  color: var(--ppt-primary);
  font-weight: 600;
}

.content-text :deep(em) {
  color: var(--ppt-accent);
  font-style: italic;
}

.content-text :deep(mark) {
  background: var(--ppt-highlight-bg);
  color: var(--ppt-highlight-color);
  padding: 2px 6px;
  border-radius: var(--ppt-highlight-radius);
}

/* 两栏布局样式 */
.two-column-content {
  flex: 1;
  display: flex;
  gap: var(--ppt-spacing-large);
}

.column {
  flex: 1;
}

.column-divider {
  width: var(--ppt-divider-width);
  background: var(--ppt-divider-color);
  border-radius: 1px;
}

.column-title {
  font-size: var(--ppt-title-h3);
  font-family: var(--ppt-title-font);
  font-weight: 600;
  color: var(--ppt-secondary);
  margin: 0 0 var(--ppt-spacing-medium) 0;
}

/* 图表布局样式 */
.chart-content {
  flex: 1;
  display: flex;
  gap: var(--ppt-spacing-large);
}

.chart-container {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-placeholder {
  width: 100%;
  height: 300px;
  background: var(--ppt-surface);
  border: 2px dashed var(--ppt-divider-color);
  border-radius: var(--ppt-border-radius);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--ppt-text-light);
}

.chart-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--ppt-spacing-small);
  color: var(--ppt-accent);
}

.chart-label {
  font-size: var(--ppt-body-large);
  margin: 0;
}

.chart-description {
  flex: 1;
}

.description-content {
  font-size: var(--ppt-body-normal);
  line-height: var(--ppt-line-height-body);
  color: var(--ppt-text-secondary);
}

/* 图片展示样式 */
.image-focus-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-image-container {
  flex: 1;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--ppt-border-radius);
  box-shadow: var(--ppt-shadow);
}

.image-placeholder {
  width: 100%;
  height: 300px;
  background: var(--ppt-surface);
  border: 2px dashed var(--ppt-divider-color);
  border-radius: var(--ppt-border-radius);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--ppt-text-light);
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--ppt-spacing-small);
  color: var(--ppt-accent);
}

.image-caption {
  margin-top: var(--ppt-spacing-medium);
  text-align: center;
  font-size: var(--ppt-body-small);
  color: var(--ppt-text-light);
  font-style: italic;
}

/* 图片容器通用样式 */
.image-container {
  position: relative;
  border-radius: var(--ppt-border-radius);
  overflow: hidden;
  box-shadow: var(--ppt-shadow);
}

.slide-image {
  width: 100%;
  height: auto;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
  pointer-events: none;
}

/* 总结页样式 */
.summary-header {
  margin-bottom: var(--ppt-spacing-large);
  text-align: center;
}

.summary-content {
  flex: 1;
  display: flex;
  position: relative;
}

.key-points {
  flex: 1;
  z-index: 2;
}

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.summary-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: var(--ppt-spacing-large);
  padding: var(--ppt-spacing-medium);
  background: var(--ppt-surface);
  border-radius: var(--ppt-border-radius);
  border-left: 4px solid var(--ppt-accent);
}

.point-number {
  width: 32px;
  height: 32px;
  background: var(--ppt-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  font-size: var(--ppt-body-small);
  margin-right: var(--ppt-spacing-medium);
  flex-shrink: 0;
}

.point-content {
  flex: 1;
}

.point-title {
  font-size: var(--ppt-body-large);
  font-weight: 600;
  color: var(--ppt-primary);
  margin: 0 0 var(--ppt-spacing-small) 0;
}

.point-text {
  font-size: var(--ppt-body-normal);
  line-height: var(--ppt-line-height-body);
  color: var(--ppt-text-secondary);
  margin: 0;
}

.summary-text {
  font-size: var(--ppt-body-large);
  line-height: var(--ppt-line-height-body);
  color: var(--ppt-text-secondary);
  text-align: center;
}

.summary-decoration {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 200px;
  pointer-events: none;
  opacity: 0.1;
}

.decoration-circle {
  position: absolute;
  top: 20%;
  right: 20%;
  width: 120px;
  height: 120px;
  border: 3px solid var(--ppt-accent);
  border-radius: 50%;
}

.decoration-lines {
  position: absolute;
  bottom: 20%;
  right: 10%;
  width: 80px;
  height: 80px;
}

.decoration-lines::before,
.decoration-lines::after {
  content: '';
  position: absolute;
  background: var(--ppt-primary);
}

.decoration-lines::before {
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  transform: rotate(45deg);
}

.decoration-lines::after {
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  transform: rotate(45deg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ppt-slide {
    padding: calc(var(--ppt-padding) * 0.7);
  }
  
  .slide-content {
    flex-direction: column;
    gap: var(--ppt-spacing-medium);
  }
  
  .two-column-content {
    flex-direction: column;
    gap: var(--ppt-spacing-medium);
  }
  
  .column-divider {
    height: var(--ppt-divider-width);
    width: 100%;
  }
  
  .chart-content {
    flex-direction: column;
  }
  
  .main-title {
    font-size: calc(var(--ppt-title-h1) * 0.8);
  }
  
  .slide-title {
    font-size: calc(var(--ppt-title-h2) * 0.9);
  }
}
</style>