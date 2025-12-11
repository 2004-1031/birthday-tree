# 架构说明

## 整体架构

项目采用 React + TypeScript + React Three Fiber 架构，使用 Zustand 进行状态管理。

```
┌─────────────────────────────────────────┐
│           App.tsx (入口)                 │
│  ┌───────────────────────────────────┐  │
│  │      Scene.tsx (3D场景)           │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  FoliageSystem (针叶粒子)   │  │  │
│  │  │  OrnamentSystem (装饰物)    │  │  │
│  │  │  PhotoSystem (照片粒子)     │  │  │
│  │  │  PostProcessing (后期处理)  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │      Overlay.tsx (UI控制)         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      useStore (Zustand状态管理)         │
│  - currentState: TreeMorphState         │
│  - transitionProgress: number           │
│  - photos: File[]                       │
└─────────────────────────────────────────┘
```

## 核心系统

### 1. 状态管理系统 (`store/useStore.ts`)

使用 Zustand 管理全局状态：

- **TreeMorphState**: 枚举类型，定义三种形态
  - `SCATTERED`: 散落状态
  - `TEXT_SHAPE`: 文字形态
  - `TREE_SHAPE`: 圣诞树形态

- **状态字段**:
  - `currentState`: 当前形态
  - `transitionProgress`: 过渡进度 (0-1)
  - `isTransitioning`: 是否正在过渡
  - `photos`: 用户上传的照片列表

### 2. 多位置系统 (`hooks/useLayoutGenerator.ts`)

每个粒子实例实现 `MorphableInstance` 接口：

```typescript
interface MorphableInstance {
  scatterPosition: THREE.Vector3  // 散落状态位置
  textPosition: THREE.Vector3 | null  // 文字形态位置
  treePosition: THREE.Vector3  // 圣诞树形态位置
  currentPosition: THREE.Vector3  // 当前位置（插值结果）
  weight?: number  // 受力权重
}
```

**布局生成器**:
- `useFoliageLayout`: 生成针叶粒子布局
- `useOrnamentLayout`: 生成装饰物布局（重型/轻型/极轻）
- `usePhotoLayout`: 生成照片粒子布局

### 3. 粒子系统

#### 3.1 针叶粒子系统 (`FoliageSystem.tsx`)

- **技术**: `THREE.Points` + 自定义 `ShaderMaterial`
- **数量**: 5000+ 粒子
- **特性**:
  - 深绿色主色 + 金色边缘高亮
  - 基于时间的噪声实现呼吸感
  - 状态切换时平滑插值

#### 3.2 装饰物系统 (`OrnamentSystem.tsx`)

- **技术**: `InstancedMesh` 优化渲染
- **分类**:
  - **重型** (20个): 礼物盒，权重 3.0，漂浮幅度小
  - **轻型** (100个): 彩球，权重 1.5，金属反射
  - **极轻** (200个): 小灯点，权重 0.5，高发光

#### 3.3 照片粒子系统 (`PhotoSystem.tsx`)

- **技术**: `THREE.Mesh` + `PlaneGeometry`
- **特性**:
  - 动态加载用户上传的图片纹理
  - Billboard 效果（始终面向相机）
  - 在树形态时沿环轨道旋转
  - 金色边缘光晕

### 4. 文本生成系统 (`utils/textSampler.ts`)

使用 Canvas 2D API 将文本栅格化：

1. 在离屏 Canvas 上绘制文本
2. 采样像素数据
3. 转换为 3D 点云位置
4. 可添加 Z 轴厚度形成伪 3D 效果

**函数**:
- `generateTextPositions`: 将文本转换为点云
- `addTextThickness`: 为文字添加厚度

### 5. 动画系统

#### 状态切换动画

在 `Scene.tsx` 中实现：

```typescript
useEffect(() => {
  setIsTransitioning(true)
  setTransitionProgress(0)
  
  const duration = 2000 // 2秒
  const animate = () => {
    const progress = Math.min(elapsed / duration, 1)
    setTransitionProgress(progress)
    // ...
  }
}, [currentState])
```

#### 位置插值

每个系统在 `useFrame` 中更新：

```typescript
useFrame(() => {
  const targetPosition = getTargetPosition(currentState)
  instance.currentPosition.lerp(targetPosition, lerpSpeed)
})
```

使用 `easeInOutCubic` 缓动函数实现平滑过渡。

### 6. 后期处理 (`PostProcessing.tsx`)

使用 `@react-three/postprocessing`:

- **Bloom**: 辉光效果，增强金属质感
  - 强度: 1.5
  - 阈值: 0.85
  - 半径: 0.4

- **Vignette**: 暗角效果，增强电影感

## 数据流

```
用户操作 (Overlay)
    │
    ▼
状态更新 (useStore.setState)
    │
    ▼
触发过渡动画 (Scene.tsx useEffect)
    │
    ▼
更新 transitionProgress (0 → 1)
    │
    ▼
各系统 useFrame 读取状态
    │
    ▼
计算目标位置 (根据 currentState)
    │
    ▼
插值更新 currentPosition
    │
    ▼
更新渲染缓冲区
    │
    ▼
Three.js 渲染
```

## 性能优化

1. **InstancedMesh**: 装饰物使用实例化渲染，减少 draw call
2. **Points**: 针叶粒子使用 Points 而非 Mesh，性能更好
3. **useMemo**: 几何体和材质使用 useMemo 缓存
4. **useRef**: 实例数据使用 useRef 避免重复计算
5. **后期处理**: 仅在需要时启用 Bloom

## 扩展性

### 添加新状态

1. 在 `TreeMorphState` 枚举中添加新状态
2. 在 `MorphableInstance` 中添加对应的位置字段
3. 在布局生成器中计算新位置
4. 在各系统的 `useFrame` 中添加状态处理逻辑

### 添加新粒子类型

1. 创建新的系统组件（如 `NewParticleSystem.tsx`）
2. 使用 `useLayoutGenerator` 生成布局
3. 在 `Scene.tsx` 中引入并渲染
4. 实现状态切换逻辑

## 注意事项

1. **内存管理**: 照片纹理和几何体需要正确 dispose
2. **性能**: 粒子数量需要根据设备性能调整
3. **状态同步**: 确保所有系统读取相同的状态值
4. **动画时机**: 过渡动画需要在状态变化时重新启动

