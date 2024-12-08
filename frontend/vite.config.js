import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss';

// https://vite.dev/config/

import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: '/',
    plugins: [react()],
      css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    server: {    
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000  
      port: env.VITE_SERVE||3000, 
  }
}})