import { useProgress, Html } from '@react-three/drei'

export function LoadingOverlay() {
  const { progress, active } = useProgress()

  if (!active || progress === 100) return null

  return (
    <Html center>
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
    </Html>
  )
}

