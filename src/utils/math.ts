import * as THREE from 'three'

/**
 * 缓动函数 - 平滑的ease-in-out
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * 缓动函数 - 弹性效果
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/**
 * 线性插值
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * 向量线性插值
 */
export function lerpVector(
  start: THREE.Vector3,
  end: THREE.Vector3,
  t: number
): THREE.Vector3 {
  return start.clone().lerp(end, t)
}

/**
 * 在球体内生成随机点
 */
export function randomPointInSphere(radius: number): THREE.Vector3 {
  const u = Math.random()
  const v = Math.random()
  const theta = u * 2.0 * Math.PI
  const phi = Math.acos(2.0 * v - 1.0)
  const r = Math.cbrt(Math.random()) * radius
  const sinTheta = Math.sin(theta)
  const cosTheta = Math.cos(theta)
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const x = r * sinPhi * cosTheta
  const y = r * sinPhi * sinTheta
  const z = r * cosPhi
  return new THREE.Vector3(x, y, z)
}

/**
 * 在圆锥体上生成点（用于圣诞树形状）
 */
export function pointOnCone(
  height: number,
  baseRadius: number,
  topRadius: number,
  t: number, // 0-1, 从顶部到底部
  angle: number // 0-2π, 围绕圆锥的角度
): THREE.Vector3 {
  const y = height * (1 - t)
  const radius = lerp(topRadius, baseRadius, t)
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  return new THREE.Vector3(x, y, z)
}

/**
 * 噪声函数（简化版）
 */
export function noise(x: number, y: number, z: number): number {
  // 简化的3D噪声
  return (
    Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.sin(z * 0.1) +
    Math.sin(x * 0.05) * Math.cos(y * 0.05) * Math.sin(z * 0.05) * 0.5
  )
}

/**
 * 在环带上生成点（用于照片粒子在树周围的轨道）
 */
export function pointOnOrbit(
  center: THREE.Vector3,
  radius: number,
  height: number,
  angle: number
): THREE.Vector3 {
  return new THREE.Vector3(
    center.x + Math.cos(angle) * radius,
    center.y + height,
    center.z + Math.sin(angle) * radius
  )
}

