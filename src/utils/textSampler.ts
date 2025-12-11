import * as THREE from 'three'

// 缓存文本位置，避免重复计算
const textPositionCache = new Map<string, THREE.Vector3[]>()

/**
 * 清除所有文字位置缓存（用于强制重新生成）
 */
export function clearTextPositionCache(): void {
  textPositionCache.clear()
  console.log('Text position cache cleared')
}

// 在字体加载完成后，清除使用默认字体的缓存并强制重新生成
if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    console.log('Fonts loaded, clearing default font cache...')
    // 清除所有包含 'default' 的缓存键
    const keysToDelete: string[] = []
    textPositionCache.forEach((_, key) => {
      if (key.includes('-default')) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => textPositionCache.delete(key))
    if (keysToDelete.length > 0) {
      console.log(`Cleared ${keysToDelete.length} default font cache entries after fonts loaded`)
      // 触发页面重新渲染（通过自定义事件）
      window.dispatchEvent(new CustomEvent('fonts-loaded'))
    }
  }).catch((e) => {
    console.warn('Font loading check failed:', e)
  })
  
  // 也监听字体加载事件
  document.fonts.addEventListener('loadingdone', () => {
    console.log('Fonts loading done event fired')
    const keysToDelete: string[] = []
    textPositionCache.forEach((_, key) => {
      if (key.includes('-default')) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => textPositionCache.delete(key))
    if (keysToDelete.length > 0) {
      console.log(`Cleared ${keysToDelete.length} default font cache entries`)
      window.dispatchEvent(new CustomEvent('fonts-loaded'))
    }
  })
}

/**
 * 检查字体是否已加载
 */
function areFontsLoaded(): boolean {
  if (!document.fonts || !document.fonts.check) {
    // 如果不支持 Font Loading API，假设字体已加载（通过HTML中的link标签）
    return true
  }
  
  // 检查字体是否可用（使用不同的字体大小和样式）
  const fontFamilies = ['Great Vibes', 'Dancing Script', 'Pacifico']
  let loadedCount = 0
  
  for (const fontFamily of fontFamilies) {
    // 检查不同样式和大小
    const checks = [
      document.fonts.check(`12px "${fontFamily}"`),
      document.fonts.check(`bold 12px "${fontFamily}"`),
      document.fonts.check(`150px "${fontFamily}"`),
    ]
    if (checks.some(check => check)) {
      loadedCount++
    }
  }
  
  // 如果至少有一个字体已加载，返回true
  const result = loadedCount > 0
  if (!result) {
    console.warn('No custom fonts detected. Available fonts:', document.fonts.size)
  }
  return result
}

/**
 * 将文本转换为3D点云位置
 * 使用Canvas 2D API进行文本栅格化，然后采样为点
 */
