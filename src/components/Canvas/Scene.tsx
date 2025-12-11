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
            const texture = loader.load(
              dataUrl,
              (texture) => {
                // 纹理加载成功
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.colorSpace = THREE.SRGBColorSpace
                resolve(texture)
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

      {/* 环境贴图（可选，用于反射） */}
      <Environment preset="sunset" />

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

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ 
        background: 'linear-gradient(to bottom, #0a0e27 0%, #1a0d2e 50%, #2d1b3d 100%)'
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
        />
        <LoadingOverlay />
        <SceneContent photos={photos} />
      </Suspense>
    </Canvas>
  )
}

