import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    // Relative base so the bundle works regardless of deploy path
    // (e.g. served from /visuallearn/admin-react/dist/)
    base: './',
    server: { port: 5175, open: true },
});
