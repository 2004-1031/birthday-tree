import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, TreeMorphState } from '../../store/useStore'

export function StarTopper() {
  const starRef = useRef<THREE.Group>(null)
  const { currentState } = useStore()

  // 创建星星几何体 - 五角星形状
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const outerRadius = 0.8
    const innerRadius = 0.3
    const spikes = 5

    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      if (i === 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    }
    shape.closePath()

    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 8,
    }

    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])

  // 水晶质感材质
  const starMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.1,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.5,
        envMapIntensity: 2.0,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      }),
    []
  )

  // 动画循环
  useFrame((state) => {
    if (!starRef.current) return

    const time = state.clock.elapsedTime

    // 星星位置：在圣诞树顶部
    const treeHeight = 8
    const targetY = treeHeight + 0.5

    // 根据状态调整位置
    let targetPosition: THREE.Vector3
    if (currentState === TreeMorphState.TREE_SHAPE) {
      targetPosition = new THREE.Vector3(0, targetY, 0)
    } else if (currentState === TreeMorphState.SCATTERED) {
      // 散落状态时，星星稍微上移并散开
      const scatterY = targetY + 0
      const scatterX = Math.sin(time * 0.2) * 2
      const scatterZ = Math.cos(time * 0.2) * 2
      targetPosition = new THREE.Vector3(scatterX, scatterY, scatterZ)
    } else {
      // TEXT_SHAPE状态时，星星在文字上方
      targetPosition = new THREE.Vector3(0, targetY + 0, 0)
    }

    starRef.current.position.lerp(targetPosition, 0.1)

    // 旋转动画
    starRef.current.rotation.y = time * 0.3
    starRef.current.rotation.z = Math.sin(time * 0.5) * 0.1

    // 呼吸效果 - 缩放
    const scale = 1 + Math.sin(time * 2) * 0.1
    starRef.current.scale.setScalar(scale)

    // 根据状态调整发光强度
    if (starRef.current.children[0]) {
      const mesh = starRef.current.children[0] as THREE.Mesh
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        if (currentState === TreeMorphState.TREE_SHAPE) {
          mesh.material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.3
        } else {
          mesh.material.emissiveIntensity = 0.3
        }
      }
    }
  })

  return (
    <group ref={starRef} position={[0, 8.5, 0]}>
      <mesh geometry={starGeometry} material={starMaterial} />
    </group>
  )
}

