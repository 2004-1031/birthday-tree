import { useMemo } from 'react'
import * as THREE from 'three'
import {
  randomPointInSphere,
  pointOnCone,
  pointOnOrbit,
} from '../utils/math'
import { generateTextPositions } from '../utils/textSampler'

export interface MorphableInstance {
  scatterPosition: THREE.Vector3
  textPosition: THREE.Vector3 | null // null表示不参与文字形状
  treePosition: THREE.Vector3
  currentPosition: THREE.Vector3
  velocity?: THREE.Vector3 // 用于动画
  weight?: number // 受力权重（重型/轻型）
}

/**
 * 生成针叶粒子的布局
 */
export function useFoliageLayout(count: number = 5000) {
  return useMemo(() => {
    const instances: MorphableInstance[] = []

    // SCATTERED: 随机分布在球体中
    const scatterRadius = 15

    // TREE: 圣诞树圆锥体 - 缩小尺寸
    const treeHeight = 8
    const treeBaseRadius = 2.5
    const treeTopRadius = 0.15

    // 针叶粒子不参与文字形成，不需要生成文字位置

    // 为每个粒子分配位置
    for (let i = 0; i < count; i++) {
      const scatterPos = randomPointInSphere(scatterRadius)

      // 树位置：在圆锥体上分布
      const t = Math.random()
      const angle = Math.random() * Math.PI * 2
      const treePos = pointOnCone(treeHeight, treeBaseRadius, treeTopRadius, t, angle)
      // 添加一些随机偏移使树更自然
      treePos.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.3
        )
      )

      instances.push({
        scatterPosition: scatterPos,
        textPosition: null, // 针叶粒子不参与文字形成
        treePosition: treePos,
        currentPosition: scatterPos.clone(),
        weight: 1.0, // 针叶粒子为中等重量
      })
    }

    return instances
  }, [count])
}

/**
 * 生成装饰物的布局
 */
export function useOrnamentLayout(
  heavyCount: number = 20, // 礼物盒
  lightCount: number = 100, // 彩球
  tinyCount: number = 200 // 小灯点
) {
  return useMemo(() => {
    const instances: MorphableInstance[] = []

    const scatterRadius = 15
    const treeHeight = 8
    const treeBaseRadius = 2.5
    const treeTopRadius = 0.15

    // 装饰品不参与文字形成，不需要生成文字位置

    // 重型元素（礼物盒）
    for (let i = 0; i < heavyCount; i++) {
      const scatterPos = randomPointInSphere(scatterRadius * 0.8) // 稍微靠近中心
      const t = Math.random()
      const angle = Math.random() * Math.PI * 2
      const treePos = pointOnCone(
        treeHeight * 0.8,
        treeBaseRadius * 0.9,
        treeTopRadius,
        t,
        angle
      )
      treePos.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.5
        )
      )

      instances.push({
        scatterPosition: scatterPos,
        textPosition: null, // 重型元素不参与文字
        treePosition: treePos,
        currentPosition: scatterPos.clone(),
        weight: 3.0, // 重型
      })
    }

    // 轻型元素（彩球）
    for (let i = 0; i < lightCount; i++) {
      const scatterPos = randomPointInSphere(scatterRadius)
      const t = Math.random()
      const angle = Math.random() * Math.PI * 2
      const treePos = pointOnCone(treeHeight, treeBaseRadius, treeTopRadius, t, angle)
      treePos.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.4
        )
      )

      instances.push({
        scatterPosition: scatterPos,
        textPosition: null, // 装饰品不参与文字形成
        treePosition: treePos,
        currentPosition: scatterPos.clone(),
        weight: 1.5, // 中等偏轻
      })
    }

    // 极轻元素（小灯点）
    for (let i = 0; i < tinyCount; i++) {
      const scatterPos = randomPointInSphere(scatterRadius * 1.2) // 更分散
      const t = Math.random()
      const angle = Math.random() * Math.PI * 2
      const treePos = pointOnCone(treeHeight, treeBaseRadius, treeTopRadius, t, angle)
      treePos.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.3
        )
      )

      instances.push({
        scatterPosition: scatterPos,
        textPosition: null, // 装饰品不参与文字形成
        treePosition: treePos,
        currentPosition: scatterPos.clone(),
        weight: 0.5, // 极轻
      })
    }

    return instances
  }, [heavyCount, lightCount, tinyCount])
}

/**
 * 生成照片粒子的布局
 */
