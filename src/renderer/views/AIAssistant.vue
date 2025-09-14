<template>
  <Layout>
    <div class="ai-assistant">
    <div class="ai-header">
      <h2>🤖 AI智能助手</h2>
      <div class="ai-tabs">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="💬 教学问答" name="qa"></el-tab-pane>
          <el-tab-pane label="📚 备课助手" name="lesson_prep"></el-tab-pane>
          <el-tab-pane label="✍️ 作文批改" name="essay_grading"></el-tab-pane>
          <el-tab-pane label="🌐 教育资源" name="resources"></el-tab-pane>
          <el-tab-pane label="🎬 多媒体工具" name="multimedia"></el-tab-pane>
          <el-tab-pane label="📅 日程提醒" name="schedule"></el-tab-pane>
          <el-tab-pane label="⚙️ 设置" name="settings"></el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 教学问答 -->
    <div v-if="activeTab === 'qa'" class="chat-container">
      <div class="chat-sidebar">
        <div class="session-header">
          <el-button type="primary" @click="createNewSession('qa')" size="small">
            <el-icon><Plus /></el-icon>
            新建对话
          </el-button>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索对话..."
            size="small"
            style="margin-top: 8px"
            @input="searchMessages"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="session-list">
          <div 
            v-for="session in qaSessions" 
            :key="session.id"
            :class="['session-item', { active: currentSessionId === session.id }]"
            @click="selectSession(session.id)"
          >
            <div class="session-title">{{ session.title }}</div>
            <div class="session-time">{{ formatTime(session.updated_at) }}</div>
            <el-button 
              type="danger" 
              size="small" 
              text 
              @click.stop="deleteSession(session.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="chat-messages" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-chat">
            <el-icon size="48"><ChatDotRound /></el-icon>
            <p>开始与AI助手对话吧！</p>
            <div class="quick-questions">
              <el-tag 
                v-for="question in quickQuestions" 
                :key="question"
                @click="sendMessage(question)"
                class="quick-question"
              >
                {{ question }}
              </el-tag>
            </div>
          </div>
          
          <div v-for="(message, index) in (searchKeyword ? filteredMessages : messages)" :key="message.id" :class="['message', message.role]">
            <div class="message-avatar">
              <el-icon v-if="message.role === 'user'"><User /></el-icon>
              <el-icon v-else><Robot /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-actions" v-if="message.role === 'assistant'">
                <el-button size="small" text @click="copyMessage(message.content)">
                  <el-icon><Copy /></el-icon>
                  复制
                </el-button>
                <el-button size="small" text @click="regenerateResponse(index)" :loading="isLoading">
                  <el-icon><Refresh /></el-icon>
                  重新生成
                </el-button>
              </div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <div class="input-toolbar">
            <div class="quick-questions">
              <el-tag 
                v-for="question in quickQuestions" 
                :key="question" 
                @click="inputMessage = question"
                class="quick-question-tag"
                size="small"
              >
                {{ question }}
              </el-tag>
            </div>
            <el-button 
              size="small" 
              @click="showSmartPrompts = !showSmartPrompts"
              :type="showSmartPrompts ? 'primary' : 'default'"
            >
              智能提示
            </el-button>
          </div>
          
          <div v-if="showSmartPrompts" class="smart-prompts">
            <div class="prompt-category">
              <h4>{{ activeTab === 'qa' ? '教学问答' : activeTab === 'lesson_prep' ? '备课助手' : '作文批改' }}提示词</h4>
              <div class="prompt-list">
                <el-tag 
                  v-for="prompt in getCurrentSmartPrompts()" 
                  :key="prompt" 
                  @click="insertSmartPrompt(prompt)"
                  class="prompt-tag"
                  size="small"
                >
                  {{ prompt }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            @keydown.ctrl.enter="sendCurrentMessage"
            :disabled="isLoading"
          />
          <div class="input-actions">
            <span class="input-tip">Ctrl + Enter 发送</span>
            <el-button 
              type="primary" 
              @click="sendCurrentMessage" 
              :loading="isLoading"
              :disabled="!inputMessage.trim()"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 备课助手 -->
    <div v-if="activeTab === 'lesson_prep'" class="lesson-prep">
      <div class="prep-tools">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card class="tool-card" @click="openLessonPlanGenerator">
              <div class="tool-icon">
                <el-icon size="32"><Document /></el-icon>
              </div>
              <h3>教案生成</h3>
              <p>根据课程内容自动生成教案</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="tool-card" @click="openContentAnalyzer">
              <div class="tool-icon">
                <el-icon size="32"><DataAnalysis /></el-icon>
              </div>
              <h3>内容分析</h3>
              <p>分析教学重点和难点</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="tool-card" @click="openQuestionGenerator">
              <div class="tool-icon">
                <el-icon size="32"><QuestionFilled /></el-icon>
              </div>
              <h3>题目生成</h3>
              <p>自动生成练习题和测试题</p>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="8">
            <el-card class="tool-card" @click="openTemplateManager">
              <div class="tool-icon">
                <el-icon size="32"><DocumentChecked /></el-icon>
              </div>
              <h3>模板管理</h3>
              <p>查看和使用保存的模板</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="tool-card" @click="openCurriculumPlanner">
              <div class="tool-icon">
                <el-icon size="32"><DataAnalysis /></el-icon>
              </div>
              <h3>课程规划</h3>
              <p>制定学期教学计划</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="tool-card" @click="openResourceLibrary">
              <div class="tool-icon">
                <el-icon size="32"><Document /></el-icon>
              </div>
              <h3>资源库</h3>
              <p>教学资源收藏和管理</p>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="prep-workspace" v-if="prepWorkspace.visible">
        <el-card>
          <template #header>
            <div class="workspace-header">
              <span>{{ prepWorkspace.title }}</span>
              <div class="header-actions">
                <el-button @click="resetPrepForm">重置</el-button>
                <el-button type="primary" @click="generateContent" :loading="isGenerating">
                  生成内容
                </el-button>
              </div>
            </div>
          </template>
          
          <el-form :model="prepForm" label-width="100px">
            <el-form-item label="学科">
              <el-select v-model="prepForm.subject" placeholder="请选择学科">
                <el-option label="语文" value="chinese"></el-option>
                <el-option label="数学" value="math"></el-option>
                <el-option label="英语" value="english"></el-option>
                <el-option label="物理" value="physics"></el-option>
                <el-option label="化学" value="chemistry"></el-option>
                <el-option label="生物" value="biology"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="年级">
              <el-select v-model="prepForm.grade" placeholder="请选择年级">
                <el-option v-for="i in 12" :key="i" :label="`${i}年级`" :value="i"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="课程主题">
              <el-input v-model="prepForm.topic" placeholder="请输入课程主题"></el-input>
            </el-form-item>
            <el-form-item label="教学目标">
              <el-input v-model="prepForm.objectives" type="textarea" :rows="3" placeholder="请输入教学目标"></el-input>
            </el-form-item>
          </el-form>
          
          <div v-if="generatedContent" class="generated-content">
            <h4>生成的内容：</h4>
            <div class="content-display" v-html="generatedContent"></div>
            <div class="content-actions">
              <el-button @click="copyContent">复制内容</el-button>
              <el-button @click="exportContent">导出文档</el-button>
              <el-button type="primary" @click="saveContent">保存到模板</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 作文批改 -->
    <div v-if="activeTab === 'essay_grading'" class="essay-grading">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>作文输入</span>
            </template>
            <el-form :model="essayForm">
              <el-form-item label="学生姓名">
                <el-input v-model="essayForm.studentName" placeholder="请输入学生姓名"></el-input>
              </el-form-item>
              <el-form-item label="作文题目">
                <el-input v-model="essayForm.title" placeholder="请输入作文题目"></el-input>
              </el-form-item>
              <el-form-item label="作文内容">
                <el-input 
                  v-model="essayForm.content" 
                  type="textarea" 
                  :rows="15" 
                  placeholder="请粘贴或输入作文内容"
                ></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="gradeEssay" :loading="isGrading" :disabled="!essayForm.content.trim()">
                  开始批改
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>批改结果</span>
            </template>
            <div v-if="gradingResult" class="grading-result">
              <div class="score-section">
                <h4>总体评分</h4>
                <div class="total-score">
                  <el-rate v-model="gradingResult.score" disabled show-score text-color="#ff9900"></el-rate>
                  <span class="score-text">{{ gradingResult.score }}/5分</span>
                </div>
                
                <div v-if="gradingResult.aspectScores" class="aspect-scores">
                  <h5>各维度评分</h5>
                  <div class="score-item" v-if="gradingResult.aspectScores.content">
                    <span>内容与主题：</span>
                    <el-rate v-model="gradingResult.aspectScores.content" disabled size="small"></el-rate>
                  </div>
                  <div class="score-item" v-if="gradingResult.aspectScores.language">
                    <span>语言表达：</span>
                    <el-rate v-model="gradingResult.aspectScores.language" disabled size="small"></el-rate>
                  </div>
                  <div class="score-item" v-if="gradingResult.aspectScores.structure">
                    <span>结构组织：</span>
                    <el-rate v-model="gradingResult.aspectScores.structure" disabled size="small"></el-rate>
                  </div>
                  <div class="score-item" v-if="gradingResult.aspectScores.innovation">
                    <span>创新亮点：</span>
                    <el-rate v-model="gradingResult.aspectScores.innovation" disabled size="small"></el-rate>
                  </div>
                </div>
              </div>
              
              <div class="feedback-section">
                <h4>详细评价</h4>
                <div class="feedback-item" v-for="item in gradingResult.feedback" :key="item.aspect">
                  <div class="feedback-header">
                    <strong>{{ item.aspect }}</strong>
                  </div>
                  <div class="feedback-content">
                    {{ item.comment }}
                  </div>
                </div>
              </div>
              
              <div v-if="gradingResult.highlights && gradingResult.highlights.length > 0" class="highlights-section">
                <h4>✨ 优秀之处</h4>
                <ul class="highlights-list">
                  <li v-for="highlight in gradingResult.highlights" :key="highlight" class="highlight-item">
                    {{ highlight }}
                  </li>
                </ul>
              </div>
              
              <div class="suggestions-section">
                <h4>💡 改进建议</h4>
                <ul class="suggestions-list">
                  <li v-for="suggestion in gradingResult.suggestions" :key="suggestion" class="suggestion-item">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
              
              <div class="actions">
                <el-button @click="exportGradingResult" icon="Download">导出报告</el-button>
                <el-button type="primary" @click="saveGradingResult" icon="Collection">保存记录</el-button>
              </div>
            </div>
            <div v-else class="empty-result">
              <el-icon size="48"><DocumentChecked /></el-icon>
              <p>请在左侧输入作文内容并点击批改</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 教育资源导航 -->
    <div v-if="activeTab === 'resources'" class="education-resources">
      <div class="resources-header">
        <h3>🌐 教育资源导航</h3>
        <p>快速访问常用教育网站和工具</p>
      </div>
      
      <div class="resources-categories">
        <el-row :gutter="20">
          <!-- 官方教育网站 -->
          <el-col :span="8">
            <el-card class="resource-category">
              <template #header>
                <div class="category-header">
                  <el-icon><School /></el-icon>
                  <span>官方教育网站</span>
                </div>
              </template>
              <div class="resource-links">
                <div class="resource-item" v-for="site in officialSites" :key="site.name" @click="openLink(site.url)">
                  <div class="resource-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name">{{ site.name }}</div>
                    <div class="resource-desc">{{ site.description }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 教学资源平台 -->
          <el-col :span="8">
            <el-card class="resource-category">
              <template #header>
                <div class="category-header">
                  <el-icon><Reading /></el-icon>
                  <span>教学资源平台</span>
                </div>
              </template>
              <div class="resource-links">
                <div class="resource-item" v-for="platform in teachingPlatforms" :key="platform.name" @click="openLink(platform.url)">
                  <div class="resource-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name">{{ platform.name }}</div>
                    <div class="resource-desc">{{ platform.description }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 在线工具 -->
          <el-col :span="8">
            <el-card class="resource-category">
              <template #header>
                <div class="category-header">
                  <el-icon><Tools /></el-icon>
                  <span>在线工具</span>
                </div>
              </template>
              <div class="resource-links">
                <div class="resource-item" v-for="tool in onlineTools" :key="tool.name" @click="openLink(tool.url)">
                  <div class="resource-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name">{{ tool.name }}</div>
                    <div class="resource-desc">{{ tool.description }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- 学科资源 -->
          <el-col :span="8">
            <el-card class="resource-category">
              <template #header>
                <div class="category-header">
                  <el-icon><Notebook /></el-icon>
                  <span>学科资源</span>
                </div>
              </template>
              <div class="resource-links">
                <div class="resource-item" v-for="subject in subjectResources" :key="subject.name" @click="openLink(subject.url)">
                  <div class="resource-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name">{{ subject.name }}</div>
                    <div class="resource-desc">{{ subject.description }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 培训学习 -->
          <el-col :span="8">
            <el-card class="resource-category">
              <template #header>
                <div class="category-header">
                  <el-icon><Trophy /></el-icon>
                  <span>培训学习</span>
                </div>
              </template>
              <div class="resource-links">
                <div class="resource-item" v-for="training in trainingResources" :key="training.name" @click="openLink(training.url)">
                  <div class="resource-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name">{{ training.name }}</div>
                    <div class="resource-desc">{{ training.description }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 常用网站 -->
          <el-col :span="8">
            <el-card class="resource-category">
              <template #header>
                <div class="category-header">
                  <el-icon><Star /></el-icon>
                  <span>常用网站</span>
                </div>
              </template>
              <div class="resource-links">
                <div class="resource-item" v-for="common in commonSites" :key="common.name" @click="openLink(common.url)">
                  <div class="resource-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="resource-info">
                    <div class="resource-name">{{ common.name }}</div>
                    <div class="resource-desc">{{ common.description }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="custom-resources">
        <el-card>
          <template #header>
            <div class="category-header">
              <el-icon><Plus /></el-icon>
              <span>自定义资源</span>
              <el-button type="primary" size="small" @click="showAddResourceDialog = true" style="margin-left: auto;">
                添加资源
              </el-button>
            </div>
          </template>
          <div class="custom-resource-list">
            <div v-if="customResources.length === 0" class="empty-custom">
              <el-icon size="48"><FolderOpened /></el-icon>
              <p>暂无自定义资源，点击上方按钮添加</p>
            </div>
            <div v-else class="resource-links">
              <div class="resource-item" v-for="(resource, index) in customResources" :key="index">
                <div class="resource-icon">
                  <el-icon><Link /></el-icon>
                </div>
                <div class="resource-info" @click="openLink(resource.url)">
                  <div class="resource-name">{{ resource.name }}</div>
                  <div class="resource-desc">{{ resource.description }}</div>
                </div>
                <el-button type="danger" size="small" text @click="removeCustomResource(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 添加自定义资源对话框 -->
    <el-dialog v-model="showAddResourceDialog" title="添加自定义资源" width="500px">
      <el-form :model="newResource" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newResource.name" placeholder="请输入资源名称"></el-input>
        </el-form-item>
        <el-form-item label="网址">
          <el-input v-model="newResource.url" placeholder="请输入网址（包含http://或https://）"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newResource.description" placeholder="请输入资源描述"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddResourceDialog = false">取消</el-button>
        <el-button type="primary" @click="addCustomResource">确定</el-button>
      </template>
    </el-dialog>

    <!-- 多媒体工具 -->
    <div v-if="activeTab === 'multimedia'" class="multimedia-tools">
      <div class="tools-header">
        <h3>🎬 多媒体工具</h3>
        <p>截图标注、录屏功能、二维码生成等实用工具</p>
      </div>
      
      <div class="tools-grid">
        <el-row :gutter="20">
          <!-- 截图工具 -->
          <el-col :span="8">
            <el-card class="tool-card screenshot-tool">
              <template #header>
                <div class="tool-header">
                  <el-icon size="24"><Camera /></el-icon>
                  <span>截图标注</span>
                </div>
              </template>
              <div class="tool-content">
                <p class="tool-description">快速截图并进行标注，支持文字、箭头、高亮等标注功能</p>
                <div class="tool-actions">
                  <el-button type="primary" @click="takeScreenshot" :loading="isScreenshotting">
                    <el-icon><Camera /></el-icon>
                    开始截图
                  </el-button>
                  <el-button @click="openScreenshotHistory">
                    <el-icon><FolderOpened /></el-icon>
                    历史截图
                  </el-button>
                </div>
                <div v-if="currentScreenshot" class="screenshot-preview">
                  <img :src="currentScreenshot" alt="截图预览" />
                  <div class="screenshot-actions">
                    <el-button size="small" @click="annotateScreenshot">
                      <el-icon><Edit /></el-icon>
                      标注
                    </el-button>
                    <el-button size="small" @click="saveScreenshot">
                      <el-icon><Download /></el-icon>
                      保存
                    </el-button>
                    <el-button size="small" @click="copyScreenshot">
                      <el-icon><Copy /></el-icon>
                      复制
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 录屏工具 -->
          <el-col :span="8">
            <el-card class="tool-card recording-tool">
              <template #header>
                <div class="tool-header">
                  <el-icon size="24"><VideoCamera /></el-icon>
                  <span>录屏功能</span>
                </div>
              </template>
              <div class="tool-content">
                <p class="tool-description">录制屏幕内容，支持全屏录制和区域录制</p>
                <div class="recording-status" v-if="isRecording">
                  <div class="recording-indicator">
                    <div class="recording-dot"></div>
                    <span>正在录制... {{ recordingTime }}</span>
                  </div>
                </div>
                <div class="tool-actions">
                  <el-button 
                    v-if="!isRecording" 
                    type="danger" 
                    @click="startRecording"
                  >
                    <el-icon><VideoCamera /></el-icon>
                    开始录制
                  </el-button>
                  <el-button 
                    v-else 
                    type="success" 
                    @click="stopRecording"
                  >
                    <el-icon><VideoPause /></el-icon>
                    停止录制
                  </el-button>
                  <el-button @click="openRecordingHistory">
                    <el-icon><FolderOpened /></el-icon>
                    录制历史
                  </el-button>
                </div>
                <div class="recording-settings">
                  <el-form size="small">
                    <el-form-item label="录制质量">
                      <el-select v-model="recordingQuality" size="small">
                        <el-option label="高清 (1080p)" value="1080p"></el-option>
                        <el-option label="标清 (720p)" value="720p"></el-option>
                        <el-option label="流畅 (480p)" value="480p"></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item label="录制音频">
                      <el-switch v-model="recordAudio"></el-switch>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 二维码生成 -->
          <el-col :span="8">
            <el-card class="tool-card qrcode-tool">
              <template #header>
                <div class="tool-header">
                  <el-icon size="24"><Grid /></el-icon>
                  <span>二维码生成</span>
                </div>
              </template>
              <div class="tool-content">
                <p class="tool-description">生成各种类型的二维码，支持文本、网址、WiFi等</p>
                <div class="qrcode-form">
                  <el-form size="small">
                    <el-form-item label="类型">
                      <el-select v-model="qrcodeType" @change="onQrcodeTypeChange">
                        <el-option label="文本" value="text"></el-option>
                        <el-option label="网址" value="url"></el-option>
                        <el-option label="WiFi" value="wifi"></el-option>
                        <el-option label="联系人" value="contact"></el-option>
                      </el-select>
                    </el-form-item>
                    
                    <!-- 文本/网址输入 -->
                    <el-form-item v-if="qrcodeType === 'text' || qrcodeType === 'url'" :label="qrcodeType === 'text' ? '文本内容' : '网址'">
                      <el-input 
                        v-model="qrcodeContent" 
                        type="textarea" 
                        :placeholder="qrcodeType === 'text' ? '请输入要生成二维码的文本内容' : '请输入网址（如：https://example.com）'"
                        :rows="3"
                      ></el-input>
                    </el-form-item>
                    
                    <!-- WiFi配置 -->
                    <template v-if="qrcodeType === 'wifi'">
                      <el-form-item label="网络名称">
                        <el-input v-model="wifiConfig.ssid" placeholder="WiFi名称"></el-input>
                      </el-form-item>
                      <el-form-item label="密码">
                        <el-input v-model="wifiConfig.password" type="password" placeholder="WiFi密码" show-password></el-input>
                      </el-form-item>
                      <el-form-item label="加密方式">
                        <el-select v-model="wifiConfig.security">
                          <el-option label="WPA/WPA2" value="WPA"></el-option>
                          <el-option label="WEP" value="WEP"></el-option>
                          <el-option label="无密码" value="nopass"></el-option>
                        </el-select>
                      </el-form-item>
                    </template>
                    
                    <!-- 联系人信息 -->
                    <template v-if="qrcodeType === 'contact'">
                      <el-form-item label="姓名">
                        <el-input v-model="contactInfo.name" placeholder="联系人姓名"></el-input>
                      </el-form-item>
                      <el-form-item label="电话">
                        <el-input v-model="contactInfo.phone" placeholder="电话号码"></el-input>
                      </el-form-item>
                      <el-form-item label="邮箱">
                        <el-input v-model="contactInfo.email" placeholder="邮箱地址"></el-input>
                      </el-form-item>
                    </template>
                  </el-form>
                </div>
                
                <div class="tool-actions">
                  <el-button type="primary" @click="generateQRCode" :disabled="!canGenerateQRCode">
                    <el-icon><Grid /></el-icon>
                    生成二维码
                  </el-button>
                  <el-button @click="clearQRCode">
                    <el-icon><Refresh /></el-icon>
                    清空
                  </el-button>
                </div>
                
                <div v-if="generatedQRCode" class="qrcode-result">
                  <div class="qrcode-image">
                    <canvas ref="qrcodeCanvas" width="200" height="200"></canvas>
                  </div>
                  <div class="qrcode-actions">
                    <el-button size="small" @click="downloadQRCode">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                    <el-button size="small" @click="copyQRCodeImage">
                      <el-icon><Copy /></el-icon>
                      复制图片
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- 图片处理工具 -->
          <el-col :span="12">
            <el-card class="tool-card image-tool">
              <template #header>
                <div class="tool-header">
                  <el-icon size="24"><Picture /></el-icon>
                  <span>图片处理</span>
                </div>
              </template>
              <div class="tool-content">
                <p class="tool-description">图片压缩、格式转换、尺寸调整等功能</p>
                <div class="upload-area" @click="selectImage">
                  <el-icon size="48"><Plus /></el-icon>
                  <p>点击选择图片或拖拽到此处</p>
                </div>
                <input ref="imageInput" type="file" accept="image/*" @change="handleImageSelect" style="display: none;" />
                
                <div v-if="selectedImage" class="image-preview">
                  <img :src="selectedImage.preview" alt="预览" />
                  <div class="image-info">
                    <p>文件名: {{ selectedImage.name }}</p>
                    <p>大小: {{ formatFileSize(selectedImage.size) }}</p>
                    <p>尺寸: {{ selectedImage.width }} x {{ selectedImage.height }}</p>
                  </div>
                  
                  <div class="image-operations">
                    <el-form size="small">
                      <el-form-item label="压缩质量">
                        <el-slider v-model="imageQuality" :min="10" :max="100" show-input></el-slider>
                      </el-form-item>
                      <el-form-item label="输出格式">
                        <el-select v-model="outputFormat">
                          <el-option label="JPEG" value="jpeg"></el-option>
                          <el-option label="PNG" value="png"></el-option>
                          <el-option label="WebP" value="webp"></el-option>
                        </el-select>
                      </el-form-item>
                    </el-form>
                    
                    <div class="tool-actions">
                      <el-button type="primary" @click="processImage">
                        <el-icon><Tools /></el-icon>
                        处理图片
                      </el-button>
                      <el-button @click="clearImage">
                        <el-icon><Delete /></el-icon>
                        清除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <!-- 文档转换工具 -->
          <el-col :span="12">
            <el-card class="tool-card document-tool">
              <template #header>
                <div class="tool-header">
                  <el-icon size="24"><Document /></el-icon>
                  <span>文档转换</span>
                </div>
              </template>
              <div class="tool-content">
                <p class="tool-description">支持PDF、Word、图片等格式互转</p>
                <div class="conversion-options">
                  <el-form size="small">
                    <el-form-item label="转换类型">
                      <el-select v-model="conversionType">
                        <el-option label="图片转PDF" value="image-to-pdf"></el-option>
                        <el-option label="PDF转图片" value="pdf-to-image"></el-option>
                        <el-option label="文本转PDF" value="text-to-pdf"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-form>
                  
                  <div class="file-upload-area">
                    <el-upload
                      ref="documentUpload"
                      :auto-upload="false"
                      :show-file-list="true"
                      :on-change="handleDocumentSelect"
                      drag
                    >
                      <el-icon size="48"><UploadFilled /></el-icon>
                      <div class="el-upload__text">
                        拖拽文件到此处或<em>点击上传</em>
                      </div>
                    </el-upload>
                  </div>
                  
                  <div class="tool-actions">
                    <el-button type="primary" @click="convertDocument" :disabled="!selectedDocument">
                      <el-icon><Refresh /></el-icon>
                      开始转换
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 日程提醒 -->
    <div v-if="activeTab === 'schedule'" class="schedule-system">
      <div class="schedule-header">
        <h3>📅 日程提醒系统</h3>
        <p>管理待办事项、联系人信息和重要日期提醒</p>
      </div>
      
      <el-row :gutter="20">
        <!-- 待办事项 -->
        <el-col :span="8">
          <el-card class="schedule-card">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><Document /></el-icon>
                <span>待办事项</span>
                <el-button type="primary" size="small" @click="showAddTodo = true">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </div>
            </template>
            
            <div class="todo-list">
              <div v-if="todoList.length === 0" class="empty-state">
                <el-icon size="48" color="#ccc"><Document /></el-icon>
                <p>暂无待办事项</p>
              </div>
              
              <div v-for="todo in todoList" :key="todo.id" class="todo-item" :class="{ completed: todo.completed }">
                <el-checkbox v-model="todo.completed" @change="updateTodo(todo)" />
                <div class="todo-content">
                  <div class="todo-title" :class="{ 'line-through': todo.completed }">{{ todo.title }}</div>
                  <div class="todo-meta">
                    <el-tag :type="getPriorityType(todo.priority)" size="small">{{ todo.priority }}</el-tag>
                    <span class="todo-date">{{ formatDate(todo.dueDate) }}</span>
                  </div>
                </div>
                <div class="todo-actions">
                  <el-button type="text" size="small" @click="editTodo(todo)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button type="text" size="small" @click="deleteTodo(todo.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 联系人管理 -->
        <el-col :span="8">
          <el-card class="schedule-card">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><User /></el-icon>
                <span>联系人管理</span>
                <el-button type="primary" size="small" @click="showAddContact = true">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </div>
            </template>
            
            <div class="contact-list">
              <div v-if="contactList.length === 0" class="empty-state">
                <el-icon size="48" color="#ccc"><User /></el-icon>
                <p>暂无联系人</p>
              </div>
              
              <div v-for="contact in contactList" :key="contact.id" class="contact-item">
                <el-avatar :size="40" :src="contact.avatar">
                  {{ contact.name.charAt(0) }}
                </el-avatar>
                <div class="contact-info">
                  <div class="contact-name">{{ contact.name }}</div>
                  <div class="contact-details">
                    <div v-if="contact.phone" class="contact-phone">📞 {{ contact.phone }}</div>
                    <div v-if="contact.email" class="contact-email">📧 {{ contact.email }}</div>
                  </div>
                </div>
                <div class="contact-actions">
                  <el-button type="text" size="small" @click="editContact(contact)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button type="text" size="small" @click="deleteContact(contact.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 重要日期提醒 -->
        <el-col :span="8">
          <el-card class="schedule-card">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><Calendar /></el-icon>
                <span>重要日期</span>
                <el-button type="primary" size="small" @click="showAddReminder = true">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </div>
            </template>
            
            <div class="reminder-list">
              <div v-if="reminderList.length === 0" class="empty-state">
                <el-icon size="48" color="#ccc"><Calendar /></el-icon>
                <p>暂无重要日期</p>
              </div>
              
              <div v-for="reminder in reminderList" :key="reminder.id" class="reminder-item">
                <div class="reminder-date">
                  <div class="date-day">{{ getDayFromDate(reminder.date) }}</div>
                  <div class="date-month">{{ getMonthFromDate(reminder.date) }}</div>
                </div>
                <div class="reminder-content">
                  <div class="reminder-title">{{ reminder.title }}</div>
                  <div class="reminder-desc">{{ reminder.description }}</div>
                  <div class="reminder-meta">
                    <el-tag :type="getReminderType(reminder.type)" size="small">{{ reminder.type }}</el-tag>
                    <span class="reminder-time">{{ formatDateTime(reminder.date) }}</span>
                  </div>
                </div>
                <div class="reminder-actions">
                  <el-button type="text" size="small" @click="editReminder(reminder)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button type="text" size="small" @click="deleteReminder(reminder.id)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 日历视图 -->
      <el-row style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <el-icon size="20"><Calendar /></el-icon>
                <span>日历视图</span>
                <div class="calendar-controls">
                  <el-button-group>
                    <el-button size="small" @click="changeCalendarView('month')" :type="calendarView === 'month' ? 'primary' : 'default'">月视图</el-button>
                    <el-button size="small" @click="changeCalendarView('week')" :type="calendarView === 'week' ? 'primary' : 'default'">周视图</el-button>
                  </el-button-group>
                </div>
              </div>
            </template>
            
            <div class="calendar-container">
              <el-calendar v-model="calendarDate" class="schedule-calendar">
                <template #date-cell="{ data }">
                  <div class="calendar-cell">
                    <div class="cell-date">{{ data.day.split('-').slice(-1)[0] }}</div>
                    <div class="cell-events">
                      <div v-for="event in getEventsForDate(data.day)" :key="event.id" class="event-dot" :class="event.type"></div>
                    </div>
                  </div>
                </template>
              </el-calendar>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 添加待办事项对话框 -->
    <el-dialog v-model="showAddTodo" title="添加待办事项" width="500px">
      <el-form :model="todoForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="todoForm.title" placeholder="请输入待办事项标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="todoForm.description" type="textarea" :rows="3" placeholder="请输入详细描述" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="todoForm.priority" placeholder="选择优先级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="todoForm.dueDate" type="datetime" placeholder="选择截止日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTodo = false">取消</el-button>
        <el-button type="primary" @click="addTodo">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加联系人对话框 -->
    <el-dialog v-model="showAddContact" title="添加联系人" width="500px">
      <el-form :model="contactForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="contactForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="contactForm.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="contactForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="contactForm.position" placeholder="请输入职位" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="contactForm.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddContact = false">取消</el-button>
        <el-button type="primary" @click="addContact">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加重要日期对话框 -->
    <el-dialog v-model="showAddReminder" title="添加重要日期" width="500px">
      <el-form :model="reminderForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="reminderForm.title" placeholder="请输入提醒标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="reminderForm.description" type="textarea" :rows="3" placeholder="请输入详细描述" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="reminderForm.type" placeholder="选择类型">
            <el-option label="会议" value="会议" />
            <el-option label="考试" value="考试" />
            <el-option label="活动" value="活动" />
            <el-option label="截止日期" value="截止日期" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期时间">
          <el-date-picker v-model="reminderForm.date" type="datetime" placeholder="选择日期时间" />
        </el-form-item>
        <el-form-item label="提前提醒">
          <el-select v-model="reminderForm.advanceNotice" placeholder="选择提前提醒时间">
            <el-option label="不提醒" value="0" />
            <el-option label="5分钟前" value="5" />
            <el-option label="15分钟前" value="15" />
            <el-option label="30分钟前" value="30" />
            <el-option label="1小时前" value="60" />
            <el-option label="1天前" value="1440" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddReminder = false">取消</el-button>
        <el-button type="primary" @click="addReminder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设置 -->
    <div v-if="activeTab === 'settings'" class="ai-settings">
      <el-card>
        <template #header>
          <span>AI服务配置</span>
        </template>
        
        <el-form :model="aiConfig" label-width="150px">
          <el-divider content-position="left">OpenAI 配置</el-divider>
          <el-form-item label="API密钥">
            <el-input 
              v-model="aiConfig.openai_api_key" 
              type="password" 
              placeholder="请输入OpenAI API密钥"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item label="API地址">
            <el-input v-model="aiConfig.openai_base_url" placeholder="https://api.openai.com/v1"></el-input>
          </el-form-item>
          
          <el-divider content-position="left">通义千问 配置</el-divider>
          <el-form-item label="API密钥">
            <el-input 
              v-model="aiConfig.qwen_api_key" 
              type="password" 
              placeholder="请输入通义千问API密钥"
              show-password
            ></el-input>
          </el-form-item>
          <el-form-item label="API地址">
            <el-input v-model="aiConfig.qwen_base_url" placeholder="https://dashscope.aliyuncs.com/api/v1"></el-input>
          </el-form-item>
          
          <el-divider content-position="left">通用配置</el-divider>
          <el-form-item label="默认模型">
            <el-select v-model="aiConfig.default_model" placeholder="请选择默认模型">
              <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo"></el-option>
              <el-option label="GPT-4" value="gpt-4"></el-option>
              <el-option label="通义千问" value="qwen-turbo"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="最大Token数">
            <el-input-number v-model="aiConfig.max_tokens" :min="100" :max="4000" :step="100"></el-input-number>
          </el-form-item>
          <el-form-item label="创造性参数">
            <el-slider v-model="aiConfig.temperature" :min="0" :max="1" :step="0.1" show-input></el-slider>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveConfig" :loading="isSavingConfig">
              保存配置
            </el-button>
            <el-button @click="testConnection" :loading="isTesting">
              测试连接
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { School, Reading, Tools, Notebook, Trophy, Star, Link, FolderOpened, Camera, VideoCamera, VideoPause, Grid, Picture, Plus, Edit, Download, Copy, Refresh, Delete, Document, UploadFilled, User, Calendar, ChatDotRound, DataAnalysis, QuestionFilled, DocumentChecked, Search } from '@element-plus/icons-vue'
import Layout from './Layout.vue'

// 响应式数据
const activeTab = ref('qa')
const currentSessionId = ref<string | null>(null)
const messages = ref<any[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const isGenerating = ref(false)
const isGrading = ref(false)
const isSavingConfig = ref(false)
const isTesting = ref(false)
const searchKeyword = ref('')
const showSmartPrompts = ref(false)
const filteredMessages = ref<any[]>([])

// 会话列表
const qaSessions = ref<any[]>([])
const lessonPrepSessions = ref<any[]>([])
const essayGradingSessions = ref<any[]>([])

// 消息容器引用
const messagesContainer = ref<HTMLElement>()
const qrcodeCanvas = ref<HTMLCanvasElement>()
const imageInput = ref<HTMLInputElement>()

// 快速问题
const quickQuestions = [
  '如何提高学生的学习兴趣？',
  '怎样设计有效的课堂活动？',
  '如何处理课堂纪律问题？',
  '怎样进行差异化教学？',
  '如何制定个性化学习计划？',
  '怎样有效评估学生学习成果？',
  '如何营造良好的课堂氛围？',
  '怎样处理学习困难的学生？'
]

// 智能提示词库
const smartPrompts = {
  qa: [
    '请详细解释...',
    '能否提供具体的实施步骤？',
    '这种方法的优缺点是什么？',
    '有没有相关的案例分析？',
    '如何评估效果？'
  ],
  lesson_prep: [
    '请生成详细的教学大纲',
    '设计互动式教学活动',
    '制定学习目标和评估标准',
    '提供多媒体教学资源建议',
    '设计差异化教学方案'
  ],
  essay_grading: [
    '请从结构、内容、语言三个维度评价',
    '提供具体的改进建议',
    '给出评分理由和依据',
    '推荐相关的写作技巧',
    '设计后续练习方案'
  ]
}

// 备课助手相关
const prepWorkspace = reactive({
  visible: false,
  title: '',
  type: ''
})

const prepForm = reactive({
  subject: '',
  grade: null,
  topic: '',
  objectives: ''
})

const generatedContent = ref('')

// 作文批改相关
const essayForm = reactive({
  studentName: '',
  title: '',
  content: ''
})

const gradingResult = ref<any>(null)

// 教育资源导航相关
const showAddResourceDialog = ref(false)
const customResources = ref<any[]>([])
const newResource = reactive({
  name: '',
  url: '',
  description: ''
})

// 官方教育网站
const officialSites = [
  { name: '中华人民共和国教育部', url: 'http://www.moe.gov.cn/', description: '国家教育政策和资讯' },
  { name: '国家智慧教育平台', url: 'https://www.smartedu.cn/', description: '国家级教育资源平台' },
  { name: '中国教育考试网', url: 'http://www.neea.edu.cn/', description: '各类教育考试信息' },
  { name: '全国教师管理信息系统', url: 'http://www.jiaoshi.com.cn/', description: '教师资格和培训管理' },
  { name: '中小学教师资格考试网', url: 'http://ntce.neea.edu.cn/', description: '教师资格考试报名' }
]

// 教学资源平台
const teachingPlatforms = [
  { name: '学习强国', url: 'https://www.xuexi.cn/', description: '综合学习资源平台' },
  { name: '中国大学MOOC', url: 'https://www.icourse163.org/', description: '高质量在线课程' },
  { name: '学堂在线', url: 'https://www.xuetangx.com/', description: '清华大学慕课平台' },
  { name: '智慧树', url: 'https://www.zhihuishu.com/', description: '跨校共享课程平台' },
  { name: '超星学习通', url: 'https://www.chaoxing.com/', description: '移动学习平台' }
]

// 在线工具
const onlineTools = [
  { name: 'ProcessOn', url: 'https://www.processon.com/', description: '在线思维导图工具' },
  { name: '石墨文档', url: 'https://shimo.im/', description: '在线协作文档' },
  { name: '腾讯会议', url: 'https://meeting.tencent.com/', description: '在线视频会议' },
  { name: 'Canva', url: 'https://www.canva.cn/', description: '在线设计工具' },
  { name: '问卷星', url: 'https://www.wjx.cn/', description: '在线问卷调查' }
]

// 学科资源
const subjectResources = [
  { name: '人教数字教材', url: 'http://bp.pep.com.cn/', description: '人教版数字教材' },
  { name: '语文备课大师', url: 'http://www.xiexingcun.com/', description: '语文教学资源' },
  { name: '菁优网', url: 'https://www.jyeoo.com/', description: '中小学题库资源' },
  { name: '化学加', url: 'http://www.huaxuejia.cn/', description: '化学实验和资源' },
  { name: '物理好资源网', url: 'http://www.wuliok.com/', description: '物理教学资源' }
]

// 培训学习
const trainingResources = [
  { name: '国培网', url: 'http://www.guopei.edu.cn/', description: '教师国培计划' },
  { name: '继教网', url: 'http://www.teacher.com.cn/', description: '教师继续教育' },
  { name: '研修网', url: 'http://www.yanxiu.com/', description: '教师专业发展' },
  { name: '好未来教育开放平台', url: 'https://open.100tal.com/', description: '教育技术培训' },
  { name: '网易云课堂', url: 'https://study.163.com/', description: '职业技能学习' }
]

// 常用网站
const commonSites = [
  { name: '百度文库', url: 'https://wenku.baidu.com/', description: '文档资源分享' },
  { name: '道客巴巴', url: 'https://www.doc88.com/', description: '专业文档分享' },
  { name: '豆丁网', url: 'https://www.docin.com/', description: '文档分享社区' },
  { name: '爱课程', url: 'https://www.icourses.cn/', description: '精品课程资源' },
  { name: '中国知网', url: 'https://www.cnki.net/', description: '学术文献数据库' }
]

// 多媒体工具相关数据
// 截图功能
const isScreenshotting = ref(false)
const currentScreenshot = ref(null)
const screenshotHistory = ref([])

// 录屏功能
const isRecording = ref(false)
const recordingTime = ref('00:00')
const recordingQuality = ref('720p')
const recordAudio = ref(true)
const mediaRecorder = ref(null)
const recordingStream = ref(null)
const recordingTimer = ref(null)

// 二维码生成
const qrcodeType = ref('text')
const qrcodeContent = ref('')
const generatedQRCode = ref(null)
const wifiConfig = reactive({
  ssid: '',
  password: '',
  security: 'WPA'
})
const contactInfo = reactive({
  name: '',
  phone: '',
  email: ''
})

// 图片处理
const selectedImage = ref(null)
const imageQuality = ref(80)
const outputFormat = ref('jpeg')

// 文档转换
const conversionType = ref('image-to-pdf')
const selectedDocument = ref(null)
const documentUpload = ref(null)

// AI配置
const aiConfig = reactive({
  openai_api_key: '',
  openai_base_url: 'https://api.openai.com/v1',
  qwen_api_key: '',
  qwen_base_url: 'https://dashscope.aliyuncs.com/api/v1',
  default_model: 'gpt-3.5-turbo',
  max_tokens: 2000,
  temperature: 0.7
})

// 日程提醒系统数据
// 待办事项
const todos = ref([
  { id: 1, title: '准备明天的数学课件', completed: false, priority: 'high', dueDate: '2024-01-15', category: '教学' },
  { id: 2, title: '批改作业', completed: true, priority: 'medium', dueDate: '2024-01-14', category: '作业' },
  { id: 3, title: '家长会准备', completed: false, priority: 'high', dueDate: '2024-01-20', category: '会议' }
])
const showTodoDialog = ref(false)
const todoForm = reactive({
  title: '',
  priority: 'medium',
  dueDate: '',
  category: '教学',
  description: ''
})
const editingTodo = ref(null)

// 联系人管理
const contacts = ref([
  { id: 1, name: '张三', phone: '13800138001', email: 'zhangsan@example.com', role: '家长', studentName: '张小明' },
  { id: 2, name: '李四', phone: '13800138002', email: 'lisi@example.com', role: '同事', department: '数学组' },
  { id: 3, name: '王五', phone: '13800138003', email: 'wangwu@example.com', role: '学生', class: '三年级一班' }
])
const showContactDialog = ref(false)
const contactForm = reactive({
  name: '',
  phone: '',
  email: '',
  role: '家长',
  studentName: '',
  department: '',
  class: ''
})
const editingContact = ref(null)

// 重要日期提醒
const reminders = ref([
  { id: 1, title: '期中考试', date: '2024-01-25', type: '考试', status: 'active' },
  { id: 2, title: '家长会', date: '2024-01-20', type: '会议', status: 'active' },
  { id: 3, title: '教研活动', date: '2024-01-18', type: '活动', status: 'active' }
])
const showReminderDialog = ref(false)
const reminderForm = reactive({
  title: '',
  date: '',
  type: '考试',
  description: ''
})
const editingReminder = ref(null)

// 日历视图
const calendarView = ref('month')
const currentDate = ref(new Date())
const selectedDate = ref('')

// 生命周期
onMounted(() => {
  loadAIConfig()
  loadSessions()
  loadCustomResources()
})

// 方法
const handleTabClick = (tab: any) => {
  if (tab.name !== 'settings') {
    loadSessions(tab.name)
  }
}

const loadAIConfig = async () => {
  try {
    const config = await window.electronAPI.ai.getConfig()
    Object.assign(aiConfig, config)
  } catch (error) {
    console.error('加载AI配置失败:', error)
  }
}

const loadSessions = async (type?: string) => {
  try {
    const sessions = await window.electronAPI.ai.getSessions(type || activeTab.value)
    
    if (type === 'qa' || activeTab.value === 'qa') {
      qaSessions.value = sessions
    } else if (type === 'lesson_prep' || activeTab.value === 'lesson_prep') {
      lessonPrepSessions.value = sessions
    } else if (type === 'essay_grading' || activeTab.value === 'essay_grading') {
      essayGradingSessions.value = sessions
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
  }
}

const createNewSession = async (type: string) => {
  try {
    const title = `新对话 ${new Date().toLocaleString()}`
    const result = await window.electronAPI.ai.createSession(title, type)
    
    if (result.success) {
      await loadSessions(type)
      selectSession(result.sessionId)
      ElMessage.success('创建新对话成功')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    ElMessage.error('创建新对话失败')
  }
}

const selectSession = async (sessionId: string) => {
  currentSessionId.value = sessionId
  await loadMessages(sessionId)
}

const loadMessages = async (sessionId: string) => {
  try {
    messages.value = await window.electronAPI.ai.getSessionMessages(sessionId)
    filteredMessages.value = messages.value
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

const sendMessage = async (message: string) => {
  if (!message.trim()) return
  
  if (!currentSessionId.value) {
    await createNewSession(activeTab.value)
  }
  
  if (!currentSessionId.value) return
  
  isLoading.value = true
  
  try {
    const result = await window.electronAPI.ai.chat(
      currentSessionId.value,
      message,
      activeTab.value
    )
    
    if (result.success) {
      await loadMessages(currentSessionId.value)
      inputMessage.value = ''
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请检查AI配置')
  } finally {
    isLoading.value = false
  }
}

const sendCurrentMessage = () => {
  sendMessage(inputMessage.value)
}

// 日程提醒系统方法
// 待办事项管理
const openTodoDialog = (todo = null) => {
  if (todo) {
    editingTodo.value = todo
    Object.assign(todoForm, todo)
  } else {
    editingTodo.value = null
    Object.assign(todoForm, {
      title: '',
      priority: 'medium',
      dueDate: '',
      category: '教学',
      description: ''
    })
  }
  showTodoDialog.value = true
}

const saveTodo = () => {
  if (!todoForm.title.trim()) {
    ElMessage.warning('请输入待办事项标题')
    return
  }
  
  if (editingTodo.value) {
    // 编辑现有待办事项
    const index = todos.value.findIndex(t => t.id === editingTodo.value.id)
    if (index !== -1) {
      todos.value[index] = { ...editingTodo.value, ...todoForm }
    }
    ElMessage.success('待办事项更新成功')
  } else {
    // 添加新待办事项
    const newTodo = {
      id: Date.now(),
      ...todoForm,
      completed: false
    }
    todos.value.push(newTodo)
    ElMessage.success('待办事项添加成功')
  }
  
  showTodoDialog.value = false
}

const deleteTodo = (id) => {
  ElMessageBox.confirm('确定要删除这个待办事项吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    todos.value = todos.value.filter(t => t.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const toggleTodoComplete = (todo) => {
  todo.completed = !todo.completed
  ElMessage.success(todo.completed ? '任务已完成' : '任务已重新激活')
}

// 联系人管理
const openContactDialog = (contact = null) => {
  if (contact) {
    editingContact.value = contact
    Object.assign(contactForm, contact)
  } else {
    editingContact.value = null
    Object.assign(contactForm, {
      name: '',
      phone: '',
      email: '',
      role: '家长',
      studentName: '',
      department: '',
      class: ''
    })
  }
  showContactDialog.value = true
}

const saveContact = () => {
  if (!contactForm.name.trim()) {
    ElMessage.warning('请输入联系人姓名')
    return
  }
  
  if (editingContact.value) {
    // 编辑现有联系人
    const index = contacts.value.findIndex(c => c.id === editingContact.value.id)
    if (index !== -1) {
      contacts.value[index] = { ...editingContact.value, ...contactForm }
    }
    ElMessage.success('联系人更新成功')
  } else {
    // 添加新联系人
    const newContact = {
      id: Date.now(),
      ...contactForm
    }
    contacts.value.push(newContact)
    ElMessage.success('联系人添加成功')
  }
  
  showContactDialog.value = false
}

const deleteContact = (id) => {
  ElMessageBox.confirm('确定要删除这个联系人吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    contacts.value = contacts.value.filter(c => c.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 重要日期提醒管理
const openReminderDialog = (reminder = null) => {
  if (reminder) {
    editingReminder.value = reminder
    Object.assign(reminderForm, reminder)
  } else {
    editingReminder.value = null
    Object.assign(reminderForm, {
      title: '',
      date: '',
      type: '考试',
      description: ''
    })
  }
  showReminderDialog.value = true
}

const saveReminder = () => {
  if (!reminderForm.title.trim()) {
    ElMessage.warning('请输入提醒标题')
    return
  }
  
  if (!reminderForm.date) {
    ElMessage.warning('请选择提醒日期')
    return
  }
  
  if (editingReminder.value) {
    // 编辑现有提醒
    const index = reminders.value.findIndex(r => r.id === editingReminder.value.id)
    if (index !== -1) {
      reminders.value[index] = { ...editingReminder.value, ...reminderForm, status: 'active' }
    }
    ElMessage.success('提醒更新成功')
  } else {
    // 添加新提醒
    const newReminder = {
      id: Date.now(),
      ...reminderForm,
      status: 'active'
    }
    reminders.value.push(newReminder)
    ElMessage.success('提醒添加成功')
  }
  
  showReminderDialog.value = false
}

const deleteReminder = (id) => {
  ElMessageBox.confirm('确定要删除这个提醒吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    reminders.value = reminders.value.filter(r => r.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 日历相关方法
const changeCalendarView = (view) => {
  calendarView.value = view
}

const navigateCalendar = (direction) => {
  const current = new Date(currentDate.value)
  if (calendarView.value === 'month') {
    current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1))
  } else if (calendarView.value === 'week') {
    current.setDate(current.getDate() + (direction === 'next' ? 7 : -7))
  }
  currentDate.value = current
}

const selectCalendarDate = (date) => {
  selectedDate.value = date
}

// 获取指定日期的事件
const getEventsForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0]
  const events = []
  
  // 添加待办事项
  todos.value.forEach(todo => {
    if (todo.dueDate === dateStr) {
      events.push({
        type: 'todo',
        title: todo.title,
        priority: todo.priority,
        completed: todo.completed
      })
    }
  })
  
  // 添加提醒
  reminders.value.forEach(reminder => {
    if (reminder.date === dateStr) {
      events.push({
        type: 'reminder',
        title: reminder.title,
        reminderType: reminder.type
      })
    }
  })
  
  return events
}

const deleteSession = async (sessionId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '确认删除', {
      type: 'warning'
    })
    
    await window.electronAPI.ai.deleteSession(sessionId)
    await loadSessions()
    
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = null
      messages.value = []
    }
    
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 备课助手方法
const openLessonPlanGenerator = () => {
  prepWorkspace.visible = true
  prepWorkspace.title = '教案生成器'
  prepWorkspace.type = 'lesson_plan'
}

const openContentAnalyzer = () => {
  prepWorkspace.visible = true
  prepWorkspace.title = '内容分析器'
  prepWorkspace.type = 'content_analysis'
}

const openQuestionGenerator = () => {
  prepWorkspace.visible = true
  prepWorkspace.title = '题目生成器'
  prepWorkspace.type = 'question_generation'
}

const openTemplateManager = () => {
  prepWorkspace.visible = true
  prepWorkspace.title = '模板管理器'
  prepWorkspace.type = 'template_manager'
  // 加载已保存的模板
  const templates = loadSavedTemplates()
  generatedContent.value = templates.length > 0 ? 
    `<h3>已保存的模板 (${templates.length}个)</h3>` +
    templates.map((template, index) => 
      `<div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
        <h4>${template.topic} - ${template.subject} ${template.grade}年级</h4>
        <p><strong>类型:</strong> ${template.type === 'lesson_plan' ? '教案' : template.type === 'content_analysis' ? '内容分析' : '题目生成'}</p>
        <p><strong>创建时间:</strong> ${new Date(template.createdAt).toLocaleString()}</p>
        <details><summary>查看内容</summary><div style="margin-top: 10px;">${template.content}</div></details>
      </div>`
    ).join('') : '<p>暂无保存的模板</p>'
}

const openCurriculumPlanner = () => {
  prepWorkspace.visible = true
  prepWorkspace.title = '课程规划器'
  prepWorkspace.type = 'curriculum_planning'
}

const openResourceLibrary = () => {
  prepWorkspace.visible = true
  prepWorkspace.title = '教学资源库'
  prepWorkspace.type = 'resource_library'
  generatedContent.value = `
    <h3>常用教学资源网站</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
      <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <h4>📚 学科网</h4>
        <p>中小学教育资源网站，提供各学科教案、课件、试题等</p>
        <a href="https://www.zxxk.com" target="_blank" style="color: #409eff;">访问网站</a>
      </div>
      <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <h4>🎓 中国大学MOOC</h4>
        <p>优质在线课程平台，提供各类教学视频和资源</p>
        <a href="https://www.icourse163.org" target="_blank" style="color: #409eff;">访问网站</a>
      </div>
      <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <h4>📖 国家智慧教育平台</h4>
        <p>官方教育资源平台，提供标准化教学内容</p>
        <a href="https://www.smartedu.cn" target="_blank" style="color: #409eff;">访问网站</a>
      </div>
      <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
        <h4>🔬 实验教学平台</h4>
        <p>虚拟实验和实验教学资源</p>
        <a href="https://www.nobook.com.cn" target="_blank" style="color: #409eff;">访问网站</a>
      </div>
    </div>
  `
}

const generateContent = async () => {
  if (!prepForm.subject || !prepForm.grade || !prepForm.topic) {
    ElMessage.warning('请填写完整的课程信息')
    return
  }
  
  isGenerating.value = true
  
  try {
    let prompt = ''
    if (prepWorkspace.type === 'lesson_plan') {
      prompt = `请为${prepForm.grade}年级${prepForm.subject}课程"${prepForm.topic}"生成一份详细的教案。教学目标：${prepForm.objectives}`
    } else if (prepWorkspace.type === 'content_analysis') {
      prompt = `请分析${prepForm.grade}年级${prepForm.subject}课程"${prepForm.topic}"的教学重点和难点。教学目标：${prepForm.objectives}`
    } else if (prepWorkspace.type === 'question_generation') {
      prompt = `请为${prepForm.grade}年级${prepForm.subject}课程"${prepForm.topic}"生成10道练习题。教学目标：${prepForm.objectives}`
    }
    
    // 创建临时会话进行内容生成
    const sessionResult = await window.electronAPI.ai.createSession('内容生成', 'lesson_prep')
    const chatResult = await window.electronAPI.ai.chat(sessionResult.sessionId, prompt, 'lesson_prep')
    
    if (chatResult.success) {
      generatedContent.value = chatResult.response
    }
  } catch (error) {
    console.error('生成内容失败:', error)
    ElMessage.error('生成内容失败')
  } finally {
    isGenerating.value = false
  }
}

const copyContent = () => {
  navigator.clipboard.writeText(generatedContent.value.replace(/<[^>]*>/g, ''))
  ElMessage.success('内容已复制到剪贴板')
}

const saveContent = async () => {
  try {
    const template = {
      type: prepWorkspace.type,
      subject: prepForm.subject,
      grade: prepForm.grade,
      topic: prepForm.topic,
      objectives: prepForm.objectives,
      content: generatedContent.value,
      createdAt: new Date().toISOString()
    }
    
    // 保存到本地存储
    const savedTemplates = JSON.parse(localStorage.getItem('lessonTemplates') || '[]')
    savedTemplates.push(template)
    localStorage.setItem('lessonTemplates', JSON.stringify(savedTemplates))
    
    ElMessage.success('内容已保存到模板库')
  } catch (error) {
    console.error('保存模板失败:', error)
    ElMessage.error('保存模板失败')
  }
}

// 加载保存的模板
const loadSavedTemplates = () => {
  try {
    return JSON.parse(localStorage.getItem('lessonTemplates') || '[]')
  } catch (error) {
    console.error('加载模板失败:', error)
    return []
  }
}

// 导出内容为Word文档
const exportContent = () => {
  const content = generatedContent.value.replace(/<[^>]*>/g, '')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${prepForm.topic}_${prepWorkspace.type}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('内容已导出')
}

// 重置表单
const resetPrepForm = () => {
  prepForm.subject = ''
  prepForm.grade = null
  prepForm.topic = ''
  prepForm.objectives = ''
  generatedContent.value = ''
  prepWorkspace.visible = false
}

// 作文批改方法
const gradeEssay = async () => {
  if (!essayForm.content.trim()) {
    ElMessage.warning('请输入作文内容')
    return
  }
  
  isGrading.value = true
  
  try {
    const prompt = `请作为一名专业的语文老师，对以下作文进行详细批改：

【作文信息】
标题：${essayForm.title}
学生：${essayForm.studentName}
字数：${essayForm.content.length}字

【作文内容】
${essayForm.content}

【批改要求】
请从以下维度进行评价，每个维度给出1-5分的评分：
1. 内容与主题（30%）- 主题明确性、内容充实度、观点新颖性
2. 语言表达（25%）- 词汇运用、句式变化、语言流畅性
3. 结构组织（25%）- 逻辑清晰、层次分明、过渡自然
4. 创新亮点（20%）- 创意表达、独特见解、文采飞扬

【输出格式】
请按以下JSON格式输出批改结果：
{
  "totalScore": 总分(1-5分),
  "aspectScores": {
    "content": 内容得分,
    "language": 语言得分,
    "structure": 结构得分,
    "innovation": 创新得分
  },
  "feedback": [
    {"aspect": "内容与主题", "comment": "具体评价"},
    {"aspect": "语言表达", "comment": "具体评价"},
    {"aspect": "结构组织", "comment": "具体评价"},
    {"aspect": "创新亮点", "comment": "具体评价"}
  ],
  "suggestions": ["改进建议1", "改进建议2", "改进建议3"],
  "highlights": ["优秀之处1", "优秀之处2"]
}`
    
    // 创建临时会话进行作文批改
    const sessionResult = await window.electronAPI.ai.createSession('作文批改', 'essay_grading')
    const chatResult = await window.electronAPI.ai.chat(sessionResult.sessionId, prompt, 'essay_grading')
    
    if (chatResult.success) {
      try {
        // 尝试解析JSON格式的批改结果
        const jsonMatch = chatResult.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedResult = JSON.parse(jsonMatch[0])
          gradingResult.value = {
            score: parsedResult.totalScore || 3,
            aspectScores: parsedResult.aspectScores || {},
            feedback: parsedResult.feedback || [],
            suggestions: parsedResult.suggestions || [],
            highlights: parsedResult.highlights || [],
            rawResponse: chatResult.response
          }
        } else {
          // 如果无法解析JSON，使用原始响应
          gradingResult.value = {
            score: 3,
            feedback: [{aspect: '批改结果', comment: chatResult.response}],
            suggestions: ['请参考详细批改意见'],
            highlights: [],
            rawResponse: chatResult.response
          }
        }
      } catch (parseError) {
        console.error('解析批改结果失败:', parseError)
        gradingResult.value = {
          score: 3,
          feedback: [{aspect: '批改结果', comment: chatResult.response}],
          suggestions: ['请参考详细批改意见'],
          highlights: [],
          rawResponse: chatResult.response
        }
      }
    }
  } catch (error) {
    console.error('批改作文失败:', error)
    ElMessage.error('批改作文失败')
  } finally {
    isGrading.value = false
  }
}

const exportGradingResult = () => {
  if (!gradingResult.value) return
  
  const content = `作文批改报告

学生姓名：${essayForm.studentName}
作文题目：${essayForm.title}
批改时间：${new Date().toLocaleString()}
总体评分：${gradingResult.value.score}/5分

详细评价：
${gradingResult.value.feedback.map(item => `${item.aspect}：${item.comment}`).join('\n')}

改进建议：
${gradingResult.value.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${gradingResult.value.highlights?.length ? `优秀之处：\n${gradingResult.value.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : ''}

原始作文内容：
${essayForm.content}`
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${essayForm.studentName}_${essayForm.title}_批改报告.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('批改报告已导出')
}

const saveGradingResult = () => {
  if (!gradingResult.value) return
  
  try {
    const gradingRecord = {
      studentName: essayForm.studentName,
      title: essayForm.title,
      content: essayForm.content,
      result: gradingResult.value,
      createdAt: new Date().toISOString()
    }
    
    const savedRecords = JSON.parse(localStorage.getItem('gradingRecords') || '[]')
    savedRecords.push(gradingRecord)
    localStorage.setItem('gradingRecords', JSON.stringify(savedRecords))
    
    ElMessage.success('批改结果已保存到记录')
  } catch (error) {
    console.error('保存批改结果失败:', error)
    ElMessage.error('保存批改结果失败')
  }
}

// 设置方法
const saveConfig = async () => {
  isSavingConfig.value = true
  
  try {
    await window.electronAPI.ai.updateConfig(aiConfig)
    ElMessage.success('配置保存成功')
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    isSavingConfig.value = false
  }
}

// 教育资源导航方法
const openLink = (url: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    window.electronAPI.shell.openExternal(url)
  } else {
    ElMessage.warning('无效的网址格式')
  }
}

const addCustomResource = () => {
  if (!newResource.name || !newResource.url) {
    ElMessage.warning('请填写完整的资源信息')
    return
  }
  
  if (!newResource.url.startsWith('http://') && !newResource.url.startsWith('https://')) {
    ElMessage.warning('网址必须以http://或https://开头')
    return
  }
  
  customResources.value.push({
    name: newResource.name,
    url: newResource.url,
    description: newResource.description || '自定义资源'
  })
  
  // 保存到本地存储
  localStorage.setItem('customResources', JSON.stringify(customResources.value))
  
  // 重置表单
  newResource.name = ''
  newResource.url = ''
  newResource.description = ''
  
  showAddResourceDialog.value = false
  ElMessage.success('自定义资源添加成功')
}

const removeCustomResource = (index: number) => {
  ElMessageBox.confirm('确定要删除这个自定义资源吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    customResources.value.splice(index, 1)
    localStorage.setItem('customResources', JSON.stringify(customResources.value))
    ElMessage.success('自定义资源已删除')
  }).catch(() => {})
}

const loadCustomResources = () => {
  try {
    const saved = localStorage.getItem('customResources')
    if (saved) {
      customResources.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载自定义资源失败:', error)
  }
}

// 多媒体工具方法
// 截图功能
const takeScreenshot = async () => {
  try {
    isScreenshotting.value = true
    
    // 使用浏览器 API 进行屏幕截图
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: 'screen' }
    })
    
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()
    
    video.addEventListener('loadedmetadata', () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      
      const dataURL = canvas.toDataURL('image/png')
      currentScreenshot.value = dataURL
      
      screenshotHistory.value.unshift({
        id: Date.now(),
        data: dataURL,
        timestamp: new Date().toLocaleString()
      })
      
      stream.getTracks().forEach(track => track.stop())
      ElMessage.success('截图成功')
    })
  } catch (error) {
    console.error('截图失败:', error)
    ElMessage.error('截图失败，请检查权限设置')
  } finally {
    isScreenshotting.value = false
  }
}

const annotateScreenshot = () => {
  ElMessage.info('标注功能开发中...')
}

const saveScreenshot = () => {
  if (!currentScreenshot.value) return
  
  const link = document.createElement('a')
  link.download = `screenshot_${new Date().getTime()}.png`
  link.href = currentScreenshot.value
  link.click()
  ElMessage.success('截图已保存')
}

const copyScreenshot = async () => {
  if (!currentScreenshot.value) return
  
  try {
    const response = await fetch(currentScreenshot.value)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    ElMessage.success('截图已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const openScreenshotHistory = () => {
  ElMessage.info('截图历史功能开发中...')
}

// 录屏功能
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: recordingQuality.value === '1080p' ? 1920 : recordingQuality.value === '720p' ? 1280 : 854,
        height: recordingQuality.value === '1080p' ? 1080 : recordingQuality.value === '720p' ? 720 : 480
      },
      audio: recordAudio.value
    })
    
    recordingStream.value = stream
    mediaRecorder.value = new MediaRecorder(stream)
    const chunks: BlobPart[] = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `recording_${new Date().getTime()}.webm`
      link.click()
      URL.revokeObjectURL(url)
      ElMessage.success('录制完成并已保存')
    }
    
    mediaRecorder.value.start()
    isRecording.value = true
    
    // 开始计时
    let seconds = 0
    recordingTimer.value = setInterval(() => {
      seconds++
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      recordingTime.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }, 1000)
    
    ElMessage.success('开始录制')
  } catch (error) {
    console.error('录制失败:', error)
    ElMessage.error('录制失败，请检查权限设置')
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    recordingStream.value?.getTracks().forEach(track => track.stop())
    
    isRecording.value = false
    recordingTime.value = '00:00'
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }
}

const openRecordingHistory = () => {
  ElMessage.info('录制历史功能开发中...')
}

// 二维码生成
const canGenerateQRCode = computed(() => {
  if (qrcodeType.value === 'text' || qrcodeType.value === 'url') {
    return qrcodeContent.value.trim() !== ''
  } else if (qrcodeType.value === 'wifi') {
    return wifiConfig.ssid.trim() !== ''
  } else if (qrcodeType.value === 'contact') {
    return contactInfo.name.trim() !== '' || contactInfo.phone.trim() !== ''
  }
  return false
})

const onQrcodeTypeChange = () => {
  qrcodeContent.value = ''
  wifiConfig.ssid = ''
  wifiConfig.password = ''
  wifiConfig.security = 'WPA'
  contactInfo.name = ''
  contactInfo.phone = ''
  contactInfo.email = ''
  generatedQRCode.value = null
}

const generateQRCode = async () => {
  try {
    let content = ''
    
    if (qrcodeType.value === 'text' || qrcodeType.value === 'url') {
      content = qrcodeContent.value
    } else if (qrcodeType.value === 'wifi') {
      content = `WIFI:T:${wifiConfig.security};S:${wifiConfig.ssid};P:${wifiConfig.password};;`
    } else if (qrcodeType.value === 'contact') {
      content = `BEGIN:VCARD\nVERSION:3.0\nFN:${contactInfo.name}\nTEL:${contactInfo.phone}\nEMAIL:${contactInfo.email}\nEND:VCARD`
    }
    
    // 使用在线API生成二维码
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}`
    
    const canvas = qrcodeCanvas.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 200, 200)
        generatedQRCode.value = canvas.toDataURL()
        ElMessage.success('二维码生成成功')
      }
      img.src = qrUrl
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
}

const clearQRCode = () => {
  qrcodeContent.value = ''
  wifiConfig.ssid = ''
  wifiConfig.password = ''
  wifiConfig.security = 'WPA'
  contactInfo.name = ''
  contactInfo.phone = ''
  contactInfo.email = ''
  generatedQRCode.value = null
  
  const canvas = qrcodeCanvas.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, 200, 200)
  }
}

const downloadQRCode = () => {
  if (!generatedQRCode.value) return
  
  const link = document.createElement('a')
  link.download = `qrcode_${qrcodeType.value}_${new Date().getTime()}.png`
  link.href = generatedQRCode.value
  link.click()
  ElMessage.success('二维码已下载')
}

const copyQRCodeImage = async () => {
  if (!generatedQRCode.value) return
  
  try {
    const response = await fetch(generatedQRCode.value)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
    ElMessage.success('二维码已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 图片处理
const selectImage = () => {
  imageInput.value?.click()
}

const handleImageSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      selectedImage.value = {
        file,
        name: file.name,
        size: file.size,
        width: img.width,
        height: img.height,
        preview: e.target?.result as string
      }
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const processImage = () => {
  if (!selectedImage.value) return
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx?.drawImage(img, 0, 0)
    
    const processedDataURL = canvas.toDataURL(`image/${outputFormat.value}`, imageQuality.value / 100)
    
    const link = document.createElement('a')
    link.download = `processed_${selectedImage.value.name.split('.')[0]}.${outputFormat.value}`
    link.href = processedDataURL
    link.click()
    
    ElMessage.success('图片处理完成并已下载')
  }
  
  img.src = selectedImage.value.preview
}

const clearImage = () => {
  selectedImage.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// 文档转换
const handleDocumentSelect = (file: any) => {
  selectedDocument.value = file
}

const convertDocument = () => {
  if (!selectedDocument.value) return
  
  ElMessage.info('文档转换功能开发中...')
}

const testConnection = async () => {
  isTesting.value = true
  
  try {
    // 创建测试会话
    const sessionResult = await window.electronAPI.ai.createSession('连接测试', 'general')
    const chatResult = await window.electronAPI.ai.chat(sessionResult.sessionId, '你好，请回复"连接成功"', 'general')
    
    if (chatResult.success) {
      ElMessage.success('AI服务连接成功')
    } else {
      ElMessage.error('AI服务连接失败')
    }
  } catch (error) {
    console.error('测试连接失败:', error)
    ElMessage.error('AI服务连接失败，请检查配置')
  } finally {
    isTesting.value = false
  }
}

// 搜索消息
const searchMessages = () => {
  if (!searchKeyword.value.trim()) {
    filteredMessages.value = messages.value
    return
  }
  
  filteredMessages.value = messages.value.filter(message => 
    message.content.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
}

// 插入智能提示
const insertSmartPrompt = (prompt: string) => {
  inputMessage.value = prompt
  showSmartPrompts.value = false
}

// 获取当前标签页的智能提示
const getCurrentSmartPrompts = () => {
  return smartPrompts[activeTab.value as keyof typeof smartPrompts] || []
}

// 复制消息内容
const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ''))
  ElMessage.success('消息已复制到剪贴板')
}

// 重新生成回复
const regenerateResponse = async (messageIndex: number) => {
  if (!currentSessionId.value) return
  
  const userMessage = messages.value[messageIndex - 1]
  if (!userMessage || userMessage.role !== 'user') return
  
  isLoading.value = true
  
  try {
    const result = await window.electronAPI.ai.chat(
      currentSessionId.value,
      userMessage.content,
      activeTab.value
    )
    
    if (result.success) {
      await loadMessages(currentSessionId.value)
    }
  } catch (error) {
    console.error('重新生成回复失败:', error)
    ElMessage.error('重新生成回复失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.ai-assistant {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.ai-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.ai-header h2 {
  margin: 0 0 16px 0;
  color: #303133;
}

.chat-container {
  flex: 1;
  display: flex;
  height: calc(100vh - 120px);
}

.chat-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.session-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item.active {
  background: #e6f7ff;
  border-left: 3px solid #409eff;
}

.session-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.session-time {
  font-size: 12px;
  color: #909399;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.empty-chat {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.quick-questions {
  margin-top: 20px;
}

.quick-question {
  margin: 4px;
  cursor: pointer;
}

.message {
  display: flex;
  margin-bottom: 20px;
}

.message.user {
  justify-content: flex-end;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 12px;
}

.message.user .message-avatar {
  background: #67c23a;
}

.message-content {
  max-width: 70%;
  background: #f0f0f0;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
}

.message.user .message-content {
  background: #409eff;
  color: white;
}

.message-text {
  line-height: 1.6;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.message-actions .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.message.user .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.quick-question-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.quick-question-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.smart-prompts {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.prompt-category h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prompt-tag {
  cursor: pointer;
  transition: all 0.3s;
  background: white;
  border: 1px solid #d9d9d9;
}

.prompt-tag:hover {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-tip {
  font-size: 12px;
  color: #909399;
}

.lesson-prep {
  padding: 20px;
}

.prep-tools {
  margin-bottom: 20px;
}

.tool-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.tool-icon {
  color: #409eff;
  margin-bottom: 12px;
}

.tool-card h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.tool-card p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.prep-workspace {
  margin-top: 20px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.content-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.generated-content {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.content-display {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin: 12px 0;
  border: 1px solid #e9ecef;
}

/* 作文批改样式 */
.essay-grading {
  padding: 20px;
}

.grading-result {
  padding: 16px;
}

.score-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.total-score {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.score-text {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.aspect-scores {
  margin-top: 16px;
}

.aspect-scores h5 {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.score-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.score-item span {
  font-size: 14px;
  color: #333;
}

.feedback-section {
  margin-bottom: 24px;
}

.feedback-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.feedback-header {
  margin-bottom: 8px;
}

.feedback-header strong {
  color: #409eff;
  font-size: 14px;
}

.feedback-content {
  color: #666;
  line-height: 1.6;
}

.highlights-section {
  margin-bottom: 24px;
}

.highlights-section h4 {
  color: #67c23a;
  margin-bottom: 12px;
}

.highlights-list {
  margin: 0;
  padding-left: 20px;
}

.highlight-item {
  margin-bottom: 8px;
  color: #67c23a;
  line-height: 1.6;
}

.suggestions-section h4 {
  color: #e6a23c;
  margin-bottom: 12px;
}

.suggestions-list {
  margin: 0;
  padding-left: 20px;
}

.suggestion-item {
  margin-bottom: 8px;
  color: #666;
  line-height: 1.6;
}

.empty-result {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-result .el-icon {
  margin-bottom: 16px;
  color: #ddd;
}

.actions {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    justify-content: center;
  }

/* 教育资源导航样式 */
.education-resources {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.resources-header {
  text-align: center;
  margin-bottom: 30px;
}

.resources-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.resources-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.resources-categories {
  margin-bottom: 30px;
}

.resource-category {
  height: 100%;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.resource-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.resource-item:hover {
  background: #e6f7ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  font-size: 14px;
}

.resource-desc {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.custom-resources {
  margin-top: 20px;
}

.custom-resource-list {
  min-height: 200px;
}

.empty-custom {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-custom .el-icon {
  margin-bottom: 16px;
  color: #ddd;
}

.empty-custom p {
  margin: 0;
  font-size: 14px;
}

.content-display {
  margin: 16px 0;
  line-height: 1.8;
}

.content-actions {
  text-align: right;
}

.essay-grading {
  padding: 20px;
}

.grading-result {
  padding: 20px;
}

.score-section {
  margin-bottom: 20px;
}

.feedback-section {
  margin-bottom: 20px;
}

.feedback-item {
  margin-bottom: 8px;
  line-height: 1.6;
}

.suggestions-section ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions-section li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.empty-result {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

/* 多媒体工具样式 */
.multimedia-tools {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.multimedia-tools h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.tool-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.tool-header h4 {
  color: #34495e;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.tool-content {
  margin-bottom: 15px;
}

.tool-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.screenshot-preview {
  width: 100%;
  max-width: 300px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 15px;
  background: #fafafa;
}

.screenshot-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.screenshot-placeholder {
  color: #999;
  font-size: 14px;
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 6px;
  margin-bottom: 15px;
}

.recording-indicator {
  width: 12px;
  height: 12px;
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.recording-time {
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  color: #e74c3c;
}

.qrcode-canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 10px 0;
}

.qrcode-result {
  text-align: center;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.qrcode-result img {
  max-width: 200px;
  border-radius: 4px;
}

.image-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  margin-bottom: 15px;
}

.image-upload-area:hover {
  border-color: #409eff;
}

.image-upload-area.has-image {
  border-style: solid;
  border-color: #67c23a;
}

.image-preview {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.image-info {
  background: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 12px;
  color: #666;
}

.image-info div {
  margin-bottom: 5px;
}

.image-info div:last-child {
  margin-bottom: 0;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .el-form-item {
  flex: 1;
  margin-bottom: 0;
}

.tool-divider {
  height: 1px;
  background: #eee;
  margin: 15px 0;
}

.status-text {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.wifi-form {
  display: grid;
  gap: 15px;
}

.contact-form {
  display: grid;
  gap: 15px;
}

.document-upload {
  margin-bottom: 15px;
}

.conversion-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.conversion-options h5 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.ai-settings {
  padding: 20px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>