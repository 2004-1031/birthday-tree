import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, TreeMorphState } from '../../store/useStore'
import { usePhotoLayout } from '../../hooks/useLayoutGenerator'
import { easeInOutCubic } from '../../utils/math'

interface PhotoSystemProps {
  photos: File[]
  textures: THREE.Texture[]
}

export function PhotoSystem({ photos, textures }: PhotoSystemProps) {
  const meshesRef = useRef<THREE.Mesh[]>([])
  const photoLayout = usePhotoLayout(photos.length)
  const instancesRef = useRef(photoLayout)
  const { currentState, transitionProgress } = useStore()

  // 当照片数量变化时，更新布局
  if (instancesRef.current.length !== photos.length) {
    instancesRef.current = photoLayout
  }

  // 为每张照片创建平面几何体和材质
  const photoMeshes = useMemo(() => {
    // 清理旧的mesh
    meshesRef.current.forEach((mesh) => {
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })

    if (photos.length === 0) {
      meshesRef.current = []
      return []
    }

    const meshes: THREE.Mesh[] = []
    const baseSize = 1.0 // 基础尺寸，保持较大

    photos.forEach((photo, index) => {
      const texture = textures[index]
      if (!texture) return

      // 检查纹理图片是否已加载
      if (!texture.image) return

      // 获取原始图片的宽高比
      const aspectRatio = texture.image.width / texture.image.height
      const width = aspectRatio > 1 ? baseSize : baseSize * aspectRatio
      const height = aspectRatio > 1 ? baseSize / aspectRatio : baseSize

      const geometry = new THREE.PlaneGeometry(width, height)
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0, // 完全不透明，保持原始透明度
        side: THREE.DoubleSide,
        color: 0xffffff, // 白色，保持原始颜色
      })

      const mesh = new THREE.Mesh(geometry, material)
      meshes.push(mesh)
    })

    meshesRef.current = meshes
    return meshes
  }, [photos, textures])

  // 动画循环
  useFrame((state) => {
    const camera = state.camera
    const easedProgress = easeInOutCubic(transitionProgress)

    photoMeshes.forEach((mesh, index) => {
      const instance = instancesRef.current[index]
      if (!instance) return

      // 确定目标位置
      let targetPosition: THREE.Vector3

      if (currentState === TreeMorphState.TREE_SHAPE) {
        // TREE_SHAPE: 在环轨道上（保持不变）
        targetPosition = instance.treePosition.clone()
        // 添加缓慢旋转
        const orbitAngle = (state.clock.elapsedTime * 0.2 + index) % (Math.PI * 2)
        const orbitRadius = 6 + (index % 3) * 1.5
        const orbitHeight = 4 + (index % 5) * 1.5
        targetPosition.set(
          Math.cos(orbitAngle) * orbitRadius,
          orbitHeight,
          Math.sin(orbitAngle) * orbitRadius
        )
      } else if (currentState === TreeMorphState.TEXT_SHAPE || currentState === TreeMorphState.SCATTERED) {
        // TEXT_SHAPE 和 SCATTERED: 使用文字和星星旁边的位置
        if (instance.textPosition) {
          targetPosition = instance.textPosition.clone()
        } else {
          // 如果 textPosition 为 null，生成围绕文字和星星的位置
          // 星星位置大约在 (0, 10.5, 0)，文字在 Y=7 附近
          // 围绕文字和星星生成位置
          const starY = 10.5
          const textCenterY = 7
          const centerY = (starY + textCenterY) / 2 // 文字和星星的中间位置
          
          // 使用固定种子生成位置，确保位置稳定
          const seed = index * 123.456
          const angle = (Math.sin(seed) * 10000) % (Math.PI * 2)
          const radius = 3 + (Math.sin(seed * 2) * 10000) % 2 // 半径 3-5
          const heightOffset = (Math.sin(seed * 3) * 10000) % 3 - 1.5 // -1.5 到 1.5
          
          targetPosition = new THREE.Vector3(
            Math.cos(angle) * radius,
            centerY + heightOffset,
            Math.sin(angle) * radius
          )
        }
      } else {
        // 默认使用散落位置
        targetPosition = instance.scatterPosition.clone()
      }

      // 平滑插值
      instance.currentPosition.lerp(targetPosition, easedProgress * 0.1 + 0.05)

      // 更新位置
      mesh.position.copy(instance.currentPosition)

      // Billboard效果：始终面向相机
      mesh.lookAt(camera.position)

      // 在TEXT_SHAPE状态时稍微放大
      if (currentState === TreeMorphState.TEXT_SHAPE) {
        mesh.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1)
      } else {
        mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      }

      // 移除边缘光晕效果，保持原始颜色
    })
  })

  return (
    <>
      {photoMeshes.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
    </>
  )
}

