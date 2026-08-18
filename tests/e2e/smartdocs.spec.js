// tests/e2e/smartdocs.spec.js
// Suite de pruebas de integración — SAAS-DOCS
// Compatible con Localhost y Vercel (soporta Protection Bypass de Vercel)

import { test, expect } from '@playwright/test';
import path from 'path';
import fs   from 'fs';

const TEST_EMAIL    = 'test@smartdocs.dev';
const TEST_PASSWORD = 'TestPassword123!';

// Carpeta donde se guardarán los screenshots de evidencia
const SCREENSHOTS_DIR = path.join('test-results', 'screenshots-evidencia');

// Crear la carpeta si no existe
test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
});

// Helper para tomar screenshot con nombre descriptivo
async function capturar(page, nombre) {
  const filePath = path.join(SCREENSHOTS_DIR, `${nombre}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  // También adjunta la captura al reporte HTML de Playwright
  await test.info().attach(nombre, {
    path:        filePath,
    contentType: 'image/png',
  });
}

// ─────────────────────────────────────────────────────────────
// BLOQUE 1: Flujo de Autenticación
// ─────────────────────────────────────────────────────────────
test.describe('Flujo de Autenticación', () => {

  test('Login exitoso redirige al dashboard de usuario', async ({ page }) => {
    // 1. Navegar a /login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await capturar(page, '01-login-pagina-inicial');

    // 2. Verificar encabezado
    await expect(page.getByRole('heading', { name: 'Acceso al Sistema' })).toBeVisible();

    // 3. Llenar el formulario
    await page.getByRole('textbox', { name: 'Correo Electrónico' }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(TEST_PASSWORD);
    await capturar(page, '02-login-formulario-lleno');

    // 4. Hacer clic en el botón de login
    await page.getByRole('button', { name: 'Ingresar al Panel' }).click();

    // 5. Esperar redirección y capturar dashboard
    await expect(page).toHaveURL(/\/usuario/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    await capturar(page, '03-dashboard-usuario-cargado');

    // 6. Verificar bienvenida
    await expect(page.getByText(/bienvenid/i)).toBeVisible({ timeout: 10_000 });
  });

  test('Login con campos vacíos muestra validación', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Intentar login sin datos
    await page.getByRole('button', { name: 'Ingresar al Panel' }).click();
    await capturar(page, '04-login-validacion-campos-vacios');

    await expect(
      page.getByText('Por favor completa todos los')
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Login con credenciales incorrectas no redirige al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: 'Correo Electrónico' }).fill('falso@noexiste.com');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('ContraseñaMala999!');
    await capturar(page, '05-login-credenciales-incorrectas-antes-de-enviar');

    await page.getByRole('button', { name: 'Ingresar al Panel' }).click();
    await page.waitForTimeout(4000);
    await capturar(page, '06-login-credenciales-incorrectas-resultado');

    await expect(page).not.toHaveURL(/\/usuario/);
  });

  test('Usuario no autenticado es redirigido al login desde /usuario', async ({ page }) => {
    await page.goto('/usuario');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await capturar(page, '07-redireccion-usuario-a-login');
  });

  test('Usuario no autenticado es redirigido al login desde /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await capturar(page, '08-redireccion-admin-a-login');
  });

});

// ─────────────────────────────────────────────────────────────
// BLOQUE 2: Flujo de Registro
// ─────────────────────────────────────────────────────────────
test.describe('Flujo de Registro', () => {

  test('La página de registro carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: 'Regístrate aquí' }).click();
    await expect(page).toHaveURL(/\/registro/, { timeout: 8_000 });
    await page.waitForLoadState('networkidle');
    await capturar(page, '09-registro-pagina-cargada');
  });

  test('Formulario de registro tiene todos los campos requeridos', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    await capturar(page, '10-registro-campos-visibles');

    await expect(page.getByRole('textbox', { name: 'Correo Electrónico' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('textbox', { name: 'Apellido' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Usuario (@)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Siguiente →' })).toBeVisible();
  });

  test('Registro sin datos muestra mensajes de validación', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Siguiente →' }).click();
    await capturar(page, '11-registro-validacion-campos-vacios');

    await expect(page.getByText('Email requerido')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Usuario requerido')).toBeVisible();
  });

  test('Desde registro se puede volver al login', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    await capturar(page, '12-registro-pagina-con-link-login');

    await page.getByRole('link', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    await page.waitForLoadState('networkidle');
    await capturar(page, '13-regreso-a-login-desde-registro');

    await expect(page.getByRole('heading', { name: 'Acceso al Sistema' })).toBeVisible();
  });

  test('Página de registro es accesible sin autenticación', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    await capturar(page, '14-registro-accesible-sin-auth');

    await expect(page).not.toHaveURL(/\/login/);
  });

});

// ─────────────────────────────────────────────────────────────
// BLOQUE 3: Integración con API Routes
// Los endpoints protegidos deben rechazar el acceso sin sesión.
// Aceptamos cualquier respuesta de rechazo: 401, 403, 404 o >= 300.
// ─────────────────────────────────────────────────────────────
test.describe('Integración con API Routes', () => {

  test('API de chat no sirve datos sin sesión activa', async ({ request }) => {
    // Se usa ruta relativa para respetar la baseURL (Vercel o localhost)
    const response = await request.post('/api/chat', {
      headers: { 'Content-Type': 'application/json' },
      data: { mensaje: 'Hola', historial: [] },
    });

    const status = response.status();

    await test.info().attach('api-chat-sin-sesion-respuesta', {
      body: Buffer.from(JSON.stringify({
        endpoint:  'POST /api/chat',
        status,
        protegido: status !== 200,
      }, null, 2)),
      contentType: 'application/json',
    });

    expect(status).not.toBe(200);
    // Vercel o Next.js pueden devolver 401, 403, 404 o 307
    expect([401, 403, 404]).toContain(status) || expect(status).toBeGreaterThanOrEqual(300);
  });

  test('API de documentos no permite eliminación sin sesión', async ({ request }) => {
    const response = await request.delete(
      '/api/ocr/documentos/00000000-0000-0000-0000-000000000000'
    );

    const status = response.status();

    await test.info().attach('api-delete-sin-sesion-respuesta', {
      body: Buffer.from(JSON.stringify({
        endpoint:  'DELETE /api/ocr/documentos/:id',
        status,
        protegido: status !== 200,
      }, null, 2)),
      contentType: 'application/json',
    });

    expect(status).not.toBe(200);
    expect([401, 403, 404]).toContain(status) || expect(status).toBeGreaterThanOrEqual(300);
  });

  test('API de renombrado no permite modificar sin sesión', async ({ request }) => {
    const response = await request.patch(
      '/api/ocr/documentos/00000000-0000-0000-0000-000000000000',
      {
        headers: { 'Content-Type': 'application/json' },
        data:    { filename: 'intento-de-hack.pdf' },
      }
    );

    const status = response.status();

    await test.info().attach('api-patch-sin-sesion-respuesta', {
      body: Buffer.from(JSON.stringify({
        endpoint:  'PATCH /api/ocr/documentos/:id',
        status,
        protegido: status !== 200,
      }, null, 2)),
      contentType: 'application/json',
    });

    expect(status).not.toBe(200);
    expect([401, 403, 404]).toContain(status) || expect(status).toBeGreaterThanOrEqual(300);
  });

  test('API de estado de documento no sirve datos sin sesión', async ({ request }) => {
    const response = await request.get(
      '/api/ocr/documento-estado/00000000-0000-0000-0000-000000000000'
    );

    const status = response.status();

    await test.info().attach('api-get-estado-sin-sesion-respuesta', {
      body: Buffer.from(JSON.stringify({
        endpoint:  'GET /api/ocr/documento-estado/:id',
        status,
        protegido: status !== 200,
      }, null, 2)),
      contentType: 'application/json',
    });

    expect(status).not.toBe(200);
    expect([401, 403, 404]).toContain(status) || expect(status).toBeGreaterThanOrEqual(300);
  });

});

// ─────────────────────────────────────────────────────────────
// BLOQUE 4: Protección de Rutas y Navegación
// ─────────────────────────────────────────────────────────────
test.describe('Protección de Rutas y Navegación', () => {

  test('La página de login tiene los elementos de UI esperados', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await capturar(page, '15-login-elementos-ui-completos');

    await expect(page.getByRole('heading', { name: 'Acceso al Sistema' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Correo Electrónico' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Contraseña' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingresar al Panel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Regístrate aquí' })).toBeVisible();
  });

  test('El botón de contraseña olvidada está presente en login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: '¿Olvidaste tu contraseña?' })
    ).toBeVisible();
    await capturar(page, '16-login-boton-olvide-contrasena');
  });

  test('La página /update-password es accesible sin autenticación', async ({ page }) => {
    await page.goto('/update-password');
    await page.waitForLoadState('networkidle');
    await capturar(page, '17-update-password-accesible-sin-auth');

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Todas las rutas protegidas redirigen al login', async ({ page }) => {
    const rutas = ['/usuario', '/admin', '/admin/usuarios', '/admin/documentos'];

    for (const ruta of rutas) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
      // Captura la redirección de cada ruta protegida
      await capturar(page, `18-ruta-protegida${ruta.replace(/\//g, '-')}`);
    }
  });

});