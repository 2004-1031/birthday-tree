import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, TreeMorphState } from '../../store/useStore'
import { useFoliageLayout } from '../../hooks/useLayoutGenerator'
import { easeInOutCubic, noise } from '../../utils/math'

const FOLIAGE_COUNT = 3000 // 减少粒子数量

export function FoliageSystem() {
  const pointsRef = useRef<THREE.Points>(null)
  const instances = useFoliageLayout(FOLIAGE_COUNT)
  const instancesRef = useRef(instances)
  const { currentState, transitionProgress } = useStore()
  
  // 更新 ref 当 instances 改变时
  instancesRef.current = instances

  // 创建几何体和材质
  const { geometry, material } = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array(FOLIAGE_COUNT * 3)
    const colors = new Float32Array(FOLIAGE_COUNT * 3)
    const sizes = new Float32Array(FOLIAGE_COUNT)

    // 白色/水晶色粒子
    const white = new THREE.Color(0xffffff) // 白色
    const crystal = new THREE.Color(0xe0f2ff) // 水晶蓝白色
    const lightBlue = new THREE.Color(0xb8e6ff) // 浅蓝色

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      const i3 = i * 3
      const instance = instances[i]

      // 初始位置
      positions[i3] = instance.currentPosition.x
      positions[i3 + 1] = instance.currentPosition.y
      positions[i3 + 2] = instance.currentPosition.z

      // 颜色：白色到水晶色的渐变
      const colorChoice = Math.random()
      let color: THREE.Color
      if (colorChoice < 0.5) {
        color = white.clone()
      } else if (colorChoice < 0.8) {
        color = crystal.clone()
      } else {
        color = lightBlue.clone()
      }
      // 添加轻微的随机变化
      const variation = (Math.random() - 0.5) * 0.2
      color.r = Math.min(1, Math.max(0.8, color.r + variation))
      color.g = Math.min(1, Math.max(0.8, color.g + variation))
      color.b = Math.min(1, Math.max(0.8, color.b + variation))
      
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      // 大小 - 减小粒子大小
      sizes[i] = Math.random() * 0.06 + 0.03 // 0.03-0.09，更小的粒子
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

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
          // 确保点大小在合理范围内，最小 2.0 像素
          gl_PointSize = distance > 0.0 ? max(size * (800.0 / distance), 2.0) : 0.0;
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
          alpha = max(alpha, 0.9); // 确保高 alpha 值
          
          // 边缘高亮（水晶光晕效果）
          float edgeGlow = smoothstep(0.3, 0.5, dist);
          vec3 finalColor = mix(vColor, vec3(1.0, 1.0, 1.0), edgeGlow * 0.4);
          
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
  }, [instances])

  // 动画循环
  useFrame((state) => {
    if (!pointsRef.current || !geometry) return
    if (!instancesRef.current || instancesRef.current.length === 0) return

    const positions = geometry.attributes.position as THREE.BufferAttribute
    if (!positions) return
    
    const time = state.clock.elapsedTime

    // 更新每个粒子的位置
    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      const instance = instancesRef.current[i]
      if (!instance) continue

      // 根据当前状态确定目标位置
      let targetPosition: THREE.Vector3

      if (currentState === TreeMorphState.SCATTERED) {
        targetPosition = instance.scatterPosition.clone()
        // 添加轻微漂移
        const drift = new THREE.Vector3(
          noise(time * 0.5 + i, 0, 0) * 0.1,
          noise(0, time * 0.5 + i, 0) * 0.1,
          noise(0, 0, time * 0.5 + i) * 0.1
        )
        targetPosition.add(drift)
      } else if (currentState === TreeMorphState.TEXT_SHAPE) {
        targetPosition = instance.textPosition
          ? instance.textPosition.clone()
          : instance.scatterPosition.clone().multiplyScalar(1.5) // 未参与文字的粒子向外扩散
      } else {
        // TREE_SHAPE
        targetPosition = instance.treePosition.clone()
      }

      // 平滑插值到目标位置
      const easedProgress = easeInOutCubic(transitionProgress)
      instance.currentPosition.lerp(targetPosition, easedProgress * 0.1 + 0.05)

      // 添加呼吸感（轻微抖动）
      if (currentState === TreeMorphState.TREE_SHAPE) {
        const breath = noise(time + i * 0.01, 0, 0) * 0.05
        instance.currentPosition.add(
          new THREE.Vector3(breath, breath * 0.5, breath)
        )
      }

      // 更新缓冲区
      positions.setXYZ(
        i,
        instance.currentPosition.x,
        instance.currentPosition.y,
        instance.currentPosition.z
      )
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

