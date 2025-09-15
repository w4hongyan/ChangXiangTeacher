<template>
  <Layout>
    <div class="quick-points-container">
    <div class="header">
      <h1 class="title">
        <span class="icon">🌟</span>
        课堂积分
        <span class="icon">🌟</span>
      </h1>
      <p class="subtitle">小组积分</p>
      <div class="settings-panel">
        <div class="group-count-setting">
          <label>小组数量：</label>
          <div class="count-controls">
            <button @click="decreaseGroupCount" :disabled="groupCount <= 2" class="count-btn">
              <span>−</span>
            </button>
            <span class="count-display">{{ groupCount }}</span>
            <button @click="increaseGroupCount" :disabled="groupCount >= 8" class="count-btn">
              <span>+</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="groups-grid" :data-count="groupCount">
      <div 
        v-for="group in groups" 
        :key="group.id"
        class="group-card"
        :class="{ 
          'animate-bounce': group.animating,
          'pulse-effect': group.pulseEffect,
          'touch-optimized': true
        }"
        @touchstart="handleTouchStart(group)"
        @touchend="handleTouchEnd(group)"
      >
        <div class="group-info">
          <div class="avatar" :class="{ 'avatar-glow': group.points > 0 }">
            {{ group.name.charAt(2) }}
          </div>
          <h3 class="group-name">{{ group.name }}</h3>
          <div class="points-display">
            <span class="points-number" :class="{ 'number-highlight': group.points > 0 }">{{ group.points }}</span>
            <span class="points-label">积分</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(group.points * 10, 100) + '%' }"></div>
          </div>
        </div>

        <div class="action-buttons">
          <button 
            @click="addPoint(group)"
            @touchstart="handleButtonTouch(group, 'add')"
            @touchend="handleTouchButtonEnd(group, 'add')"
            class="btn-add touch-btn"
            :disabled="loading"
          >
            <span class="btn-icon">🌸</span>
            <span class="btn-text">+1</span>
            <div class="ripple" v-if="group.addRipple"></div>
            <div class="touch-feedback" v-if="group.addTouch"></div>
          </button>
          
          <button 
            @click="subtractPoint(group)"
            @touchstart="handleButtonTouch(group, 'subtract')"
            @touchend="handleTouchButtonEnd(group, 'subtract')"
            class="btn-subtract touch-btn"
            :disabled="loading || group.points <= 0"
          >
            <span class="btn-icon">💔</span>
            <span class="btn-text">-1</span>
            <div class="ripple" v-if="group.subtractRipple"></div>
            <div class="touch-feedback" v-if="group.subtractTouch"></div>
          </button>
        </div>

        <!-- 飘浮动画效果 -->
        <div class="floating-effects">
          <div 
            v-for="effect in group.effects" 
            :key="effect.id"
            class="floating-effect"
            :class="effect.type"
            :style="{ left: effect.x + 'px', top: effect.y + 'px' }"
          >
            {{ effect.icon }}
          </div>
        </div>

        <!-- 成就徽章 -->
        <div class="achievement-badge" v-if="group.points >= 10">
          <span class="badge-icon">🏆</span>
        </div>
      </div>
    </div>

    <!-- 全局操作按钮 - 重新设计布局 -->
    <div class="global-actions-redesigned">
      <div class="action-buttons-row">
        <button class="btn-global-new btn-add-all-new touch-btn" @click="addAllPoints" @touchstart="handleGlobalButtonTouch('add')" @touchend="handleGlobalButtonEnd('add')">
          <div class="btn-icon-new">➕</div>
          <span class="btn-text-new">全部+1</span>
        </button>
        <button class="btn-global-new btn-subtract-all-new touch-btn" @click="subtractAllPoints" @touchstart="handleGlobalButtonTouch('subtract')" @touchend="handleGlobalButtonEnd('subtract')">
          <div class="btn-icon-new">➖</div>
          <span class="btn-text-new">全部-1</span>
        </button>
        <button class="btn-reset-new touch-btn" @click="resetAllPoints" @touchstart="handleGlobalButtonTouch('reset')" @touchend="handleGlobalButtonEnd('reset')">
          <div class="btn-icon-new">🔄</div>
          <span class="btn-text-new">重置所有积分</span>
        </button>
      </div>
    </div>

    <!-- 成功提示 -->
    <transition name="toast">
      <div v-if="showToast" class="toast">
        {{ toastMessage }}
      </div>
    </transition>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Layout from './Layout.vue'

