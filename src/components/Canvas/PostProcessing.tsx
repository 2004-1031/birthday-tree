import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export function PostProcessing() {
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

