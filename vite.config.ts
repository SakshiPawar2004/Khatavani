import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ['ledgerbook-zl4s.onrender.com', 'khatavani.onrender.com']
  }
});
