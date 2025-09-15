// PPT主题模板系统
// 定义企业级PPT的配色方案、字体、布局等样式规范

export interface PPTTheme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: {
      primary: string
      secondary: string
      light: string
    }
    gradient?: {
      start: string
      end: string
      direction?: string
    }
  }
  typography: {
    titleFont: string
    bodyFont: string
    titleSize: {
      h1: string
      h2: string
      h3: string
    }
    bodySize: {
      large: string
      normal: string
      small: string
    }
    lineHeight: {
      title: string
      body: string
    }
  }
  layout: {
    padding: string
    margin: string
    borderRadius: string
    shadow: string
    spacing: {
      small: string
      medium: string
      large: string
    }
  }
  elements: {
    bullet: {
      style: string
      color: string
      size: string
    }
    divider: {
      style: string
      color: string
      width: string
    }
    highlight: {
      background: string
      color: string
      borderRadius: string
    }
  }
}

// 商务专业主题
export const businessTheme: PPTTheme = {
  id: 'business',
  name: '商务专业',
  description: '适合商务演示、企业汇报的专业风格',
  colors: {
    primary: '#2C5282',
    secondary: '#3182CE',
    accent: '#E53E3E',
    background: '#FFFFFF',
    surface: '#F7FAFC',
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      light: '#718096'
    },
    gradient: {
      start: '#2C5282',
      end: '#3182CE',
      direction: '135deg'
    }
  },
  typography: {
    titleFont: '"Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    bodyFont: '"Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    titleSize: {
      h1: '32px',
      h2: '28px',
      h3: '24px'
    },
    bodySize: {
      large: '18px',
      normal: '16px',
      small: '14px'
    },
    lineHeight: {
      title: '1.2',
      body: '1.6'
    }
  },
  layout: {
    padding: '40px',
    margin: '20px',
    borderRadius: '8px',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    spacing: {
      small: '12px',
      medium: '24px',
      large: '40px'
    }
  },
  elements: {
    bullet: {
      style: 'solid-circle',
      color: '#3182CE',
      size: '8px'
    },
    divider: {
      style: 'solid',
      color: '#3182CE',
      width: '3px'
    },
    highlight: {
      background: 'linear-gradient(135deg, #EBF8FF, #BEE3F8)',
      color: '#2C5282',
      borderRadius: '6px'
    }
  }
}

// 科技现代主题
export const techTheme: PPTTheme = {
  id: 'tech',
  name: '科技现代',
  description: '适合科技产品、创新项目的现代化风格',
  colors: {
    primary: '#1A365D',
    secondary: '#2D3748',
    accent: '#00D9FF',
    background: '#0F1419',
    surface: '#1A202C',
    text: {
      primary: '#FFFFFF',
      secondary: '#E2E8F0',
      light: '#A0AEC0'
    },
    gradient: {
      start: '#1A365D',
      end: '#00D9FF',
      direction: '135deg'
    }
  },
  typography: {
    titleFont: '"SF Pro Display", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
    bodyFont: '"SF Pro Text", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
    titleSize: {
      h1: '36px',
      h2: '30px',
      h3: '26px'
    },
    bodySize: {
      large: '18px',
      normal: '16px',
      small: '14px'
    },
    lineHeight: {
      title: '1.1',
      body: '1.5'
    }
  },
  layout: {
    padding: '48px',
    margin: '24px',
    borderRadius: '12px',
    shadow: '0 8px 32px rgba(0, 217, 255, 0.2)',
    spacing: {
      small: '16px',
      medium: '32px',
      large: '48px'
    }
  },
  elements: {
    bullet: {
      style: 'neon-dot',
      color: '#00D9FF',
      size: '6px'
    },
    divider: {
      style: 'gradient',
      color: 'linear-gradient(90deg, #00D9FF, transparent)',
      width: '2px'
    },
    highlight: {
      background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(26, 54, 93, 0.2))',
      color: '#00D9FF',
      borderRadius: '8px'
    }
  }
}

// 教育学术主题
export const academicTheme: PPTTheme = {
  id: 'academic',
  name: '教育学术',
  description: '适合教学课件、学术报告的专业风格',
  colors: {
    primary: '#2F855A',
    secondary: '#38A169',
    accent: '#D69E2E',
    background: '#FFFFFF',
    surface: '#F0FFF4',
    text: {
      primary: '#1A202C',
      secondary: '#2D3748',
      light: '#4A5568'
    },
    gradient: {
      start: '#2F855A',
      end: '#68D391',
      direction: '135deg'
    }
  },
  typography: {
    titleFont: '"Times New Roman", "SimSun", serif',
    bodyFont: '"Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    titleSize: {
      h1: '30px',
      h2: '26px',
      h3: '22px'
    },
    bodySize: {
      large: '18px',
      normal: '16px',
      small: '14px'
    },
    lineHeight: {
      title: '1.3',
      body: '1.7'
    }
  },
  layout: {
    padding: '36px',
    margin: '18px',
    borderRadius: '6px',
    shadow: '0 2px 16px rgba(47, 133, 90, 0.1)',
    spacing: {
      small: '14px',
      medium: '28px',
      large: '42px'
    }
  },
  elements: {
    bullet: {
      style: 'academic-square',
      color: '#38A169',
      size: '7px'
    },
    divider: {
      style: 'double',
      color: '#38A169',
      width: '2px'
    },
    highlight: {
      background: 'linear-gradient(135deg, #F0FFF4, #C6F6D5)',
      color: '#2F855A',
      borderRadius: '4px'
    }
  }
}

