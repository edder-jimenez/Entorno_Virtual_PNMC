const backendBase = (process.env.BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

const endpoints = [
  { path: '/health/live', allowedStatuses: [200], description: 'Health live' },
  { path: '/health/ready', allowedStatuses: [200], description: 'Health ready' },
  { path: '/api/v1/news/articles?limit=1', allowedStatuses: [200], description: 'News list' },
  { path: '/api/v1/agenda/events?limit=1', allowedStatuses: [200], description: 'Agenda list' },
  { path: '/api/v1/editorial/resources?limit=1', allowedStatuses: [200], description: 'Editorial list' },
  { path: '/api/v1/map/summary?layer=General', allowedStatuses: [200], description: 'Map summary' },
  { path: '/api/v1/map/topojson/territories', allowedStatuses: [200], description: 'Map topology' },
  { path: '/api/v1/divipola/grouped', allowedStatuses: [200], description: 'Divipola grouped' },
  { path: '/api/v1/festivals?limit=1', allowedStatuses: [200], description: 'Festivals' },
  { path: '/api/v1/music-schools?limit=1', allowedStatuses: [200], description: 'Music schools' },
  { path: '/api/v1/music-markets?limit=1', allowedStatuses: [200], description: 'Music markets' },
  { path: '/api/v1/organizations?limit=1', allowedStatuses: [200], description: 'Organizations' },
  { path: '/api/v1/spaces-infrastructure?limit=1', allowedStatuses: [200], description: 'Spaces infrastructure' },
  { path: '/api/v1/process-entity-relations?limit=1', allowedStatuses: [200], description: 'Process-entity relations' },
  { path: '/api/v1/process-relations?limit=1', allowedStatuses: [200], description: 'Process relations' },
  { path: '/api/v1/gallery/albums', allowedStatuses: [200], description: 'Gallery albums' },
  { path: '/api/v1/admin/data/stats', allowedStatuses: [200, 401, 403], description: 'Admin auth protection' },
];

async function run() {
  console.log(`Running API smoke check against ${backendBase}`);
  const failures = [];

  for (const endpoint of endpoints) {
    const url = `${backendBase}${endpoint.path}`;
    try {
      const response = await fetch(url);
      const ok = endpoint.allowedStatuses.includes(response.status);
      const marker = ok ? 'OK' : 'FAIL';
      console.log(`[${marker}] ${endpoint.description}: ${response.status} ${url}`);
      if (endpoint.path.includes('/api/v1/admin/') && response.status === 200) {
        console.log('[WARN] Admin endpoint respondió 200 sin bloqueo. Revisa PNMC_ADMIN_API_KEY antes de producción.');
      }
      if (!ok) {
        failures.push(`${endpoint.description} -> status ${response.status}, expected ${endpoint.allowedStatuses.join('/')}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[FAIL] ${endpoint.description}: ${url} (${message})`);
      failures.push(`${endpoint.description} -> ${message}`);
    }
  }

  if (failures.length > 0) {
    console.error('\nAPI smoke check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('\nAPI smoke check passed.');
}

run();
