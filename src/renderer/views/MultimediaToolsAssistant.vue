<template>
  <Layout>
    <div class="multimedia-tools-assistant">
      <div class="tools-header">
        <div class="header-left">
          <el-button @click="goBack" type="text" size="large">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <h2>🎬 多媒体工具</h2>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showProjectManager" size="small">
            <el-icon><Folder /></el-icon>
            项目管理
          </el-button>
        </div>
      </div>

      <div class="tools-container">
        <!-- 工具选择区域 -->
        <div class="multimedia-tools">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('video_editor')" :class="{ active: activeTool === 'video_editor' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#409EFF"><VideoPlay /></el-icon>
                </div>
                <h3>视频编辑</h3>
                <p>剪辑、合并、添加字幕和特效</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('audio_editor')" :class="{ active: activeTool === 'audio_editor' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#67C23A"><Headset /></el-icon>
                </div>
                <h3>音频处理</h3>
                <p>录音、剪辑、降噪和格式转换</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('image_editor')" :class="{ active: activeTool === 'image_editor' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#E6A23C"><Picture /></el-icon>
                </div>
                <h3>图片制作</h3>
                <p>设计海报、制作图表和素材</p>
              </el-card>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('screen_recorder')" :class="{ active: activeTool === 'screen_recorder' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#F56C6C"><Monitor /></el-icon>
                </div>
                <h3>屏幕录制</h3>
                <p>录制教学演示和操作过程</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('animation_maker')" :class="{ active: activeTool === 'animation_maker' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#909399"><MagicStick /></el-icon>
                </div>
                <h3>动画制作</h3>
                <p>创建教学动画和交互内容</p>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="tool-card" @click="openTool('format_converter')" :class="{ active: activeTool === 'format_converter' }">
                <div class="tool-icon">
                  <el-icon size="32" color="#606266"><Switch /></el-icon>
                </div>
                <h3>格式转换</h3>
                <p>转换各种媒体文件格式</p>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 工作区域 -->
        <div class="tools-workspace" v-if="activeTool">
          <!-- 视频编辑 -->
          <div v-if="activeTool === 'video_editor'" class="workspace-content">
            <div class="workspace-header">
              <h3>🎬 视频编辑器</h3>
              <p>上传视频文件，进行剪辑、合并和特效处理</p>
            </div>
            
            <div class="video-editor-layout">
              <div class="editor-sidebar">
                <el-tabs v-model="videoEditorTab" tab-position="left">
                  <el-tab-pane label="媒体库" name="media">
                    <div class="media-library">
                      <el-upload
                        class="upload-area"
                        drag
                        :auto-upload="false"
                        :on-change="handleVideoUpload"
                        accept="video/*"
                        multiple
                      >
                        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                        <div class="el-upload__text">
                          拖拽视频文件到此处
                        </div>
                      </el-upload>
                      
                      <div class="media-list" v-if="videoFiles.length > 0">
                        <div 
                          v-for="file in videoFiles" 
                          :key="file.id" 
                          class="media-item"
                          @click="selectVideoFile(file)"
                          :class="{ active: selectedVideoFile?.id === file.id }"
                        >
                          <div class="media-thumbnail">
                            <el-icon><VideoPlay /></el-icon>
                          </div>
                          <div class="media-info">
                            <div class="media-name">{{ file.name }}</div>
                            <div class="media-duration">{{ file.duration || '00:00' }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                  
                  <el-tab-pane label="特效" name="effects">
                    <div class="effects-panel">
                      <div class="effect-category">
                        <h4>转场效果</h4>
                        <div class="effect-grid">
                          <div class="effect-item" v-for="effect in transitionEffects" :key="effect.id">
                            <div class="effect-preview">{{ effect.icon }}</div>
                            <div class="effect-name">{{ effect.name }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="effect-category">
                        <h4>滤镜效果</h4>
                        <div class="effect-grid">
                          <div class="effect-item" v-for="filter in filterEffects" :key="filter.id">
                            <div class="effect-preview">{{ filter.icon }}</div>
                            <div class="effect-name">{{ filter.name }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                  
                  <el-tab-pane label="字幕" name="subtitles">
                    <div class="subtitles-panel">
                      <el-button type="primary" @click="addSubtitle" size="small" style="width: 100%; margin-bottom: 16px;">
                        <el-icon><Plus /></el-icon>
                        添加字幕
                      </el-button>
                      
                      <div class="subtitle-list">
                        <div v-for="subtitle in subtitles" :key="subtitle.id" class="subtitle-item">
                          <el-input v-model="subtitle.text" placeholder="输入字幕内容" size="small"></el-input>
                          <div class="subtitle-timing">
                            <el-input v-model="subtitle.startTime" placeholder="开始时间" size="small"></el-input>
                            <el-input v-model="subtitle.endTime" placeholder="结束时间" size="small"></el-input>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
              
              <div class="editor-main">
                <div class="video-preview">
                  <div class="preview-area">
                    <div v-if="!selectedVideoFile" class="preview-placeholder">
                      <el-icon size="64" color="#c0c4cc"><VideoPlay /></el-icon>
                      <p>请选择视频文件进行预览</p>
                    </div>
                    <video v-else :src="selectedVideoFile.url" controls class="video-player"></video>
                  </div>
                  
                  <div class="video-controls">
                    <el-button-group>
                      <el-button @click="playVideo" :disabled="!selectedVideoFile">
                        <el-icon><VideoPlay /></el-icon>
                      </el-button>
                      <el-button @click="pauseVideo" :disabled="!selectedVideoFile">
                        <el-icon><VideoPause /></el-icon>
                      </el-button>
                      <el-button @click="stopVideo" :disabled="!selectedVideoFile">
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </el-button-group>
                    
                    <div class="timeline-controls">
                      <el-slider v-model="currentTime" :max="videoDuration" :disabled="!selectedVideoFile"></el-slider>
                    </div>
                  </div>
                </div>
                
                <div class="timeline-area">
                  <div class="timeline-header">
                    <h4>时间轴</h4>
                    <div class="timeline-tools">
                      <el-button @click="cutVideo" size="small" :disabled="!selectedVideoFile">
                        <el-icon><EditPen /></el-icon>
                        剪切
                      </el-button>
                      <el-button @click="mergeVideos" size="small" :disabled="videoFiles.length < 2">
                        <el-icon><Connection /></el-icon>
                        合并
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="timeline-tracks">
                    <div class="track video-track">
                      <div class="track-label">视频</div>
                      <div class="track-content">
                        <div v-for="clip in videoClips" :key="clip.id" class="video-clip" :style="{ width: clip.width + 'px', left: clip.left + 'px' }">
                          {{ clip.name }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="track audio-track">
                      <div class="track-label">音频</div>
                      <div class="track-content">
                        <div v-for="clip in audioClips" :key="clip.id" class="audio-clip" :style="{ width: clip.width + 'px', left: clip.left + 'px' }">
                          {{ clip.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="editor-actions">
              <el-button @click="exportVideo" type="primary" :loading="isExporting">
                <el-icon><Download /></el-icon>
                导出视频
              </el-button>
              <el-button @click="saveProject">
                <el-icon><Document /></el-icon>
                保存项目
              </el-button>
            </div>
          </div>

          <!-- 音频处理 -->
          <div v-else-if="activeTool === 'audio_editor'" class="workspace-content">
            <div class="workspace-header">
              <h3>🎵 音频处理器</h3>
              <p>录制、编辑和处理音频文件</p>
            </div>
            
            <div class="audio-editor-layout">
              <div class="audio-controls">
                <div class="recording-section">
                  <h4>录音控制</h4>
                  <div class="record-controls">
                    <el-button @click="startRecording" :disabled="isRecording" type="danger" circle>
                      <el-icon><Microphone /></el-icon>
                    </el-button>
                    <el-button @click="stopRecording" :disabled="!isRecording" circle>
                      <el-icon><Close /></el-icon>
                    </el-button>
                    <el-button @click="playCurrentRecording" :disabled="!hasRecording" circle>
                      <el-icon><VideoPlay /></el-icon>
                    </el-button>
                  </div>
                  <div class="recording-status">
                    <span v-if="isRecording" class="recording-indicator">● 录音中... {{ recordingTime }}</span>
                    <span v-else-if="hasRecording" class="recording-ready">录音完成</span>
                    <span v-else class="recording-idle">点击开始录音</span>
                  </div>
                </div>
                
                <div class="audio-upload">
                  <h4>文件上传</h4>
                  <el-upload
                    class="upload-demo"
                    drag
                    :auto-upload="false"
                    :on-change="handleAudioUpload"
                    accept="audio/*"
                  >
                    <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                    <div class="el-upload__text">
                      拖拽音频文件到此处
                    </div>
                  </el-upload>
                </div>
              </div>
              
              <div class="audio-waveform" v-if="selectedAudioFile">
                <div class="waveform-container">
                  <canvas ref="waveformCanvas" class="waveform-canvas"></canvas>
                </div>
                
                <div class="audio-player-controls">
                  <el-button-group>
                    <el-button @click="playAudio">
                      <el-icon><VideoPlay /></el-icon>
                    </el-button>
                    <el-button @click="pauseAudio">
                      <el-icon><VideoPause /></el-icon>
                    </el-button>
                    <el-button @click="stopAudio">
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </el-button-group>
                  
                  <div class="volume-control">
                    <el-icon><Headset /></el-icon>
                    <el-slider v-model="audioVolume" :max="100" style="width: 100px;"></el-slider>
                  </div>
                </div>
              </div>
              
              <div class="audio-effects">
                <h4>音频效果</h4>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <div class="effect-control">
                      <label>降噪</label>
                      <el-switch v-model="audioEffects.noiseReduction"></el-switch>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="effect-control">
                      <label>音量增强</label>
                      <el-switch v-model="audioEffects.volumeBoost"></el-switch>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="effect-control">
                      <label>回声消除</label>
                      <el-switch v-model="audioEffects.echoRemoval"></el-switch>
                    </div>
                  </el-col>
                </el-row>
                
                <div class="equalizer">
                  <h5>均衡器</h5>
                  <div class="eq-controls">
                    <div v-for="(freq, index) in eqFrequencies" :key="freq" class="eq-band">
                      <el-slider 
                        v-model="eqValues[index]" 
                        vertical 
                        height="100px" 
                        :min="-20" 
                        :max="20"
                      ></el-slider>
                      <label>{{ freq }}</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="audio-actions">
              <el-button @click="exportAudio" type="primary" :loading="isExportingAudio">
                <el-icon><Download /></el-icon>
                导出音频
              </el-button>
              <el-button @click="saveAudioProject">
                <el-icon><Document /></el-icon>
                保存项目
              </el-button>
            </div>
          </div>

          <!-- 图片制作 -->
          <div v-else-if="activeTool === 'image_editor'" class="workspace-content">
            <div class="workspace-header">
              <h3>🎨 图片制作器</h3>
              <p>设计海报、制作图表和编辑图片</p>
            </div>
            
            <div class="image-editor-layout">
              <div class="image-toolbar">
                <el-button-group>
                  <el-button @click="selectTool('select')" :type="selectedTool === 'select' ? 'primary' : 'default'">
                    <el-icon><Pointer /></el-icon>
                  </el-button>
                  <el-button @click="selectTool('text')" :type="selectedTool === 'text' ? 'primary' : 'default'">
                    <el-icon><EditPen /></el-icon>
                  </el-button>
                  <el-button @click="selectTool('shape')" :type="selectedTool === 'shape' ? 'primary' : 'default'">
                    <el-icon><Operation /></el-icon>
                  </el-button>
                  <el-button @click="selectTool('brush')" :type="selectedTool === 'brush' ? 'primary' : 'default'">
                    <el-icon><Brush /></el-icon>
                  </el-button>
                </el-button-group>
                
                <div class="canvas-actions">
                  <el-button @click="undoCanvas" :disabled="!canUndo">
                    <el-icon><RefreshLeft /></el-icon>
                    撤销
                  </el-button>
                  <el-button @click="redoCanvas" :disabled="!canRedo">
                    <el-icon><RefreshRight /></el-icon>
                    重做
                  </el-button>
                  <el-button @click="clearCanvas">
                    <el-icon><Delete /></el-icon>
                    清空
                  </el-button>
                </div>
              </div>
              
              <div class="image-workspace">
                <div class="canvas-container">
                  <canvas ref="imageCanvas" class="image-canvas" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing"></canvas>
                </div>
                
                <div class="properties-panel">
                  <el-tabs v-model="propertiesTab">
                    <el-tab-pane label="样式" name="style">
                      <div class="style-controls">
                        <div class="control-group">
                          <label>颜色</label>
                          <el-color-picker v-model="drawingColor"></el-color-picker>
                        </div>
                        
                        <div class="control-group">
                          <label>线条粗细</label>
                          <el-slider v-model="lineWidth" :min="1" :max="20"></el-slider>
                        </div>
                        
                        <div class="control-group" v-if="selectedTool === 'text'">
                          <label>字体大小</label>
                          <el-input-number v-model="fontSize" :min="12" :max="72"></el-input-number>
                        </div>
                        
                        <div class="control-group" v-if="selectedTool === 'text'">
                          <label>字体</label>
                          <el-select v-model="fontFamily">
                            <el-option label="微软雅黑" value="Microsoft YaHei"></el-option>
                            <el-option label="宋体" value="SimSun"></el-option>
                            <el-option label="黑体" value="SimHei"></el-option>
                            <el-option label="楷体" value="KaiTi"></el-option>
                          </el-select>
                        </div>
                      </div>
                    </el-tab-pane>
                    
                    <el-tab-pane label="模板" name="templates">
                      <div class="template-gallery">
                        <div class="template-category">
                          <h5>海报模板</h5>
                          <div class="template-grid">
                            <div v-for="template in posterTemplates" :key="template.id" class="template-item" @click="loadTemplate(template)">
                              <div class="template-preview">{{ template.name }}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="template-category">
                          <h5>图表模板</h5>
                          <div class="template-grid">
                            <div v-for="template in chartTemplates" :key="template.id" class="template-item" @click="loadTemplate(template)">
                              <div class="template-preview">{{ template.name }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-tab-pane>
                    
                    <el-tab-pane label="素材" name="assets">
                      <div class="assets-library">
                        <el-upload
                          class="asset-upload"
                          :auto-upload="false"
                          :on-change="handleAssetUpload"
                          accept="image/*"
                        >
                          <el-button size="small">
                            <el-icon><Plus /></el-icon>
                            添加素材
                          </el-button>
                        </el-upload>
                        
                        <div class="asset-grid">
                          <div v-for="asset in imageAssets" :key="asset.id" class="asset-item" @click="addAssetToCanvas(asset)">
                            <img :src="asset.url" :alt="asset.name" />
                          </div>
                        </div>
                      </div>
                    </el-tab-pane>
                  </el-tabs>
                </div>
              </div>
            </div>
            
            <div class="image-actions">
              <el-button @click="exportImage" type="primary">
                <el-icon><Download /></el-icon>
                导出图片
              </el-button>
              <el-button @click="saveImageProject">
                <el-icon><Document /></el-icon>
                保存项目
              </el-button>
            </div>
          </div>

          <!-- 屏幕录制 -->
          <div v-else-if="activeTool === 'screen_recorder'" class="workspace-content">
            <div class="workspace-header">
              <h3>📹 屏幕录制</h3>
              <p>录制屏幕操作和教学演示</p>
            </div>
            
            <div class="screen-recorder-layout">
              <div class="recorder-settings">
                <el-form :model="recordingSettings" label-width="120px">
                  <el-form-item label="录制区域">
                    <el-radio-group v-model="recordingSettings.area">
                      <el-radio label="fullscreen">全屏</el-radio>
                      <el-radio label="window">窗口</el-radio>
                      <el-radio label="custom">自定义区域</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  
                  <el-form-item label="视频质量">
                    <el-select v-model="recordingSettings.quality">
                      <el-option label="高清 (1080p)" value="1080p"></el-option>
                      <el-option label="标清 (720p)" value="720p"></el-option>
                      <el-option label="普清 (480p)" value="480p"></el-option>
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="帧率">
                    <el-select v-model="recordingSettings.fps">
                      <el-option label="60 FPS" value="60"></el-option>
                      <el-option label="30 FPS" value="30"></el-option>
                      <el-option label="24 FPS" value="24"></el-option>
                    </el-select>
                  </el-form-item>
                  
                  <el-form-item label="音频录制">
                    <el-checkbox v-model="recordingSettings.includeAudio">录制系统音频</el-checkbox>
                    <el-checkbox v-model="recordingSettings.includeMicrophone">录制麦克风</el-checkbox>
                  </el-form-item>
                  
                  <el-form-item label="鼠标指针">
                    <el-checkbox v-model="recordingSettings.showCursor">显示鼠标指针</el-checkbox>
                    <el-checkbox v-model="recordingSettings.highlightClicks">高亮点击效果</el-checkbox>
                  </el-form-item>
                </el-form>
              </div>
              
              <div class="recorder-preview">
                <div class="preview-area">
                  <div v-if="!isScreenRecording" class="preview-placeholder">
                    <el-icon size="64" color="#c0c4cc"><Monitor /></el-icon>
                    <p>点击开始录制按钮开始屏幕录制</p>
                  </div>
                  <div v-else class="recording-indicator">
                    <div class="recording-dot"></div>
                    <span>正在录制... {{ recordingDuration }}</span>
                  </div>
                </div>
                
                <div class="recorder-controls">
                  <el-button 
                    @click="startScreenRecording" 
                    :disabled="isScreenRecording" 
                    type="danger" 
                    size="large"
                  >
                    <el-icon><VideoCamera /></el-icon>
                    开始录制
                  </el-button>
                  
                  <el-button 
                    @click="pauseScreenRecording" 
                    :disabled="!isScreenRecording" 
                    size="large"
                  >
                    <el-icon><VideoPause /></el-icon>
                    暂停
                  </el-button>
                  
                  <el-button 
                    @click="stopScreenRecording" 
                    :disabled="!isScreenRecording" 
                    size="large"
                  >
                    <el-icon><Close /></el-icon>
                    停止
                  </el-button>
                </div>
              </div>
            </div>
            
            <div class="recording-history" v-if="screenRecordings.length > 0">
              <h4>录制历史</h4>
              <div class="recording-list">
                <div v-for="recording in screenRecordings" :key="recording.id" class="recording-item">
                  <div class="recording-thumbnail">
                    <el-icon><VideoPlay /></el-icon>
                  </div>
                  <div class="recording-info">
                    <div class="recording-name">{{ recording.name }}</div>
                    <div class="recording-meta">
                      <span>{{ recording.duration }}</span>
                      <span>{{ recording.size }}</span>
                      <span>{{ recording.date }}</span>
                    </div>
                  </div>
                  <div class="recording-actions">
                    <el-button @click="playRecording(recording)" size="small">
                      <el-icon><VideoPlay /></el-icon>
                    </el-button>
                    <el-button @click="downloadRecording(recording)" size="small">
                      <el-icon><Download /></el-icon>
                    </el-button>
                    <el-button @click="deleteRecording(recording)" size="small" type="danger">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Folder, 
  VideoPlay, 
  Headset, 
  Picture, 
  Monitor, 
  MagicStick, 
  Switch,
  UploadFilled,
  Plus,
  VideoPause,
  Close,
  Connection,
  Download,
  Document,
  Microphone,
  Pointer,
  EditPen,
  Operation,
  Brush,
  RefreshLeft,
  RefreshRight,
  Delete,
  VideoCamera
} from '@element-plus/icons-vue'
import Layout from './Layout.vue'

const router = useRouter()

// 响应式数据
const activeTool = ref('')
const videoEditorTab = ref('media')
const propertiesTab = ref('style')
const selectedTool = ref('select')
const isExporting = ref(false)
const isExportingAudio = ref(false)
const isRecording = ref(false)
const hasRecording = ref(false)
const recordingTime = ref('00:00')
const isScreenRecording = ref(false)
const recordingDuration = ref('00:00')
const currentTime = ref(0)
const videoDuration = ref(100)
const audioVolume = ref(50)
const drawingColor = ref('#000000')
const lineWidth = ref(2)
const fontSize = ref(16)
const fontFamily = ref('Microsoft YaHei')
const canUndo = ref(false)
const canRedo = ref(false)

// 文件数据
const videoFiles = ref([])
const selectedVideoFile = ref(null)
const selectedAudioFile = ref(null)
const videoClips = ref([])
const audioClips = ref([])
const subtitles = ref([])
const imageAssets = ref([])
const screenRecordings = ref([])

// 特效数据
const transitionEffects = ref([
  { id: 1, name: '淡入淡出', icon: '🌅' },
  { id: 2, name: '滑动', icon: '➡️' },
  { id: 3, name: '缩放', icon: '🔍' },
  { id: 4, name: '旋转', icon: '🔄' }
])

const filterEffects = ref([
  { id: 1, name: '黑白', icon: '⚫' },
  { id: 2, name: '复古', icon: '📸' },
  { id: 3, name: '模糊', icon: '🌫️' },
  { id: 4, name: '锐化', icon: '✨' }
])

// 音频效果
const audioEffects = reactive({
  noiseReduction: false,
  volumeBoost: false,
  echoRemoval: false
})

const eqFrequencies = ['60Hz', '170Hz', '310Hz', '600Hz', '1kHz', '3kHz', '6kHz', '12kHz', '14kHz', '16kHz']
const eqValues = ref(new Array(10).fill(0))

// 模板数据
const posterTemplates = ref([
  { id: 1, name: '教育海报' },
  { id: 2, name: '活动宣传' },
  { id: 3, name: '课程介绍' }
])

const chartTemplates = ref([
  { id: 1, name: '柱状图' },
  { id: 2, name: '饼图' },
  { id: 3, name: '折线图' }
])

// 录制设置
const recordingSettings = reactive({
  area: 'fullscreen',
  quality: '1080p',
  fps: '30',
  includeAudio: true,
  includeMicrophone: false,
  showCursor: true,
  highlightClicks: true
})

// Canvas 引用
const imageCanvas = ref(null)
const waveformCanvas = ref(null)

// 方法
const goBack = () => {
  router.push('/ai-assistant')
}

const showProjectManager = () => {
  ElMessage.info('项目管理功能开发中...')
}

const openTool = (tool: string) => {
  activeTool.value = tool
}

// 视频编辑相关方法
const handleVideoUpload = (file: any, fileList: any[]) => {
  const newFile = {
    id: Date.now(),
    name: file.name,
    url: URL.createObjectURL(file.raw),
    duration: '00:00',
    file: file.raw
  }
  videoFiles.value.push(newFile)
  ElMessage.success('视频文件上传成功')
}

const selectVideoFile = (file: any) => {
  selectedVideoFile.value = file
}

const addSubtitle = () => {
  subtitles.value.push({
    id: Date.now(),
    text: '',
    startTime: '00:00',
    endTime: '00:05'
  })
}

const playVideo = () => {
  ElMessage.info('播放视频')
}

const pauseVideo = () => {
  ElMessage.info('暂停视频')
}

const stopVideo = () => {
  ElMessage.info('停止视频')
}

const cutVideo = () => {
  ElMessage.info('剪切视频功能开发中...')
}

const mergeVideos = () => {
  ElMessage.info('合并视频功能开发中...')
}

const exportVideo = () => {
  isExporting.value = true
  setTimeout(() => {
    isExporting.value = false
    ElMessage.success('视频导出成功')
  }, 3000)
}

const saveProject = () => {
  ElMessage.success('项目已保存')
}

// 音频处理相关方法
const startRecording = () => {
  isRecording.value = true
  ElMessage.success('开始录音')
  // 模拟录音计时
  let seconds = 0
  const timer = setInterval(() => {
    if (!isRecording.value) {
      clearInterval(timer)
      return
    }
    seconds++
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    recordingTime.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, 1000)
}

const stopRecording = () => {
  isRecording.value = false
  hasRecording.value = true
  ElMessage.success('录音完成')
}

const playCurrentRecording = () => {
  ElMessage.info('播放当前录音')
}

const handleAudioUpload = (file: any) => {
  selectedAudioFile.value = {
    name: file.name,
    url: URL.createObjectURL(file.raw),
    file: file.raw
  }
  ElMessage.success('音频文件上传成功')
}

const playAudio = () => {
  ElMessage.info('播放音频')
}

const pauseAudio = () => {
  ElMessage.info('暂停音频')
}

const stopAudio = () => {
  ElMessage.info('停止音频')
}

const exportAudio = () => {
  isExportingAudio.value = true
  setTimeout(() => {
    isExportingAudio.value = false
    ElMessage.success('音频导出成功')
  }, 2000)
}

const saveAudioProject = () => {
  ElMessage.success('音频项目已保存')
}

// 图片制作相关方法
const selectTool = (tool: string) => {
  selectedTool.value = tool
}

const startDrawing = (event: MouseEvent) => {
  // 绘图逻辑
}

const draw = (event: MouseEvent) => {
  // 绘图逻辑
}

const stopDrawing = () => {
  // 停止绘图
}

const undoCanvas = () => {
  ElMessage.info('撤销操作')
}

const redoCanvas = () => {
  ElMessage.info('重做操作')
}

const clearCanvas = () => {
  ElMessage.info('清空画布')
}

const loadTemplate = (template: any) => {
  ElMessage.success(`加载模板：${template.name}`)
}

const handleAssetUpload = (file: any) => {
  const newAsset = {
    id: Date.now(),
    name: file.name,
    url: URL.createObjectURL(file.raw)
  }
  imageAssets.value.push(newAsset)
  ElMessage.success('素材添加成功')
}

const addAssetToCanvas = (asset: any) => {
  ElMessage.info(`添加素材到画布：${asset.name}`)
}

const exportImage = () => {
  ElMessage.success('图片导出成功')
}

const saveImageProject = () => {
  ElMessage.success('图片项目已保存')
}

// 屏幕录制相关方法
const startScreenRecording = () => {
  isScreenRecording.value = true
  ElMessage.success('开始屏幕录制')
  // 模拟录制计时
  let seconds = 0
  const timer = setInterval(() => {
    if (!isScreenRecording.value) {
      clearInterval(timer)
      return
    }
    seconds++
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    recordingDuration.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, 1000)
}

const pauseScreenRecording = () => {
  ElMessage.info('暂停录制')
}

const stopScreenRecording = () => {
  isScreenRecording.value = false
  // 添加到录制历史
  screenRecordings.value.push({
    id: Date.now(),
    name: `屏幕录制_${new Date().toLocaleString()}`,
    duration: recordingDuration.value,
    size: '125MB',
    date: new Date().toLocaleDateString()
  })
  recordingDuration.value = '00:00'
  ElMessage.success('录制完成')
}

const playRecording = (recording: any) => {
  ElMessage.info(`播放录制：${recording.name}`)
}

const downloadRecording = (recording: any) => {
  ElMessage.success(`下载录制：${recording.name}`)
}

const deleteRecording = (recording: any) => {
  const index = screenRecordings.value.findIndex(r => r.id === recording.id)
  if (index > -1) {
    screenRecordings.value.splice(index, 1)
    ElMessage.success('录制已删除')
  }
}

// 生命周期
onMounted(() => {
  // 初始化Canvas
  nextTick(() => {
    if (imageCanvas.value) {
      const canvas = imageCanvas.value as HTMLCanvasElement
      canvas.width = 800
      canvas.height = 600
    }
  })
})
</script>

<style scoped>
.multimedia-tools-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.tools-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.multimedia-tools {
  margin-bottom: 32px;
}

.tool-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 2px solid transparent;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.tool-card.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.tool-icon {
  margin-bottom: 12px;
}

.tool-card h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.tool-card p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.tools-workspace {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.workspace-header {
  margin-bottom: 24px;
  text-align: center;
}

.workspace-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
}

.workspace-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 视频编辑器样式 */
.video-editor-layout {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.editor-sidebar {
  width: 300px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.editor-main {
  flex: 1;
}

.media-library {
  padding: 16px;
}

.upload-area {
  margin-bottom: 16px;
}

.media-list {
  max-height: 300px;
  overflow-y: auto;
}

.media-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.media-item:hover {
  background-color: #f5f7fa;
}

.media-item.active {
  background-color: #e6f7ff;
}

.media-thumbnail {
  width: 40px;
  height: 30px;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-info {
  flex: 1;
}

.media-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.media-duration {
  font-size: 12px;
  color: #909399;
}

.video-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.preview-area {
  height: 300px;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.preview-placeholder {
  text-align: center;
  color: #c0c4cc;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timeline-controls {
  flex: 1;
}

.timeline-area {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.timeline-header h4 {
  margin: 0;
  color: #303133;
}

.timeline-tools {
  display: flex;
  gap: 8px;
}

.timeline-tracks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track {
  display: flex;
  align-items: center;
  height: 40px;
}

.track-label {
  width: 60px;
  font-size: 12px;
  color: #606266;
}

.track-content {
  flex: 1;
  height: 100%;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  position: relative;
}

.video-clip, .audio-clip {
  position: absolute;
  height: 100%;
  background: #409EFF;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.audio-clip {
  background: #67C23A;
}

.editor-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 音频编辑器样式 */
.audio-editor-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 20px;
}

.audio-controls {
  display: flex;
  gap: 24px;
}

.recording-section {
  flex: 1;
}

.recording-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.record-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.recording-status {
  font-size: 14px;
}

.recording-indicator {
  color: #f56c6c;
}

.recording-ready {
  color: #67c23a;
}

.recording-idle {
  color: #909399;
}

.audio-upload {
  flex: 1;
}

.audio-upload h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.audio-waveform {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.waveform-container {
  height: 120px;
  background: #000;
  border-radius: 4px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waveform-canvas {
  width: 100%;
  height: 100%;
}

.audio-player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-effects h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.effect-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.equalizer {
  margin-top: 20px;
}

.equalizer h5 {
  margin: 0 0 16px 0;
  color: #303133;
}

.eq-controls {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 8px;
}

.eq-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.eq-band label {
  font-size: 12px;
  color: #606266;
}

.audio-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 图片编辑器样式 */
.image-editor-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.image-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.canvas-actions {
  display: flex;
  gap: 8px;
}

.image-workspace {
  display: flex;
  gap: 20px;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 20px;
}

.image-canvas {
  border: 1px solid #ddd;
  background: white;
  cursor: crosshair;
}

.properties-panel {
  width: 300px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.style-controls {
  padding: 16px;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.template-gallery {
  padding: 16px;
}

.template-category {
  margin-bottom: 20px;
}

.template-category h5 {
  margin: 0 0 12px 0;
  color: #303133;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.template-item {
  aspect-ratio: 1;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.template-item:hover {
  background: #e6f7ff;
}

.template-preview {
  font-size: 12px;
  color: #606266;
}

.assets-library {
  padding: 16px;
}

.asset-upload {
  margin-bottom: 16px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.asset-item {
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s;
}

.asset-item:hover {
  transform: scale(1.05);
}

.asset-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 屏幕录制样式 */
.screen-recorder-layout {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.recorder-settings {
  width: 400px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.recorder-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-area {
  height: 300px;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
}

.recording-dot {
  width: 12px;
  height: 12px;
  background: #f56c6c;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.recorder-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.recording-history h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.recording-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recording-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.recording-thumbnail {
  width: 60px;
  height: 40px;
  background: #e9ecef;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recording-info {
  flex: 1;
}

.recording-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.recording-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}

.recording-actions {
  display: flex;
  gap: 8px;
}

.workspace-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .tools-container {
    padding: 16px;
  }
  
  .video-editor-layout,
  .audio-editor-layout,
  .image-workspace,
  .screen-recorder-layout {
    flex-direction: column;
  }
  
  .editor-sidebar,
  .properties-panel,
  .recorder-settings {
    width: 100%;
  }
  
  .multimedia-tools .el-col {
    margin-bottom: 16px;
  }
  
  .tool-card {
    height: 120px;
  }
  
  .timeline-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .audio-controls {
    flex-direction: column;
  }
  
  .eq-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .image-toolbar {
    flex-direction: column;
    gap: 12px;
  }
  
  .canvas-container {
    padding: 12px;
  }
  
  .image-canvas {
    max-width: 100%;
    height: auto;
  }
  
  .recorder-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .recording-item {
    flex-direction: column;
    text-align: center;
  }
  
  .recording-actions {
    justify-content: center;
  }
}
</style>