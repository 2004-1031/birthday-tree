# 快速开始指南

## 安装步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **访问应用**
   打开浏览器访问 `http://localhost:3000`

## 功能测试

### 1. 状态切换测试
- 点击顶部三个按钮（✨ 散落、🎂 文字、🎄 圣诞树）
- 观察粒子在不同形态之间的平滑过渡
- 每个状态切换动画持续约 2 秒

### 2. 照片上传测试
- 点击左下角 "📷 上传照片" 按钮
- 选择一张或多张图片（支持 JPG、PNG 等格式）
- 观察照片作为粒子参与动画：
  - **散落状态**: 照片随机漂浮
  - **文字状态**: 照片围绕文字或占据关键位置
  - **圣诞树状态**: 照片在树周围的环轨道上旋转

### 3. 相机控制测试
- **鼠标左键拖拽**: 旋转视角
- **滚轮**: 缩放场景
- 尝试从不同角度观察三种形态

## 性能调优

如果遇到性能问题，可以调整以下参数：

### 减少粒子数量
编辑 `src/components/Canvas/FoliageSystem.tsx`:
```typescript
const FOLIAGE_COUNT = 3000 // 从 5000 减少到 3000
```

编辑 `src/components/Canvas/OrnamentSystem.tsx`:
```typescript
const HEAVY_COUNT = 15  // 从 20 减少
const LIGHT_COUNT = 70  // 从 100 减少
const TINY_COUNT = 150  // 从 200 减少
```

### 禁用后期处理
如果性能仍然不足，可以临时禁用 Bloom 效果：
编辑 `src/components/Canvas/PostProcessing.tsx`，注释掉 Bloom 组件。

## 常见问题

### Q: 文字显示不清晰？
A: 调整 `src/utils/textSampler.ts` 中的参数：
- 增加 `fontSize`
- 增加 `pointDensity`
- 调整 `width` 和 `height`

### Q: 照片不显示？
A: 检查：
1. 照片格式是否支持（JPG、PNG）
2. 浏览器控制台是否有错误
3. 照片文件大小是否过大（建议 < 5MB）

### Q: 动画卡顿？
A: 
1. 减少粒子数量（见上方性能调优）
2. 降低浏览器窗口分辨率
3. 关闭其他占用 GPU 的应用

## 开发建议

1. **使用 Chrome DevTools** 监控性能
2. **React DevTools** 检查组件渲染
3. **Three.js Inspector** 调试 3D 场景（如果安装了相关插件）

## 下一步

- 自定义文字内容（修改 `useLayoutGenerator.ts` 中的文本）
- 调整配色方案（修改各系统中的颜色值）
- 添加音效（在状态切换时播放）
- 导出为静态图片或视频

