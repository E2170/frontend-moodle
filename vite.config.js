import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // /api ile başlayan tüm istekleri Moodle sunucusuna yönlendir
      '/api': {
        target: 'https://moodle.argeyazilim.tr',
        changeOrigin: true,
        secure: false, // SSL sertifika hatalarını göz ardı et
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // WAF ve CSRF korumalarını aşmak için Origin ve Referer Moodle ile aynı yapılmalı
            proxyReq.setHeader('Origin', 'https://moodle.argeyazilim.tr');
            proxyReq.setHeader('Referer', 'https://moodle.argeyazilim.tr' + req.url.replace(/^\/api/, ''));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[ProxyRes] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
            if (proxyRes.headers['set-cookie']) {
              console.log(`[ProxyRes] Orijinal Set-Cookie:`, proxyRes.headers['set-cookie']);
            }
            
            // iframe içinde açılabilmesi için güvenlik başlıklarını kaldır
            delete proxyRes.headers['x-frame-options'];
            delete proxyRes.headers['content-security-policy'];
            
            // Moodle redirect'lerini yakalayıp proxy (/api) üzerinden devam ettir
            let location = proxyRes.headers['location'];
            if (location) {
              if (location.startsWith('https://moodle.argeyazilim.tr')) {
                proxyRes.headers['location'] = location.replace('https://moodle.argeyazilim.tr', '/api');
              } else if (location.startsWith('/')) {
                // Göreceli URL'leri (Relative URL) yakala
                proxyRes.headers['location'] = '/api' + location;
              }
            }

            // HTTP (localhost) ortamında cookie'nin silinmemesi için 'secure' ve 'domain' bayraklarını kaldır
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
                let newCookie = cookie.replace(/;\s*secure/i, '');
                newCookie = newCookie.replace(/;\s*Domain=[^;]+/i, '');
                newCookie = newCookie.replace(/;\s*SameSite=None/i, '; SameSite=Lax');
                return newCookie;
              });
              console.log(`[ProxyRes] Modifiye Set-Cookie:`, proxyRes.headers['set-cookie']);
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[ProxyReq] İstek: ${req.url} | Cookie: ${proxyReq.getHeader('cookie') || 'YOK'}`);
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');
            
            // Moodle'ın "sadece mobil uygulamadan erişilebilir" kısıtlamasını aşmak için (Sadece API/Autologin isteklerinde):
            if (req.url.includes('server.php') || req.url.includes('autologin.php')) {
              const originalUserAgent = proxyReq.getHeader('user-agent') || '';
              proxyReq.setHeader('user-agent', originalUserAgent + ' MoodleMobile');
            }

            // Token endpoint'i için cookie gönderme (bozuk MoodleSession 500'e yol açıyor)
            if (req.url.includes('/login/token.php')) {
              proxyReq.removeHeader('Cookie');
            }
          });
        }
      }
    }
  }
})