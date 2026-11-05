// Playwright: levanta el backend real (SQLite en un archivo temporal, motor de reglas) y la app web
// exportada, y corre las pruebas con Chromium. Antes hay que exportar la web:
//   cd ../frontend && npx expo export --platform web
const os = require('node:os');
const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const DB = path.join(os.tmpdir(), `talklate-e2e-web-${Date.now()}.db`);

module.exports = defineConfig({
  testDir: './pruebas',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reporte' }]],
  use: {
    baseURL: 'http://127.0.0.1:8090',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.CHROME ? { executablePath: process.env.CHROME } : {},
  },
  projects: [{ name: 'chromium-movil', use: { ...devices['Pixel 7'], browserName: 'chromium' } }],
  webServer: [
    {
      command: 'node src/server.js',
      cwd: path.join(__dirname, '..', 'backend'),
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: '3000', DB_DRIVER: 'sqlite', TALKLATE_DB: DB, JWT_SECRET: 'secreto-e2e-web', TRADUCTOR: 'local',
        TALKLATE_LOGS: 'silencio', CORREO_MODO: 'consola', VOZ_MOTOR: 'ninguno', CORS_ORIGENES: 'http://127.0.0.1:8090',
      },
    },
    { command: 'node servir-web.js ../frontend/dist 8090', url: 'http://127.0.0.1:8090', reuseExistingServer: !process.env.CI },
  ],
});
