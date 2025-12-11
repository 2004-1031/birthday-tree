import { useRef, useState } from 'react'
import { useStore, TreeMorphState } from '../../store/useStore'

export function Overlay() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentState, setState, photos, addPhoto, removePhoto } = useStore()
  const [isHovered, setIsHovered] = useState(false)

  const handleStateChange = (newState: TreeMorphState) => {
    if (newState !== currentState) {
      setState(newState)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          addPhoto(file)
        }
      })
    }
    // 重置input以便可以再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    removePhoto(index)
  }

  const states = [
    { key: TreeMorphState.SCATTERED, label: '散落', icon: '✨' },
    { key: TreeMorphState.TEXT_SHAPE, label: '文字', icon: '🎂' },
    { key: TreeMorphState.TREE_SHAPE, label: '圣诞树', icon: '🎄' },
  ]

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* 状态切换按钮 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          pointerEvents: 'auto',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {states.map((state) => (
          <button
            key={state.key}
            onClick={() => handleStateChange(state.key)}
            style={{
              padding: '12px 24px',
              background:
                currentState === state.key
                  ? 'rgba(255, 215, 0, 0.3)'
                  : 'rgba(0, 59, 48, 0.7)',
              border: `2px solid ${
                currentState === state.key ? '#ffd700' : '#003b30'
              }`,
              borderRadius: '8px',
              color: '#ffd700',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (currentState !== state.key) {
                e.currentTarget.style.background = 'rgba(0, 59, 48, 0.9)'
              }
            }}
            onMouseLeave={(e) => {
              if (currentState !== state.key) {
                e.currentTarget.style.background = 'rgba(0, 59, 48, 0.7)'
              }
            }}
          >
            <span>{state.icon}</span>
            <span>{state.label}</span>
          </button>
        ))}
      </div>

      {/* 照片上传区域 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          pointerEvents: 'auto',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '12px 24px',
            background: 'rgba(0, 59, 48, 0.7)',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            color: '#ffd700',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📷</span>
          <span>上传照片</span>
        </button>

        {/* 已上传的照片列表 */}
        {photos.length > 0 && (
          <div
            style={{
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {photos.map((photo, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(0, 59, 48, 0.7)',
                  border: '1px solid #ffd700',
                  borderRadius: '6px',
                  color: '#ffd700',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  maxWidth: '300px',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {photo.name}
                </span>
                <button
                  onClick={() => handleRemovePhoto(index)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffd700',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 说明文字 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          pointerEvents: 'auto',
          background: 'rgba(0, 59, 48, 0.7)',
          border: '1px solid #ffd700',
          borderRadius: '8px',
          padding: '12px',
          color: '#ffd700',
          fontSize: '12px',
          backdropFilter: 'blur(10px)',
          maxWidth: '250px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          操作说明
        </div>
        <div>• 点击上方按钮切换形态</div>
        <div>• 鼠标拖拽旋转视角</div>
        <div>• 滚轮缩放</div>
        <div>• 上传照片参与动画</div>
      </div>
    </div>
  )
}

