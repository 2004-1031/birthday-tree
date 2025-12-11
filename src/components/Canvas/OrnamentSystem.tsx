import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, TreeMorphState } from '../../store/useStore'
import { useOrnamentLayout } from '../../hooks/useLayoutGenerator'
import { easeInOutCubic, noise } from '../../utils/math'

const HEAVY_COUNT = 40 // 增加重型装饰物
const LIGHT_COUNT = 200 // 增加轻型装饰物
const TINY_COUNT = 400 // 增加极轻装饰物

export function OrnamentSystem() {
  const heavyRef = useRef<THREE.InstancedMesh>(null)
  const lightRef = useRef<THREE.InstancedMesh>(null)
  const tinyRef = useRef<THREE.InstancedMesh>(null)

  const heavyInstancesRef = useRef(useOrnamentLayout(HEAVY_COUNT, 0, 0))
  const lightInstancesRef = useRef(
    useOrnamentLayout(0, LIGHT_COUNT, 0).slice(HEAVY_COUNT)
  )
  const tinyInstancesRef = useRef(
    useOrnamentLayout(0, 0, TINY_COUNT).slice(HEAVY_COUNT + LIGHT_COUNT)
  )

  const { currentState, transitionProgress } = useStore()

  // 重型元素：礼物盒 - 使用多种颜色
  const heavyGeometry = useMemo(
    () => new THREE.BoxGeometry(0.3, 0.3, 0.3),
    []
  )
  const heavyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.0, 0.9, 0.5), // 红色系
        metalness: 0.3,
        roughness: 0.4,
        emissive: new THREE.Color(0x220000),
        emissiveIntensity: 0.3,
      }),
    []
  )

  // 轻型元素：彩球 - 使用多种颜色
  const lightGeometry = useMemo(() => new THREE.SphereGeometry(0.15, 16, 16), [])
  const lightMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.1, 0.9, 0.6), // 暖色系
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.5,
        emissive: new THREE.Color(0xffd700),
        emissiveIntensity: 0.3,
      }),
    []
  )

  // 极轻元素：小灯点
  const tinyGeometry = useMemo(() => new THREE.SphereGeometry(0.05, 8, 8), [])
  const tinyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffaa,
        emissiveIntensity: 2.0,
      }),
    []
  )

  // 初始化实例矩阵
  useMemo(() => {
    const matrix = new THREE.Matrix4()

    // 重型元素
    if (heavyRef.current) {
      heavyInstancesRef.current.forEach((instance, i) => {
        matrix.makeTranslation(
          instance.currentPosition.x,
          instance.currentPosition.y,
          instance.currentPosition.z
        )
        heavyRef.current!.setMatrixAt(i, matrix)
      })
      heavyRef.current.instanceMatrix.needsUpdate = true
    }

    // 轻型元素
    if (lightRef.current) {
      lightInstancesRef.current.forEach((instance, i) => {
        matrix.makeTranslation(
          instance.currentPosition.x,
          instance.currentPosition.y,
          instance.currentPosition.z
        )
        lightRef.current!.setMatrixAt(i, matrix)
      })
      lightRef.current.instanceMatrix.needsUpdate = true
    }

    // 极轻元素
    if (tinyRef.current) {
      tinyInstancesRef.current.forEach((instance, i) => {
        matrix.makeTranslation(
          instance.currentPosition.x,
          instance.currentPosition.y,
          instance.currentPosition.z
        )
        tinyRef.current!.setMatrixAt(i, matrix)
      })
      tinyRef.current.instanceMatrix.needsUpdate = true
    }
  }, [])

  // 动画循环
  useFrame((state) => {
    const time = state.clock.elapsedTime
    const matrix = new THREE.Matrix4()
    const easedProgress = easeInOutCubic(transitionProgress)

    // 更新重型元素
    if (heavyRef.current) {
      heavyInstancesRef.current.forEach((instance, i) => {
        let targetPosition: THREE.Vector3

        if (currentState === TreeMorphState.SCATTERED) {
          targetPosition = instance.scatterPosition.clone()
          // 重型元素漂浮幅度小
          const drift = new THREE.Vector3(
            noise(time * 0.3 + i, 0, 0) * 0.05,
            noise(0, time * 0.3 + i, 0) * 0.05,
            noise(0, 0, time * 0.3 + i) * 0.05
          )
          targetPosition.add(drift)
        } else if (currentState === TreeMorphState.TEXT_SHAPE) {
          targetPosition = instance.textPosition
            ? instance.textPosition.clone()
            : instance.scatterPosition.clone().multiplyScalar(1.3)
        } else {
          targetPosition = instance.treePosition.clone()
        }

        // 重型元素响应滞后
        instance.currentPosition.lerp(
          targetPosition,
          (easedProgress * 0.1 + 0.03) * (1 / instance.weight!)
        )

        matrix.makeTranslation(
          instance.currentPosition.x,
          instance.currentPosition.y,
          instance.currentPosition.z
        )
        heavyRef.current!.setMatrixAt(i, matrix)
      })
      heavyRef.current.instanceMatrix.needsUpdate = true
    }

    // 更新轻型元素
    if (lightRef.current) {
      lightInstancesRef.current.forEach((instance, i) => {
        let targetPosition: THREE.Vector3

        if (currentState === TreeMorphState.SCATTERED) {
          targetPosition = instance.scatterPosition.clone()
          const drift = new THREE.Vector3(
            noise(time * 0.6 + i, 0, 0) * 0.1,
            noise(0, time * 0.6 + i, 0) * 0.1,
            noise(0, 0, time * 0.6 + i) * 0.1
          )
          targetPosition.add(drift)
        } else if (currentState === TreeMorphState.TEXT_SHAPE) {
          targetPosition = instance.textPosition
            ? instance.textPosition.clone()
            : instance.scatterPosition.clone().multiplyScalar(1.4)
        } else {
          targetPosition = instance.treePosition.clone()
        }

        instance.currentPosition.lerp(
          targetPosition,
          (easedProgress * 0.1 + 0.05) * (1 / instance.weight!)
        )

        matrix.makeTranslation(
          instance.currentPosition.x,
          instance.currentPosition.y,
          instance.currentPosition.z
        )
        lightRef.current!.setMatrixAt(i, matrix)
      })
      lightRef.current.instanceMatrix.needsUpdate = true
    }

    // 更新极轻元素
    if (tinyRef.current) {
      tinyInstancesRef.current.forEach((instance, i) => {
        let targetPosition: THREE.Vector3

        if (currentState === TreeMorphState.SCATTERED) {
          targetPosition = instance.scatterPosition.clone()
          // 极轻元素漂浮幅度大
          const drift = new THREE.Vector3(
            noise(time * 1.0 + i, 0, 0) * 0.15,
            noise(0, time * 1.0 + i, 0) * 0.15,
            noise(0, 0, time * 1.0 + i) * 0.15
          )
          targetPosition.add(drift)
        } else if (currentState === TreeMorphState.TEXT_SHAPE) {
          targetPosition = instance.textPosition
            ? instance.textPosition.clone()
            : instance.scatterPosition.clone().multiplyScalar(1.5)
        } else {
          targetPosition = instance.treePosition.clone()
        }

        instance.currentPosition.lerp(
          targetPosition,
          (easedProgress * 0.1 + 0.08) * (1 / instance.weight!)
        )

        matrix.makeTranslation(
          instance.currentPosition.x,
          instance.currentPosition.y,
          instance.currentPosition.z
        )
        tinyRef.current!.setMatrixAt(i, matrix)
      })
      tinyRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <instancedMesh
        ref={heavyRef}
        args={[heavyGeometry, heavyMaterial, HEAVY_COUNT]}
      />
      <instancedMesh
        ref={lightRef}
        args={[lightGeometry, lightMaterial, LIGHT_COUNT]}
      />
      <instancedMesh
        ref={tinyRef}
        args={[tinyGeometry, tinyMaterial, TINY_COUNT]}
      />
    </>
  )
}