// 创意活泼主题
export const creativeTheme: PPTTheme = {
  id: 'creative',
  name: '创意活泼',
  description: '适合创意展示、活动策划的活泼风格',
  colors: {
    primary: '#E53E3E',
    secondary: '#FF6B6B',
    accent: '#4ECDC4',
    background: '#FFFBF0',
    surface: '#FFF5F5',
    text: {
      primary: '#2D3748',
      secondary: '#4A5568',
      light: '#718096'
    },
    gradient: {
      start: '#FF6B6B',
      end: '#4ECDC4',
      direction: '135deg'
    }
  },
  typography: {
    titleFont: '"Comic Sans MS", "Microsoft YaHei", cursive, sans-serif',
    bodyFont: '"Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    titleSize: {
      h1: '34px',
      h2: '28px',
      h3: '24px'
    },
    bodySize: {
      large: '18px',
      normal: '16px',
      small: '14px'
    },
    lineHeight: {
      title: '1.2',
      body: '1.6'
    }
  },
  layout: {
    padding: '32px',
    margin: '16px',
    borderRadius: '16px',
    shadow: '0 6px 24px rgba(229, 62, 62, 0.15)',
    spacing: {
      small: '12px',
      medium: '24px',
      large: '36px'
    }
  },
  elements: {
    bullet: {
      style: 'creative-star',
      color: '#4ECDC4',
      size: '10px'
    },
    divider: {
      style: 'wavy',
      color: '#FF6B6B',
      width: '3px'
    },
    highlight: {
      background: 'linear-gradient(135deg, #FFF5F5, #FED7D7)',
      color: '#E53E3E',
      borderRadius: '12px'
    }
  }
}

// 简约清新主题
export const minimalistTheme: PPTTheme = {
  id: 'minimalist',
  name: '简约清新',
  description: '适合简洁展示、产品介绍的清新风格',
  colors: {
    primary: '#4A5568',
    secondary: '#718096',
    accent: '#38B2AC',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      light: '#A0AEC0'
    },
    gradient: {
      start: '#F7FAFC',
      end: '#EDF2F7',
      direction: '135deg'
    }
  },
  typography: {
    titleFont: '"SF Pro Display", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
    bodyFont: '"SF Pro Text", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif',
    titleSize: {
      h1: '28px',
      h2: '24px',
      h3: '20px'
    },
    bodySize: {
      large: '16px',
      normal: '14px',
      small: '12px'
    },
    lineHeight: {
      title: '1.3',
      body: '1.6'
    }
  },
  layout: {
    padding: '32px',
    margin: '16px',
    borderRadius: '4px',
    shadow: '0 1px 8px rgba(0, 0, 0, 0.05)',
    spacing: {
      small: '8px',
      medium: '16px',
      large: '32px'
    }
  },
  elements: {
    bullet: {
      style: 'minimal-line',
      color: '#38B2AC',
      size: '2px'
    },
    divider: {
      style: 'thin',
      color: '#E2E8F0',
      width: '1px'
    },
    highlight: {
      background: 'rgba(56, 178, 172, 0.1)',
      color: '#38B2AC',
      borderRadius: '2px'
    }
  }
}

// 主题集合
export const pptThemes: Record<string, PPTTheme> = {
  business: businessTheme,
  tech: techTheme,
  academic: academicTheme,
  creative: creativeTheme,
  minimalist: minimalistTheme
}

// 获取主题
export const getTheme = (themeId: string): PPTTheme => {
  return pptThemes[themeId] || businessTheme
}

// 获取所有主题列表
export const getAllThemes = (): PPTTheme[] => {
  return Object.values(pptThemes)
}

// 生成主题CSS变量
export const generateThemeCSS = (theme: PPTTheme): string => {
  return `
    --ppt-primary: ${theme.colors.primary};
    --ppt-secondary: ${theme.colors.secondary};
    --ppt-accent: ${theme.colors.accent};
    --ppt-background: ${theme.colors.background};
    --ppt-surface: ${theme.colors.surface};
    --ppt-text-primary: ${theme.colors.text.primary};
    --ppt-text-secondary: ${theme.colors.text.secondary};
    --ppt-text-light: ${theme.colors.text.light};
    --ppt-gradient: linear-gradient(${theme.colors.gradient?.direction || '135deg'}, ${theme.colors.gradient?.start}, ${theme.colors.gradient?.end});
    --ppt-title-font: ${theme.typography.titleFont};
    --ppt-body-font: ${theme.typography.bodyFont};
    --ppt-title-h1: ${theme.typography.titleSize.h1};
    --ppt-title-h2: ${theme.typography.titleSize.h2};
    --ppt-title-h3: ${theme.typography.titleSize.h3};
    --ppt-body-large: ${theme.typography.bodySize.large};
    --ppt-body-normal: ${theme.typography.bodySize.normal};
    --ppt-body-small: ${theme.typography.bodySize.small};
    --ppt-line-height-title: ${theme.typography.lineHeight.title};
    --ppt-line-height-body: ${theme.typography.lineHeight.body};
    --ppt-padding: ${theme.layout.padding};
    --ppt-margin: ${theme.layout.margin};
    --ppt-border-radius: ${theme.layout.borderRadius};
    --ppt-shadow: ${theme.layout.shadow};
    --ppt-spacing-small: ${theme.layout.spacing.small};
    --ppt-spacing-medium: ${theme.layout.spacing.medium};
    --ppt-spacing-large: ${theme.layout.spacing.large};
    --ppt-bullet-color: ${theme.elements.bullet.color};
    --ppt-bullet-size: ${theme.elements.bullet.size};
    --ppt-divider-color: ${theme.elements.divider.color};
    --ppt-divider-width: ${theme.elements.divider.width};
    --ppt-highlight-bg: ${theme.elements.highlight.background};
    --ppt-highlight-color: ${theme.elements.highlight.color};
    --ppt-highlight-radius: ${theme.elements.highlight.borderRadius};
  `
}