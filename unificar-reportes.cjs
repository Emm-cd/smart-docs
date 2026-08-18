// unificar-reportes.cjs
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = './lighthouse-reports';
const OUTPUT_HTML = path.join(REPORTS_DIR, '00_REPORTE_CONSOLIDADO.html');

// 1. Filtrar TODOS los archivos .json (evitando archivos de resumen o del sistema)
const files = fs.readdirSync(REPORTS_DIR).filter(f => 
  f.endsWith('.json') && 
  !f.includes('resumen') && 
  f !== 'package.json'
);

if (files.length === 0) {
  console.log('❌ No se encontraron archivos .json en', REPORTS_DIR);
  process.exit(1);
}

// Para evitar duplicados en caso de que existan tanto .json como .report.json de la misma página
const paginasProcesadas = new Set();
let filasTabla = '';

files.forEach((file) => {
  // Normalizamos el nombre de la página para identificar duplicados
  const pageName = file
    .replace('lighthouse-', '')
    .replace('.report.json', '')
    .replace('.json', '');

  if (paginasProcesadas.has(pageName)) return;
  paginasProcesadas.add(pageName);

  const filePath = path.join(REPORTS_DIR, file);
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Buscar el archivo HTML correspondiente (.report.html o .html)
    let htmlReportName = file.replace('.report.json', '.report.html').replace('.json', '.html');
    if (!fs.existsSync(path.join(REPORTS_DIR, htmlReportName))) {
      htmlReportName = `lighthouse-${pageName}.html`;
    }

    const url = data.finalUrl || data.requestedUrl || 'N/A';

    // Extraer puntuaciones (0 a 100)
    const perf = Math.round((data.categories?.performance?.score || 0) * 100);
    const acc = Math.round((data.categories?.accessibility?.score || 0) * 100);
    const bp = Math.round((data.categories?.['best-practices']?.score || 0) * 100);

    const badgeClass = (score) => score >= 90 ? 'bg-success' : score >= 70 ? 'bg-warning text-dark' : 'bg-danger';

    filasTabla += `
      <tr>
        <td><strong>${pageName}</strong></td>
        <td><small class="text-muted">${url}</small></td>
        <td><span class="badge ${badgeClass(perf)}">${perf}</span></td>
        <td><span class="badge ${badgeClass(acc)}">${acc}</span></td>
        <td><span class="badge ${badgeClass(bp)}">${bp}</span></td>
        <td>
          <a href="${htmlReportName}" target="_blank" class="btn btn-sm btn-outline-primary">
            🔍 Ver Detalle
          </a>
        </td>
      </tr>
    `;
  } catch (e) {
    console.warn(`⚠️ No se pudo leer el archivo ${file}:`, e.message);
  }
});

// Plantilla HTML Consolidada usando Bootstrap
const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Consolidado de Auditoría Lighthouse</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background-color: #f8f9fa; padding: 30px; }
    .card { border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .badge { font-size: 0.95rem; padding: 6px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>🚀 Reporte Unificado de Usabilidad y Rendimiento</h2>
      <span class="badge bg-secondary">Total páginas: ${paginasProcesadas.size}</span>
    </div>

    <div class="card p-4 mb-4">
      <table class="table table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>Página / Módulo</th>
            <th>URL Objetivo</th>
            <th>Performance</th>
            <th>Accesibilidad</th>
            <th>Buenas Prácticas</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${filasTabla}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_HTML, htmlContent);
console.log(`\n🎉 ¡Reporte unificado actualizado con éxito!`);
console.log(`📊 Se procesaron ${paginasProcesadas.size} páginas.`);
console.log(`👉 Abre el archivo: ${OUTPUT_HTML}`);