# Arix Signature Interactive Christmas Tree

一个高保真 3D Web 交互项目，实现了一个可以在三种形态之间平滑切换的奢华圣诞树。

## ✨ 特性

- **三种形态切换**：
  - **SCATTERED（散落）**：所有元素在空间中无序漂浮
  - **TEXT_SHAPE（文字）**：粒子聚合形成 "Happy Birthday to Jingjing" 文字轮廓
  - **TREE_SHAPE（圣诞树）**：所有元素收拢为圣诞树圆锥体

- **丰富的粒子系统**：
  - 针叶粒子层（5000+ 粒子，自定义 Shader 材质）
  - 装饰物系统（礼物盒、彩球、小灯点，使用 InstancedMesh 优化）
  - 照片粒子系统（支持用户上传照片参与动画）

- **视觉效果**：
  - 深祖母绿 (#003b30) + 高亮金属金配色
  - Bloom 后期处理营造电影感辉光
  - 平滑的状态过渡动画
  - 粒子呼吸感和轻微抖动

- **交互控制**：
  - 状态切换按钮
  - 照片上传功能
  - OrbitControls 相机控制

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
npm run build
```

## 🌐 部署到 GitHub Pages

想要将项目部署到 GitHub 让其他人访问？请查看 [DEPLOY.md](./DEPLOY.md) 获取详细的部署指南。

**快速部署步骤**：

1. **创建 GitHub 仓库并上传代码**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. **启用 GitHub Pages**：
   - 进入仓库 Settings > Pages
   - Source 选择 "GitHub Actions"
   - 保存后会自动部署

3. **访问网站**：
   - 部署完成后，网站将在 `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/` 可用

详细说明请参考 [DEPLOY.md](./DEPLOY.md)

## 📁 项目结构

```
src/
├── App.tsx                    # 主应用入口
├── main.tsx                   # React 入口
├── components/
│   ├── Canvas/
│   │   ├── Scene.tsx          # 主场景（整合所有系统）
│   │   ├── FoliageSystem.tsx  # 针叶粒子系统
│   │   ├── OrnamentSystem.tsx # 装饰物系统
│   │   ├── PhotoSystem.tsx    # 照片粒子系统
│   │   └── PostProcessing.tsx # 后期处理效果
│   └── UI/
│       ├── Overlay.tsx        # UI 控制层
│       └── Loader.tsx         # 加载器
├── store/
│   └── useStore.ts           # Zustand 状态管理
├── hooks/
│   └── useLayoutGenerator.ts # 布局生成器（位置计算）
└── utils/
    ├── math.ts               # 数学工具函数
    └── textSampler.ts        # 文本采样工具
```

## 🎮 使用说明

### 状态切换

点击顶部三个按钮可以在三种形态之间切换：
- **✨ 散落**：所有元素随机漂浮
- **🎂 文字**：粒子形成生日祝福文字
- **🎄 圣诞树**：元素聚合为圣诞树形状

### 照片上传

1. 点击左下角 "📷 上传照片" 按钮
2. 选择一张或多张图片
3. 照片将作为特殊粒子参与所有状态的变化：
   - **散落状态**：照片随机漂浮
   - **文字状态**：照片围绕文字或占据关键位置
   - **圣诞树状态**：照片在树周围的环轨道上缓慢旋转

### 相机控制

- **鼠标拖拽**：旋转视角
- **滚轮**：缩放
- **右键拖拽**：平移（如果启用）

## 🏗️ 架构说明

### 状态管理

使用 Zustand 管理全局状态：
- `TreeMorphState`：当前形态状态
- `transitionProgress`：过渡动画进度（0-1）
- `photos`：用户上传的照片列表

### 多位置系统

每个粒子实例（`MorphableInstance`）包含三套坐标：
- `scatterPosition`：散落状态的随机位置
- `textPosition`：文字形态的位置（可能为 null）
- `treePosition`：圣诞树形态的位置

状态切换时，通过线性插值（lerp）平滑过渡。

### 粒子系统

1. **针叶粒子**（FoliageSystem）：
   - 使用 `THREE.Points` + 自定义 `ShaderMaterial`
   - 支持颜色渐变和边缘高亮
   - 添加时间噪声实现呼吸感

2. **装饰物**（OrnamentSystem）：
   - 使用 `InstancedMesh` 优化性能
   - 三类元素：重型（礼物盒）、轻型（彩球）、极轻（灯点）
   - 不同权重影响漂浮幅度和响应速度

3. **照片粒子**（PhotoSystem）：
   - 动态加载用户上传的图片纹理
   - Billboard 效果（始终面向相机）
   - 在树形态时沿环轨道旋转

### 文本生成

使用 Canvas 2D API 将文本栅格化，然后采样为 3D 点云：
- 支持自定义字体、大小
- 可添加 Z 轴厚度形成伪 3D 效果
- 点密度可调

### 后期处理

使用 `@react-three/postprocessing`：
- **Bloom**：辉光效果，增强金属质感
- **Vignette**：暗角效果，增强电影感

## 🎨 设计理念

- **配色**：深祖母绿 (#003b30) 作为主色，金色 (#ffd700) 作为强调色
- **质感**：高金属度、低粗糙度的材质，配合 Bloom 营造奢华感
- **动画**：使用缓动函数（easeInOutCubic）实现平滑过渡
- **性能**：使用 InstancedMesh 和 Points 优化大量粒子的渲染

## 🔧 技术栈

- **React 19**：UI 框架
- **TypeScript**：类型安全
- **React Three Fiber**：Three.js 的 React 封装
- **@react-three/drei**：Three.js 工具库
- **@react-three/postprocessing**：后期处理效果
- **Zustand**：轻量级状态管理
- **Vite**：构建工具

## 📝 许可证

MIT License

## 🙏 致谢

感谢 Three.js 社区和 React Three Fiber 团队提供的优秀工具。

