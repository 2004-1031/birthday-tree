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
      <Loader />
    </>
  )
}

export default App

