import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

// 检测是否为移动设备
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768) ||
         ('ontouchstart' in window)
}

export function PostProcessing() {
  const mobile = isMobile()
  
  // 移动设备：降低后期处理效果以提升性能
  if (mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.0}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.5}
          height={200}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.3} />
      </EffectComposer>
    )
  }
  
  // 桌面设备：完整效果
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.4}
        height={300}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  )
}