export function generateTextPositions(
  text: string,
  options: {
    fontSize?: number
    fontFamily?: string
    width?: number
    height?: number
    depth?: number // Z轴厚度
    pointDensity?: number // 点密度（每像素）
  } = {}
): THREE.Vector3[] {
  const {
    fontSize = 150, // 增大默认字体大小
    fontFamily = '"Great Vibes", "Dancing Script", "Pacifico", cursive', // 使用花式字体
    width = 2048, // 增大画布宽度以容纳更大的文字
    height = 512,
    depth = 0.5,
    pointDensity = 0.6, // 增加点密度，生成更多粒子
  } = options

  // 创建缓存键（添加版本号以反映Y偏移和笔画粗细的变化，以及字体版本）
  // 使用字体加载状态作为缓存键的一部分，确保字体加载后重新生成
  const fontsLoaded = areFontsLoaded()
  const cacheKey = `${text}-${fontSize}-${width}-${height}-${depth}-${pointDensity}-${fontFamily}-v3-${fontsLoaded ? 'fonts' : 'default'}`
  
  // 检查缓存
  if (textPositionCache.has(cacheKey)) {
    return textPositionCache.get(cacheKey)!.map(pos => pos.clone())
  }

  // 如果字体还没加载，记录警告但继续生成（使用回退字体）
  if (!fontsLoaded) {
    console.warn('Fonts may not be fully loaded yet. Text may use fallback fonts. Consider refreshing the page.')
  }

  // 创建离屏Canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    console.warn('Canvas context not available')
    return []
  }

  // 设置样式 - 使用花式字体
  // 使用花式字体栈，优先使用 Google Fonts
  const safeFontFamily = fontFamily || '"Great Vibes", "Dancing Script", "Pacifico", cursive'
  
  // 清除画布为白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  
  // 设置文字颜色为黑色，并添加黑色描边使字体更粗
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4 // 减小描边宽度使笔画更细
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // 尝试使用不同的字体，直到找到可用的
  const fontOptions = [
    `bold ${fontSize}px "Great Vibes", cursive`,
    `bold ${fontSize}px "Dancing Script", cursive`,
    `bold ${fontSize}px "Pacifico", cursive`,
    `bold ${fontSize}px ${safeFontFamily}`,
    `${fontSize}px "Great Vibes", cursive`,
    `${fontSize}px "Dancing Script", cursive`,
    `${fontSize}px "Pacifico", cursive`,
  ]
  
  let textDrawn = false
  for (const fontOption of fontOptions) {
    ctx.font = fontOption
    const actualFont = ctx.font
    
    // 验证字体是否被应用（检查是否包含字体名称）
    const fontApplied = actualFont.includes('Great Vibes') || 
                       actualFont.includes('Dancing Script') || 
                       actualFont.includes('Pacifico')
    
    try {
      ctx.strokeText(text, width / 2, height / 2)
      ctx.fillText(text, width / 2, height / 2)
      
      if (fontApplied) {
        console.log(`Successfully used font: ${actualFont}`)
        textDrawn = true
        break
      } else {
        console.warn(`Font not applied, actual font: ${actualFont}, trying next...`)
      }
    } catch (e) {
      console.warn(`Error with font ${fontOption}:`, e)
      continue
    }
  }
  
  if (!textDrawn) {
    // 最后尝试使用默认字体
    ctx.font = `bold ${fontSize}px ${safeFontFamily}`
    ctx.strokeText(text, width / 2, height / 2)
    ctx.fillText(text, width / 2, height / 2)
    console.warn('Using fallback font:', ctx.font)
  }

  // 采样像素
  const imageData = ctx.getImageData(0, 0, width, height)
  const positions: THREE.Vector3[] = []

  // 第一步：找到文字的实际边界（bounding box）
  let minX = width
  let maxX = 0
  let minY = height
  let maxY = 0
  let hasText = false

  // 先扫描整个画布，找到文字的实际边界
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const r = imageData.data[index]
      const g = imageData.data[index + 1]
      const b = imageData.data[index + 2]
      const a = imageData.data[index + 3]

      const isNotWhite = r < 250 || g < 250 || b < 250
      if (isNotWhite && a > 128) {
        hasText = true
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  // 如果没找到文字，返回空数组
  if (!hasText) {
    console.warn('No text pixels found in canvas')
    return []
  }

  // 添加一些边距，确保采样完整
  const padding = 10
  minX = Math.max(0, minX - padding)
  maxX = Math.min(width - 1, maxX + padding)
  minY = Math.max(0, minY - padding)
  maxY = Math.min(height - 1, maxY + padding)

  const textWidth = maxX - minX + 1
  const textHeight = maxY - minY + 1

  console.log(`Text bounding box: (${minX}, ${minY}) to (${maxX}, ${maxY}), size: ${textWidth}x${textHeight}`)

  // 第二步：在文字区域内均匀采样
  // 计算采样步长，确保在整个文字区域内均匀分布
  const step = Math.max(1, Math.floor(1 / pointDensity))
  
  // 收集所有文字像素位置
  const textPixels: Array<{ x: number; y: number }> = []
  
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      const index = (y * width + x) * 4
      const r = imageData.data[index]
      const g = imageData.data[index + 1]
      const b = imageData.data[index + 2]
      const a = imageData.data[index + 3]

      const isNotWhite = r < 250 || g < 250 || b < 250
      if (isNotWhite && a > 128) {
        textPixels.push({ x, y })
      }
    }
  }

  // 如果采样到的点太少，降低步长重新采样
  if (textPixels.length < 100) {
    console.log(`Too few pixels sampled (${textPixels.length}), reducing step size`)
    textPixels.length = 0
    const smallerStep = Math.max(1, Math.floor(step / 2))
    for (let y = minY; y <= maxY; y += smallerStep) {
      for (let x = minX; x <= maxX; x += smallerStep) {
        const index = (y * width + x) * 4
        const r = imageData.data[index]
        const g = imageData.data[index + 1]
        const b = imageData.data[index + 2]
        const a = imageData.data[index + 3]

        const isNotWhite = r < 250 || g < 250 || b < 250
        if (isNotWhite && a > 128) {
          textPixels.push({ x, y })
        }
      }
    }
  }

  // 第三步：将采样到的像素转换为3D位置
  for (const pixel of textPixels) {
    const x = pixel.x
    const y = pixel.y
    // 转换为3D坐标（居中，Y轴向上）
    const x3d = (x - width / 2) / 100
    const y3d = (height / 2 - y) / 100 + 5 // 上移文字，使其更靠近星星
    // 使用确定性伪随机数，基于坐标生成，确保缓存有效
    const seed = x * 73856093 + y * 19349663
    const random = ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
    const z3d = (random - 0.5) * depth

    positions.push(new THREE.Vector3(x3d, y3d, z3d))
  }

  // 添加调试信息
  console.log(`Generated ${positions.length} text positions for "${text}"`)

  // 缓存结果
  textPositionCache.set(cacheKey, positions.map(pos => pos.clone()))

  return positions
}

/**
 * 为文本位置添加厚度和变化
 */
export function addTextThickness(
  positions: THREE.Vector3[],
  thickness: number = 0.2,
  layers: number = 3
): THREE.Vector3[] {
  const expanded: THREE.Vector3[] = []

  for (const pos of positions) {
    for (let i = 0; i < layers; i++) {
      const z = pos.z + (i - layers / 2) * (thickness / layers)
      expanded.push(new THREE.Vector3(pos.x, pos.y, z))
    }
  }

  return expanded
}


