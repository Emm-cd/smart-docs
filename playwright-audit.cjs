// playwright-audit.cjs
const { chromium } = require('playwright');
const { playAudit } = require('playwright-lighthouse');
const fs = require('fs');
const path = require('path');

// ─── CONFIGURACIÓN DE TU PROYECTO ─────────────────────────────
const BASE_URL = 'https://smart-docs-amber.vercel.app';
const OUTPUT_DIR = './lighthouse-reports';

// Ajusta con credenciales reales para el login
const USER_EMAIL = 'tu_correo@ejemplo.com';
const USER_PASSWORD = 'tu_password';

// Mapeo exacto basado en la estructura de tu carpeta 'app/'
const PAGINAS = [
  //RUTAS PÚBLICAS
  { ruta: '/login',             nombre: 'login',             requiereAuth: false },
  { ruta: '/registro',          nombre: 'registro',          requiereAuth: false },
  { ruta: '/update-password',   nombre: 'update-password',   requiereAuth: false },
  { ruta: '/aviso-privacidad',  nombre: 'aviso-privacidad',  requiereAuth: false },
  { ruta: '/politica-privacidad', nombre: 'politica-privacidad', requiereAuth: false },

  //RUTAS PROTEGIDAS: USUARIO
  { ruta: '/usuario',              nombre: 'usuario-dashboard',    requiereAuth: true },
  { ruta: '/usuario/chat',         nombre: 'usuario-chat',         requiereAuth: true },
  { ruta: '/usuario/documentos',   nombre: 'usuario-documentos',   requiereAuth: true },
  { ruta: '/usuario/tickets',      nombre: 'usuario-tickets',      requiereAuth: true },
  { ruta: '/usuario/configuracion',nombre: 'usuario-configuracion',requiereAuth: true },

  //RUTAS PROTEGIDAS: ADMIN
  { ruta: '/admin',              nombre: 'admin-dashboard',      requiereAuth: true },
  { ruta: '/admin/usuarios',     nombre: 'admin-usuarios',       requiereAuth: true },
  { ruta: '/admin/documentos',   nombre: 'admin-documentos',     requiereAuth: true },
  { ruta: '/admin/tickets',      nombre: 'admin-tickets',        requiereAuth: true },
  { ruta: '/admin/configuracion',nombre: 'admin-configuracion',  requiereAuth: true },
];

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function ejecutarAuditoria() {
  console.log('Iniciando auditoría con Playwright + Lighthouse...');
  console.log(`URL objetivo: ${BASE_URL}\n`);

  const PORT = 9222;

  // Lanzar Chromium con el puerto de depuración habilitado
  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${PORT}`, '--no-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  //1. AUTENTICACIÓN
  console.log('Realizando inicio de sesión...');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Rellenar formulario de login
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    
    // Clic en submit
    await page.click('button[type="submit"]');

    // Esperar a que se complete la redirección tras el login
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Sesión iniciada con éxito.\n');
  } catch (err) {
    console.warn('Nota sobre login:', err.message);
  }

  //2. EJECUCIÓN DE AUDITORÍAS
  for (const pagina of PAGINAS) {
    const url = `${BASE_URL}${pagina.ruta}`;
    const tipo = pagina.requiereAuth ? 'PROTEGIDA' : 'PÚBLICA';
    
    console.log(`Auditando [${tipo}]: ${pagina.ruta}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      await playAudit({
        page: page,
        port: PORT,
        thresholds: {
          performance: 50,
          accessibility: 80,
          'best-practices': 80,
        },
        reports: {
          formats: { html: true, json: true },
          name: `lighthouse-${pagina.nombre}`,
          directory: OUTPUT_DIR,
        },
        opts: {
          chromeFlags: ['--headless'],
        },
      });

      console.log(`Reporte guardado: ${OUTPUT_DIR}/lighthouse-${pagina.nombre}.report.html\n`);
    } catch (err) {
      console.error(`Error auditando ${pagina.ruta}:`, err.message);
    }
  }

  await browser.close();
  console.log('Auditoría finalizada. Revisa los reportes en ./lighthouse-reports');
}

ejecutarAuditoria();