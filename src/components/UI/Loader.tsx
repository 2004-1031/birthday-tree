import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

// 在Canvas内部使用的Loader组件
export function CanvasLoader() {
  const { progress, active } = useProgress()

  if (!active || progress === 100) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        color: '#ffd700',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>
          Loading...
        </div>
        <div
          style={{
            width: '300px',
            height: '6px',
            background: '#003b30',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid #ffd700',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffd700, #ffed4e)',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px #ffd700',
            }}
          />
        </div>
        <div style={{ marginTop: '15px', fontSize: '16px', fontWeight: 'bold' }}>
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  )
}

// 在Canvas外部使用的Loader组件（用于Suspense fallback）
export function Loader() {
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 模拟加载进度
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsLoading(false), 500)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  if (!isLoading) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        color: '#ffd700',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>
          Loading...
        </div>
        <div
          style={{
            width: '300px',
            height: '6px',
            background: '#003b30',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid #ffd700',
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ffd700, #ffed4e)',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px #ffd700',
            }}
          />
        </div>
        <div style={{ marginTop: '15px', fontSize: '16px', fontWeight: 'bold' }}>
          {Math.round(Math.min(progress, 100))}%
        </div>
      </div>
    </div>
  )
}

