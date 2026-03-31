import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://mesto.nomoreparties.co',
        changeOrigin: true,
        // НЕ используем rewrite, сохраняем полный путь
        // rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Добавляем правильный путь
            const originalUrl = req.url;
            // Заменяем /api на /v1/apf-cohort-202
            const newUrl = originalUrl.replace('/api', '/v1/apf-cohort-202');
            proxyReq.path = newUrl;
            console.log('🔄 Прокси:', originalUrl, '->', newUrl);
          });
        },
      },
    },
  },
  base: './',
});