interface Student {
  id: number
  name: string
  points: number
  animating: boolean
  addRipple: boolean
  subtractRipple: boolean
  effects: Effect[]
}

interface Effect {
  id: number
  type: 'add' | 'subtract'
  icon: string
  x: number
  y: number
}

const groupCount = ref(4)
const groups = ref([])

// 数据持久化相关
const STORAGE_KEY = 'quickPoints_data'

// 保存数据到localStorage
const saveData = () => {
  const data = {
    groupCount: groupCount.value,
    groups: groups.value.map(group => ({
      id: group.id,
      name: group.name,
      points: group.points
    }))
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 从localStorage加载数据
const loadData = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (savedData) {
      const data = JSON.parse(savedData)
      groupCount.value = data.groupCount || 4
      
      // 恢复小组数据
      if (data.groups && data.groups.length > 0) {
        generateGroupsWithData(data.groups)
        return true
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
  return false
}

// 生成小组数据（带已保存的积分数据）
const generateGroupsWithData = (savedGroups = null) => {
  const groupNames = ['第一组', '第二组', '第三组', '第四组', '第五组', '第六组', '第七组', '第八组']
  groups.value = Array.from({ length: groupCount.value }, (_, index) => {
    const savedGroup = savedGroups ? savedGroups.find(g => g.id === index + 1) : null
    return {
      id: index + 1,
      name: groupNames[index],
      points: savedGroup ? savedGroup.points : 0,
      animating: false,
      addRipple: false,
      subtractRipple: false,
      addTouch: false,
      subtractTouch: false,
      effects: [],
      pulseEffect: false
    }
  })
}

// 生成小组数据（原函数保持兼容）
const generateGroups = () => {
  generateGroupsWithData()
  saveData() // 生成新数据时保存
}

// 增加小组数量
const increaseGroupCount = () => {
  if (groupCount.value < 8) {
    groupCount.value++
    generateGroups()
  }
}

// 减少小组数量
const decreaseGroupCount = () => {
  if (groupCount.value > 2) {
    groupCount.value--
    generateGroups()
  }
}
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
let effectId = 0

// 加一分
const addPoint = (group: any) => {
  // 触发按钮波纹效果
  group.addRipple = true
  setTimeout(() => {
    group.addRipple = false
  }, 300)

  // 添加飘浮效果
  addFloatingEffect(group, 'add')

  // 更新本地数据并触发动画
  group.points += 1
  group.animating = true
  setTimeout(() => {
    group.animating = false
  }, 600)

  // 保存数据
  saveData()
  showToastMessage(`${group.name} +1分 🌸`)
}

// 减一分
const subtractPoint = (group: any) => {
  if (group.points <= 0) {
    showToastMessage('积分不能为负数')
    return
  }
  
  // 触发按钮波纹效果
  group.subtractRipple = true
  setTimeout(() => {
    group.subtractRipple = false
  }, 300)

  // 添加飘浮效果
  addFloatingEffect(group, 'subtract')

  // 更新本地数据并触发动画
  group.points -= 1
  group.animating = true
  setTimeout(() => {
    group.animating = false
  }, 600)

  // 保存数据
  saveData()
  showToastMessage(`${group.name} -1分 💔`)
}

// 添加飘浮效果
const addFloatingEffect = (group: any, type: 'add' | 'subtract') => {
  const effect: Effect = {
    id: effectId++,
    type,
    icon: type === 'add' ? '🌸' : '💔',
    x: Math.random() * 100,
    y: Math.random() * 50
  }
  
  group.effects.push(effect)
  
  // 3秒后移除效果
  setTimeout(() => {
    const index = group.effects.findIndex(e => e.id === effect.id)
    if (index > -1) {
      group.effects.splice(index, 1)
    }
  }, 3000)
}

// 显示提示消息
const showToastMessage = (message: string) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// 重置所有积分
const resetAllPoints = () => {
  groups.value.forEach(group => {
    group.points = 0
    group.animating = false
    group.addRipple = false
    group.subtractRipple = false
    group.effects = []
  })
  // 保存数据
  saveData()
  showToastMessage('所有积分已重置！')
}

// 组件挂载时加载数据
onMounted(() => {
  // 尝试加载已保存的数据
  if (!loadData()) {
    // 如果没有保存的数据，则生成默认数据
    generateGroups()
  }
})

// 监听小组数量变化，自动保存
watch(groupCount, () => {
  saveData()
})

// 全部加一分
const addAllPoints = () => {
  groups.value.forEach(group => {
    group.points += 1
    group.animating = true
    setTimeout(() => {
      group.animating = false
    }, 600)
  })
  // 保存数据
  saveData()
  showToastMessage('全部小组 +1分！🌸')
}

// 全部减一分
const subtractAllPoints = () => {
  groups.value.forEach(group => {
    if (group.points > 0) {
      group.points -= 1
      group.animating = true
      setTimeout(() => {
        group.animating = false
      }, 600)
    }
  })
  // 保存数据
  saveData()
  showToastMessage('全部小组 -1分！💔')
 }

 // 触摸事件处理
 const handleTouchStart = (group) => {
   group.pulseEffect = true
 }

 const handleTouchEnd = (group) => {
   setTimeout(() => {
     group.pulseEffect = false
   }, 200)
 }

 // 个人按钮触摸开始
 const handleButtonTouch = (group, type) => {
   if (type === 'add') {
     group.addTouch = true
   } else if (type === 'subtract') {
     group.subtractTouch = true
   }
 }

 // 个人按钮触摸结束
 const handleTouchButtonEnd = (group, type) => {
   setTimeout(() => {
     if (type === 'add') {
       group.addTouch = false
     } else if (type === 'subtract') {
       group.subtractTouch = false
     }
   }, 300)
 }

 // 全局按钮触摸状态
 const globalButtonTouch = ref({
   add: false,
   subtract: false,
   reset: false
 })

 // 全局按钮触摸开始
 const handleGlobalButtonTouch = (type) => {
   globalButtonTouch.value[type] = true
 }

 // 全局按钮触摸结束
 const handleGlobalButtonEnd = (type) => {
   setTimeout(() => {
     globalButtonTouch.value[type] = false
   }, 300)
 }
</script>

<style scoped>
.quick-points-container {
  padding: 20px;
  max-width: 100%;
  margin: 0;
  background: #ffffff;
  min-height: calc(100vh - 120px);
  border-radius: 0;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  margin-bottom: 15px;
  color: white;
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
  color: #2c3e50;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.title .icon {
  animation: twinkle 2s infinite;
}

.subtitle {
  font-size: 1rem;
  margin: 5px 0 0 0;
  opacity: 0.9;
  color: #6c757d;
}

.groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
    padding: 0 20px;
    flex: 1;
  }

  /* 当屏幕宽度适合显示2列时，限制最大列数 */
  @media (min-width: 800px) and (max-width: 1200px) {
    .groups-grid {
      grid-template-columns: repeat(2, 1fr);
      max-width: 900px;
    }
  }

  /* 当屏幕很宽时，仍然限制为最多3列 */
  @media (min-width: 1200px) {
    .groups-grid {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      max-width: 1200px;
    }
  }

 /* 根据小组数量调整布局 */
 .groups-grid[data-count="2"] {
   grid-template-columns: repeat(2, 1fr);
   max-width: 700px;
 }

 .groups-grid[data-count="3"] {
   grid-template-columns: repeat(3, 1fr);
   max-width: 900px;
 }

 .groups-grid[data-count="4"] {
   grid-template-columns: repeat(2, 1fr);
   max-width: 700px;
 }

 .groups-grid[data-count="5"], .groups-grid[data-count="6"] {
   grid-template-columns: repeat(3, 1fr);
   max-width: 900px;
 }

 .groups-grid[data-count="7"], .groups-grid[data-count="8"] {
   grid-template-columns: repeat(4, 1fr);
   max-width: 1200px;
 }

.settings-panel {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.group-count-setting {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #e9ecef;
}

.group-count-setting label {
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.count-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #e9ecef;
  color: #495057;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-btn:hover:not(:disabled) {
  background: #dee2e6;
  transform: scale(1.1);
}

.count-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-display {
  color: #495057;
  font-size: 1.2rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.group-card {
   background: #ffffff;
   border-radius: 12px;
   padding: 15px;
   box-shadow: 0 3px 12px rgba(0,0,0,0.08);
   transition: all 0.3s ease;
   position: relative;
   overflow: hidden;
   cursor: pointer;
   border: 2px solid #e9ecef;
 }

 .group-card.touch-optimized {
   min-height: 150px;
   height: 260px;
   user-select: none;
   -webkit-tap-highlight-color: transparent;
 }

 .group-card.pulse-effect {
   animation: pulse 0.3s ease;
   transform: scale(1.02);
 }

.group-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.group-card.animate-bounce {
   animation: bounce 0.6s ease;
 }

 .avatar-glow {
   box-shadow: 0 0 20px rgba(138, 43, 226, 0.5) !important;
   animation: glow 2s ease-in-out infinite alternate;
 }

 .number-highlight {
   color: #8a2be2 !important;
   font-weight: bold;
   text-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
 }

.group-info {
  text-align: center;
  margin-bottom: 15px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  color: white;
  margin: 0 auto 12px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.2);
}

.group-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.points-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.points-number {
  font-size: 1.6rem;
  font-weight: bold;
  color: #667eea;
}

.points-label {
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-add, .btn-subtract {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-add {
  background: linear-gradient(135deg, #ff9a9e, #fecfef);
  color: #333;
}

.btn-add:hover {
  background: linear-gradient(135deg, #ff8a95, #fdbdec);
  transform: scale(1.05);
}

.btn-subtract {
  background: linear-gradient(135deg, #a8edea, #fed6e3);
  color: #333;
}

.btn-subtract:hover {
  background: linear-gradient(135deg, #98e3e0, #fccddf);
  transform: scale(1.05);
}

.btn-add:disabled, .btn-subtract:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.2rem;
}

.btn-text {
  font-weight: bold;
}

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
  transform: translate(-50%, -50%);
  animation: ripple-effect 0.3s ease-out;
}

.floating-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-effect {
  position: absolute;
  font-size: 1.5rem;
  animation: float-up 3s ease-out forwards;
  pointer-events: none;
}

.floating-effect.add {
  color: #ff6b6b;
}

.floating-effect.subtract {
  color: #74b9ff;
}

/* 重新设计的全局操作按钮样式 */
.global-actions-redesigned {
  position: sticky;
  bottom: 15px;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 15px;
  background: transparent;
  width: 100%;
}

.action-buttons-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: nowrap;
}

.btn-global-new {
  background: #6c757d;
  color: white;
  border: none;
  outline: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.2);
  min-width: 100px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.btn-global-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.3);
  background: #5a6268;
}

.btn-global-new:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-add-all-new {
  background: #28a745;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2);
}

.btn-add-all-new:hover {
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
  background: #218838;
}

.btn-subtract-all-new {
  background: #dc3545;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2);
}

.btn-subtract-all-new:hover {
  box-shadow: 0 6px 20px rgba(220, 53, 69, 0.3);
  background: #c82333;
}

.btn-reset-new {
  background: #6f42c1;
  color: white;
  border: none;
  outline: none;
  padding: 10px 25px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(111, 66, 193, 0.2);
  min-width: 120px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.btn-reset-new:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(111, 66, 193, 0.3);
  background: #5a32a3;
}

.btn-reset-new:active {
  transform: translateY(-1px) scale(0.98);
}

.btn-icon-new {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.btn-text-new {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* 进度条样式 */
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(138, 43, 226, 0.1);
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  border-radius: 3px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

/* 触摸反馈效果 */
.touch-btn {
  position: relative;
  min-height: 50px;
  min-width: 80px;
}

.touch-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: touchFeedback 0.3s ease-out;
}

/* 成就徽章 */
.achievement-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  background: #ffc107;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
  animation: badgeAppear 0.5s ease-out;
}

.badge-icon {
  font-size: 1.2rem;
  animation: rotate 2s linear infinite;
}

/* 动画定义 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes glow {
  from { box-shadow: 0 0 20px rgba(138, 43, 226, 0.3); }
  to { box-shadow: 0 0 30px rgba(138, 43, 226, 0.6); }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes touchFeedback {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

@keyframes badgeAppear {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  font-weight: bold;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

/* 动画效果 */
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -10px, 0);
  }
  70% {
    transform: translate3d(0, -5px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

@keyframes ripple-effect {
  to {
    width: 100px;
    height: 100px;
    opacity: 0;
  }
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1.5);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 响应式设计和移动端优化 */
@media (max-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr !important;
    gap: 20px;
    padding: 0 15px;
    max-width: 100% !important;
  }

  .page-title {
    font-size: 2rem;
  }
  
  .group-card {
    padding: 20px;
    min-height: 180px;
  }

  .group-card.touch-optimized {
    min-height: 200px;
  }

  .touch-btn {
    min-height: 55px;
    min-width: 90px;
    font-size: 1.1rem;
  }

  .count-controls {
    gap: 15px;
  }

  .count-btn {
    width: 40px;
    height: 40px;
    font-size: 1.3rem;
  }

  .global-actions-redesigned {
    padding: 0 10px;
    gap: 15px;
  }

  .action-buttons-row {
    gap: 15px;
  }

  .btn-global-new {
    padding: 14px 28px;
    font-size: 1rem;
    min-width: 120px;
  }

  .btn-reset-new {
    padding: 16px 32px;
    font-size: 1.1rem;
    min-width: 160px;
  }

  .btn-icon-new {
    width: 24px;
    height: 24px;
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .groups-grid {
    gap: 15px;
    padding: 0 10px;
  }

  .group-card {
    padding: 15px;
  }

  .settings-panel {
    margin-top: 15px;
  }

  .group-count-setting {
    padding: 8px 15px;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .action-buttons-row {
    flex-direction: column;
    gap: 12px;
  }

  .btn-global-new {
    padding: 12px 24px;
    font-size: 0.95rem;
    min-width: 100%;
    max-width: 280px;
  }

  .btn-reset-new {
    padding: 14px 28px;
    font-size: 1rem;
    min-width: 100%;
    max-width: 280px;
  }

  .btn-icon-new {
    width: 22px;
    height: 22px;
    font-size: 1.1rem;
  }

  .btn-text-new {
    font-size: 0.95rem;
  }
}

/* 触摸反馈效果 */
.touch-feedback {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: inherit;
  pointer-events: none;
  animation: touchFeedback 0.3s ease-out;
}

@keyframes touchFeedback {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .group-card:hover {
    transform: none;
  }

  .touch-btn {
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }

  .touch-btn:hover {
    transform: none;
  }

  .touch-btn:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }

  .count-btn:hover:not(:disabled) {
    transform: none;
    background: rgba(255, 255, 255, 0.2);
  }

  .count-btn:active:not(:disabled) {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }

  .btn-global-new:active,
  .btn-reset-new:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }

  .btn-global:hover {
    transform: none;
  }
}
</style>