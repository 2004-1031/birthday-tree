import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { FoliageSystem } from './FoliageSystem'
import { OrnamentSystem } from './OrnamentSystem'
import { PhotoSystem } from './PhotoSystem'
import { PostProcessing } from './PostProcessing'
import { DustSystem } from './DustSystem'
import { StarTopper } from './StarTopper'
import { LoadingOverlay } from './LoadingOverlay'
import { useStore } from '../../store/useStore'

interface SceneProps {
  photos: File[]
}

function SceneContent({ photos }: SceneProps) {
  const [textures, setTextures] = useState<THREE.Texture[]>([])

  // 加载照片纹理
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    const loadTextures = async () => {
      const loadedTextures: THREE.Texture[] = []

      for (const photo of photos) {
        try {
          // 先读取文件为 Data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(photo)
          })

          // 然后加载纹理，等待图片完全加载
          const texture = await new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(
              dataUrl,
              (loadedTexture) => {
                // 纹理加载成功
                loadedTexture.minFilter = THREE.LinearFilter
                loadedTexture.magFilter = THREE.LinearFilter
                loadedTexture.colorSpace = THREE.SRGBColorSpace
                resolve(loadedTexture)
              },
              undefined,
              (error) => {
                // 纹理加载失败
                console.error('Failed to load texture:', error)
                reject(error)
              }
            )
          })
          loadedTextures.push(texture)
        } catch (error) {
          console.error('Failed to load photo texture:', error)
          // 即使加载失败，也添加一个占位符，保持数组长度一致
          // 这样 PhotoSystem 可以正确处理所有照片
          loadedTextures.push(null as any)
        }
      }

      setTextures(loadedTextures)
    }

    if (photos.length > 0) {
      loadTextures()
    } else {
      setTextures([])
    }
  }, [photos])

  // 状态切换动画
  const { currentState, setTransitionProgress, setIsTransitioning } = useStore()

  useEffect(() => {
    setIsTransitioning(true)
    setTransitionProgress(0)

    const duration = 2000 // 2秒过渡
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      setTransitionProgress(progress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsTransitioning(false)
      }
    }

    animate()
  }, [currentState, setTransitionProgress, setIsTransitioning])

  return (
    <>
      {/* 背景色和雾效 */}
      <color attach="background" args={['#0a0e27']} />
      <fog attach="fog" args={['#1a0d2e', 10, 50]} />
      
      {/* 环境光 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        color={0xffd700}
      />
      <pointLight position={[0, 10, 0]} intensity={0.6} color={0xffffff} />
      <pointLight position={[-10, 5, -5]} intensity={0.4} color={0x9d4edd} />
      <pointLight position={[10, 5, -5]} intensity={0.4} color={0x4a90e2} />

      {/* 环境贴图（延迟加载，使用更轻量的预设，降低强度以减少加载时间） */}
      <Suspense fallback={null}>
        <Environment 
          preset="night" 
          environmentIntensity={0.3}
          resolution={256}
        />
      </Suspense>

      {/* 主要系统 */}
      <FoliageSystem />
      <OrnamentSystem />
      <DustSystem />
      <StarTopper />
      {photos.length > 0 && <PhotoSystem photos={photos} textures={textures} />}

      {/* 后期处理 */}
      <PostProcessing />
    </>
  )
}

export function Scene() {
  const photos = useStore((state) => state.photos)
  const [webglError, setWebglError] = useState<string | null>(null)
  
  // 检测是否为移动设备
  const isMobile = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768) ||
           ('ontouchstart' in window)
  }
  
  // 根据设备性能动态调整 dpr
  const getDPR = () => {
    if (typeof window === 'undefined') return 1
    const mobile = isMobile()
    const baseDPR = window.devicePixelRatio || 1
    
    if (mobile) {
      // 移动设备：限制 DPR 以提升性能
      return Math.min(baseDPR, 1.5)
    }
    
    // 桌面设备：检测是否为低性能设备
    const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || 
                     ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4)
    return isLowEnd ? Math.min(baseDPR, 1.5) : Math.min(baseDPR, 2)
  }
  
  // WebGL 检测
  useEffect(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    
    if (!gl) {
      setWebglError('您的设备不支持 WebGL，无法显示 3D 内容。请尝试更新浏览器或设备。')
      return
    }
    
    // 检查 WebGL 扩展支持
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      console.log('WebGL Vendor:', vendor)
      console.log('WebGL Renderer:', renderer)
    }
  }, [])

  // 如果 WebGL 不支持，显示错误信息
  if (webglError) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(to bottom, #0a0e27 0%, #1a0d2e 50%, #2d1b3d 100%)',
        color: '#fff',
        padding: '20px',
        textAlign: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div style={{ fontSize: '18px', maxWidth: '500px' }}>{webglError}</div>
      </div>
    )
  }

  return (
    <Canvas
      gl={{
        antialias: !isMobile(), // 移动设备禁用抗锯齿以提升性能
        alpha: false,
        powerPreference: isMobile() ? 'default' : 'high-performance', // 移动设备使用默认电源偏好
        failIfMajorPerformanceCaveat: false, // 允许在低性能设备上运行
        stencil: false, // 禁用模板缓冲以提升性能
        depth: true,
        preserveDrawingBuffer: false,
      }}
      dpr={getDPR()}
      style={{ 
        background: 'linear-gradient(to bottom, #0a0e27 0%, #1a0d2e 50%, #2d1b3d 100%)',
        touchAction: 'none', // 防止触摸事件被浏览器处理
      }}
      onCreated={({ gl }) => {
        // 优化移动设备的渲染设置
        if (isMobile()) {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
          // 禁用某些高消耗功能
          gl.shadowMap?.enabled && (gl.shadowMap.enabled = false)
        }
      }}
      onError={(error) => {
        console.error('Canvas error:', error)
        setWebglError('渲染错误：' + (error instanceof Error ? error.message : '未知错误'))
      }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 3, 15]} fov={50} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          target={[0, 5, 0]}
          touches={{
            ONE: 2, // 单指触摸旋转
            TWO: 1, // 双指触摸缩放和移动
          }}
          rotateSpeed={isMobile() ? 0.5 : 1}
          zoomSpeed={isMobile() ? 0.8 : 1}
          panSpeed={isMobile() ? 0.8 : 1}
          enableDamping={true}
          dampingFactor={0.05}
        />
        <LoadingOverlay />
        <SceneContent photos={photos} />
      </Suspense>
    </Canvas>
  )
}

