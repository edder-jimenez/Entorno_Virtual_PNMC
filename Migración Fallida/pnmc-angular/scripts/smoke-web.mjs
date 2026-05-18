const frontendBase = (process.env.FRONTEND_BASE_URL || 'http://localhost:4200').replace(/\/+$/, '');

const routes = [
  '/',
  '/pnmc',
  '/ejes',
  '/ejes/componentes/c2-3',
  '/estrategia/circulacion',
  '/estrategia/investigacion',
  '/noticias',
  '/agenda',
  '/editorial',
  '/mapa',
  '/participacion',
  '/mapa/participa',
  '/modulos',
  '/galeria',
  '/admin/login',
  '/admin',
];

async function run() {
  console.log(`Running web smoke check against ${frontendBase}`);
  const failures = [];

  for (const route of routes) {
    const url = `${frontendBase}${route}`;
    try {
      const response = await fetch(url, { redirect: 'follow' });
      const html = await response.text();
      const hasAppRoot = html.includes('<app-root') || html.includes('app-root');
      const ok = response.status === 200 && hasAppRoot;
      const marker = ok ? 'OK' : 'FAIL';
      console.log(`[${marker}] ${route} -> ${response.status}`);
      if (!ok) {
        failures.push(`${route} -> status ${response.status}, app-root=${hasAppRoot}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[FAIL] ${route} (${message})`);
      failures.push(`${route} -> ${message}`);
    }
  }

  if (failures.length > 0) {
    console.error('\nWeb smoke check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('\nWeb smoke check passed.');
}

run();
