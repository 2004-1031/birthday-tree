import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { randomPointInSphere } from '../../utils/math'
import { useStore, TreeMorphState } from '../../store/useStore'
import { generateTextPositions, addTextThickness } from '../../utils/textSampler'
import { easeInOutCubic } from '../../utils/math'

const DUST_COUNT = 20000 // 尘埃粒子数量

export function DustSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const { currentState, transitionProgress } = useStore()
  
  // 生成文字位置，只有尘埃参与文字形成，使用花式字体
  const textPositions = useMemo(() => {
    const positions = addTextThickness(
      generateTextPositions('Happy Birthday to Jingjing', {
        fontSize: 150, // 增大字体
        fontFamily: '"Great Vibes", "Dancing Script", "Pacifico", cursive', // 花式字体
        width: 2048,
        height: 512,
        depth: 0.3,
        pointDensity: 0.6,
      }),
      0.3,
      3
    )
    console.log(`DustSystem: Generated ${positions.length} text positions, need ${DUST_COUNT} particles`)
    return positions
  }, [])

  // 创建几何体和材质 - 移除 textPositions 依赖，因为它已经稳定
  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array(DUST_COUNT * 3)
    const colors = new Float32Array(DUST_COUNT * 3)
    const sizes = new Float32Array(DUST_COUNT)
    const velocities = new Float32Array(DUST_COUNT * 3)

    // 多彩的尘埃粒子 - 扩展调色板，只用这些颜色组成字体
    const colorPalette = [
      new THREE.Color(0xffd700), // 金色
      new THREE.Color(0xffffff), // 白色
      new THREE.Color(0xffff00), // 黄色
    ]

    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3
      const pos = randomPointInSphere(20) // 更大的分布范围

      // 初始位置
      positions[i3] = pos.x
      positions[i3 + 1] = pos.y
      positions[i3 + 2] = pos.z

      // 随机颜色
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      // 大小 - 小粒子，形成点云效果
      sizes[i] = Math.random() * 0.02 + 0.01 // 0.01-0.03，小粒子

      // 初始速度
      velocities[i3] = (Math.random() - 0.5) * 0.01
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geom.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;
        
        attribute float size;
        
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distance = -mvPosition.z;
          // 小粒子效果，根据距离调整大小，最小 1.0 像素，最大 3.0 像素
          gl_PointSize = distance > 0.0 ? clamp(size * (200.0 / distance), 1.0, 3.0) : 0.0;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // 圆形粒子，确保可见
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha = clamp(alpha, 0.6, 1.0); // 适中的 alpha，让粒子更自然
          
          // 添加微光效果
          float glow = smoothstep(0.3, 0.5, dist);
          vec3 finalColor = mix(vColor, vec3(1.0), glow * 0.2);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      depthTest: false, // 禁用深度测试，确保粒子总是显示
    })

    return { geometry: geom, material: mat }
  }, []) // 移除 textPositions 依赖，几何体和材质只需要创建一次

  // 存储每个粒子的当前位置和目标位置
  const currentPositionsRef = useRef<THREE.Vector3[]>([])
  const scatterPositionsRef = useRef<THREE.Vector3[]>([])
  
  // 初始化位置
  useEffect(() => {
    if (!geometry) return
    currentPositionsRef.current = []
    scatterPositionsRef.current = []
    const positions = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < DUST_COUNT; i++) {
      const pos = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      )
      currentPositionsRef.current.push(pos.clone())
      scatterPositionsRef.current.push(pos.clone())
    }
  }, [geometry])

  // 动画循环
  useFrame((state) => {
    if (!pointsRef.current || !geometry) return

    const positions = geometry.attributes.position as THREE.BufferAttribute
    if (!positions) return
    
    const time = state.clock.elapsedTime
    const easedProgress = easeInOutCubic(transitionProgress)

    // 确保位置数组已初始化
    if (currentPositionsRef.current.length === 0 || scatterPositionsRef.current.length === 0) {
      return
    }

    // 更新每个粒子的位置
    for (let i = 0; i < DUST_COUNT; i++) {
      const currentPos = currentPositionsRef.current[i]
      const scatterPos = scatterPositionsRef.current[i]
      
      if (!currentPos || !scatterPos) continue

      // 根据当前状态确定目标位置
      let targetPosition: THREE.Vector3

      if (currentState === TreeMorphState.SCATTERED) {
        targetPosition = scatterPos.clone()
        // 添加轻微漂移
        const angle = time * 0.1 + i * 0.01
        targetPosition.add(
          new THREE.Vector3(
            Math.sin(angle) * 0.1,
            Math.cos(angle * 1.3) * 0.1,
            Math.sin(angle * 0.7) * 0.1
          )
        )
      } else if (currentState === TreeMorphState.TEXT_SHAPE) {
        // 改进的文字位置分配策略：均匀分布在整个文字区域
        if (textPositions.length > 0) {
          // 使用更均匀的分配方式：按比例映射，而不是简单循环
          // 这样可以确保粒子均匀分布在整个文字区域
          const index = Math.floor((i / DUST_COUNT) * textPositions.length)
          const textPos = textPositions[Math.min(index, textPositions.length - 1)]
          
          // 如果文字位置数量少于粒子数量，添加一些随机偏移来避免重叠
          if (textPositions.length < DUST_COUNT) {
            const localIndex = i % textPositions.length
            
            // 为重复使用的粒子添加小的随机偏移
            const seed = i * 73856093 + localIndex * 19349663
            const random1 = ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
            const random2 = (((seed + 1) * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
            const random3 = (((seed + 2) * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
            
            // 添加小的随机偏移，范围约为0.05单位
            const offset = new THREE.Vector3(
              (random1 - 0.5) * 0.05,
              (random2 - 0.5) * 0.05,
              (random3 - 0.5) * 0.02
            )
            
            targetPosition = textPos.clone().add(offset)
          } else {
            targetPosition = textPos.clone()
          }
        } else {
          // 如果没有文字位置，粒子向外扩散
          targetPosition = scatterPos.clone().multiplyScalar(1.5)
        }
      } else {
        // TREE_SHAPE: 保持散落状态或围绕树
        targetPosition = scatterPos.clone()
      }

      // 平滑插值到目标位置
      currentPos.lerp(targetPosition, easedProgress * 0.1 + 0.05)

      // 更新缓冲区
      positions.setXYZ(i, currentPos.x, currentPos.y, currentPos.z)
    }

    positions.needsUpdate = true
  })

  return (
    <points 
      ref={pointsRef} 
      geometry={geometry} 
      material={material}
      renderOrder={100}
    />
  )
}

