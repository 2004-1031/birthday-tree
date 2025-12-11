import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // 允许网络访问，其他设备可以通过局域网 IP 访问
    open: true,
    // 优化 HMR 性能
    hmr: {
      overlay: true
    }
  },
  // 支持 GitHub Pages 部署
  base: '/birthday-tree/',
  build: {
    // 优化构建输出
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // 代码分割策略：确保依赖关系正确
          if (id.indexOf('node_modules') !== -1) {
            // Three.js 核心 - 独立分割（不依赖 React）
            if (id.indexOf('three') !== -1 && id.indexOf('@react-three') === -1) {
              return 'three-core'
            }
            // 所有其他库（包括 React、@react-three、zustand 等）
            // 都放在一个 vendor chunk 中，确保依赖关系正确
            // 这样可以避免 chunk 加载顺序导致的依赖问题
            return 'vendor'
          }
        },
        // 优化 chunk 文件命名，便于缓存
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 启用压缩 - 使用更激进的压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // 移除特定函数
        passes: 2, // 多次压缩以获得更好的压缩率
      },
      format: {
        comments: false, // 移除注释
      },
    },
    // 增加 chunk 大小限制
    chunkSizeWarningLimit: 600, // 降低警告阈值，提醒优化
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 禁用 sourcemap 以减少文件大小和提高性能
    sourcemap: false,
    // 优化目标浏览器，减小输出文件
    target: 'es2015',
    // 提高构建性能
    reportCompressedSize: true, // 启用以监控文件大小
    // 压缩资产
    assetsInlineLimit: 4096, // 小于 4KB 的资源内联为 base64
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'zustand',
    ],
    // 强制预构建，提高首次加载速度
    force: false,
  },
})