export function usePhotoLayout(photoCount: number) {
  return useMemo(() => {
    const instances: MorphableInstance[] = []

    const scatterRadius = 12
    const treeHeight = 8
    const treeBaseRadius = 2.5

    // 文字位置：照片可以围绕文字，使用花式字体
    const textPositionsResult = generateTextPositions('Happy Birthday to Jingjing', {
      fontSize: 100,
      fontFamily: '"Great Vibes", "Dancing Script", "Pacifico", cursive', // 花式字体
      width: 2048,
      height: 512,
      depth: 0.3,
      pointDensity: 0.4, // 增加点密度
    })

    // 处理同步或异步返回的文字位置
    let textPositions: THREE.Vector3[] = []
    if (textPositionsResult instanceof Promise) {
      // 如果是 Promise，使用默认位置生成逻辑
      textPositions = []
    } else {
      textPositions = textPositionsResult
    }

    // 计算文字边界框，用于避免照片遮挡文字
    let textBounds = {
      minX: -10,
      maxX: 10,
      minY: 5,
      maxY: 9,
      minZ: -0.5,
      maxZ: 0.5,
    }
    if (textPositions.length > 0) {
      textBounds = {
        minX: Math.min(...textPositions.map(p => p.x)),
        maxX: Math.max(...textPositions.map(p => p.x)),
        minY: Math.min(...textPositions.map(p => p.y)),
        maxY: Math.max(...textPositions.map(p => p.y)),
        minZ: Math.min(...textPositions.map(p => p.z)),
        maxZ: Math.max(...textPositions.map(p => p.z)),
      }
      // 扩展边界，为文字留出一些空间
      const padding = 0.3
      textBounds.minX -= padding
      textBounds.maxX += padding
      textBounds.minY -= padding
      textBounds.maxY += padding
      textBounds.minZ -= padding
      textBounds.maxZ += padding
    }

    // 星星位置大约在 (0, 10.5, 0)
    const starY = 10.5

    for (let i = 0; i < photoCount; i++) {
      // SCATTERED: 随机分布
      const scatterPos = randomPointInSphere(scatterRadius)

      // TEXT: 围绕文字和星星的位置，但不遮挡文字
      // 照片应该分布在文字和星星的外围
      let textPos: THREE.Vector3 | null = null
      
      // 计算文字中心
      const textCenterX = (textBounds.minX + textBounds.maxX) / 2
      const textCenterY = (textBounds.minY + textBounds.maxY) / 2
      const textCenterZ = (textBounds.minZ + textBounds.maxZ) / 2
      const textCenter = new THREE.Vector3(textCenterX, textCenterY, textCenterZ)
      
      // 计算文字和星星的包围区域
      const textWidth = textBounds.maxX - textBounds.minX
      const textHeight = textBounds.maxY - textBounds.minY
      
      // 照片距离文字的最小距离（避免遮挡）
      const minDistanceFromText = Math.max(textWidth, textHeight) * 0.5 + 2.5
      
      // 围绕文字和星星形成环状分布
      // 根据索引计算角度，使照片均匀分布
      const baseAngle = (i / photoCount) * Math.PI * 2
      
      // 计算半径：要足够远，避免遮挡文字
      // 考虑文字宽度和高度，确保照片在文字外围
      const baseRadius = minDistanceFromText + (i % 4) * 1.2 // 多层环，半径 2.5+ 到 6+
      
      // 计算高度：在文字和星星之间分布
      const heightRange = starY - textBounds.minY + 1 // 从文字底部到星星上方
      const heightOffset = ((i % 6) / 6 - 0.5) * heightRange * 0.8 // 在范围内分布
      const photoY = textCenterY + heightOffset
      
      // 生成位置
      const photoX = textCenterX + Math.cos(baseAngle) * baseRadius
      const photoZ = textCenterZ + Math.sin(baseAngle) * baseRadius * 0.6 // Z轴稍微压缩
      
      textPos = new THREE.Vector3(photoX, photoY, photoZ)
      
      // 确保照片不在文字边界内（二次检查）
      const isInsideTextBounds = 
        photoX >= textBounds.minX &&
        photoX <= textBounds.maxX &&
        photoY >= textBounds.minY &&
        photoY <= textBounds.maxY &&
        photoZ >= textBounds.minZ &&
        photoZ <= textBounds.maxZ
      
      if (isInsideTextBounds) {
        // 如果在文字边界内，向外推
        const direction = new THREE.Vector3(photoX - textCenterX, photoY - textCenterY, photoZ - textCenterZ)
        // 如果方向向量为零（照片在文字中心），使用默认方向
        if (direction.length() < 0.01) {
          direction.set(Math.cos(baseAngle), 0, Math.sin(baseAngle))
        }
        direction.normalize()
        const pushDistance = minDistanceFromText + 0.5
        textPos = textCenter.clone().add(direction.multiplyScalar(pushDistance))
      }

      // TREE: 在树周围的环轨道上
      const orbitHeight = treeHeight * (0.3 + (i % 5) * 0.15) // 多个高度层
      const orbitRadius = treeBaseRadius + 2 + (i % 3) * 1.5 // 多个半径
      const orbitAngle = (i / photoCount) * Math.PI * 2
      const treeOrbitPos = pointOnOrbit(
        new THREE.Vector3(0, 0, 0),
        orbitRadius,
        orbitHeight,
        orbitAngle
      )

      instances.push({
        scatterPosition: scatterPos,
        textPosition: textPos,
        treePosition: treeOrbitPos,
        currentPosition: scatterPos.clone(),
        weight: 1.0,
      })
    }

    return instances
  }, [photoCount])
}

