import { Suspense } from 'react'
import { Scene } from './components/Canvas/Scene'
import { Overlay } from './components/UI/Overlay'
import { Loader } from './components/UI/Loader'

function App() {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <Scene />
      </Suspense>
      <Overlay />
      {/* 移除重复的 Loader，LoadingOverlay 已经在 Scene 内部处理了 */}
    </>
  )
}

export default App

