import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADD THIS 'define' BLOCK ---
  define: {
    // This replaces any occurrence of 'global' in the code with 'window',
    // which fixes the issue with the 'sockjs-client' library.
    global: 'window',
  },
  // --------------------------------
})