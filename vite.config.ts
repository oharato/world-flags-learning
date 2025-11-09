import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    assetsInlineLimit: 0, // 画像をインライン化せず、常に別ファイルとして出力（キャッシュ効率化）
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 画像ファイルを適切なディレクトリに配置
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|webp)$/i)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
})
