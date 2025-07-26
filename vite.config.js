import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/idle-dungeon-crawler/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.1'),
    __IS_PRODUCTION__: JSON.stringify(process.env.NODE_ENV === 'production')
  }
})
