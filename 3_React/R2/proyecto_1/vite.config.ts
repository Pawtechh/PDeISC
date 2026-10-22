import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Configuración de Vite:
//  - plugin react: habilita JSX y React.
//  - plugin tailwindcss: habilita Tailwind CSS v4 (sin archivo de config manual).
//  - server.port: fuerza el puerto 3000.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
  },
})
