import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const requireFromFrontend = createRequire(path.join(rootDir, 'pnmc-web/package.json'));
const { feature } = requireFromFrontend('topojson-client');
const sourcePath = path.join(rootDir, 'pnmc-api/src/PNMC.Api/Assets/geo/Departamentos-Municipos-COL.json');
const outputPath = path.join(rootDir, 'pnmc-database/seed/V20260519_02__divipola_seed.sql');

const topology = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const collection = feature(topology, topology.objects.MGN_ADM_MPIO_GRAFICO);

const escapeSql = (value) => String(value ?? '').replace(/'/g, "''").trim();
const numberOrNull = (value) => Number.isFinite(value) ? value.toFixed(6) : 'NULL';

const collectPositions = (coordinates, positions = []) => {
  if (!Array.isArray(coordinates)) return positions;
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    positions.push(coordinates);
    return positions;
  }
  coordinates.forEach((item) => collectPositions(item, positions));
  return positions;
};

const centroid = (geometry) => {
  const positions = collectPositions(geometry?.coordinates);
  if (positions.length === 0) return { latitud: null, longitud: null };
  const totals = positions.reduce((acc, [longitud, latitud]) => {
    acc.longitud += longitud;
    acc.latitud += latitud;
    return acc;
  }, { latitud: 0, longitud: 0 });
  return {
    latitud: totals.latitud / positions.length,
    longitud: totals.longitud / positions.length,
  };
};

const rows = collection.features
  .map((item) => {
    const props = item.properties || {};
    const { latitud, longitud } = centroid(item.geometry);
    return {
      CodigoDepartamento: String(props.dpto_ccdgo || '').padStart(2, '0'),
      NombreDepartamento: props.dpto_cnmbr || '',
      CodigoMunicipio: String(props.mpio_cdpmp || '').padStart(5, '0'),
      NombreMunicipio: props.mpio_cnmbr || '',
      TipoTerritorio: props.mpio_tipo || '',
      Latitud: latitud,
      Longitud: longitud,
    };
  })
  .filter((row) => row.CodigoDepartamento && row.CodigoMunicipio)
  .sort((left, right) => (
    left.CodigoDepartamento.localeCompare(right.CodigoDepartamento)
    || left.CodigoMunicipio.localeCompare(right.CodigoMunicipio)
  ));

const chunks = [];
for (let index = 0; index < rows.length; index += 250) {
  chunks.push(rows.slice(index, index + 250));
}

const lines = [
  '/*',
  '    PNMC - Carga inicial de Divipola.',
  '    Archivo generado desde pnmc-api/src/PNMC.Api/Assets/geo/Departamentos-Municipos-COL.json.',
  '    No editar manualmente: usar pnmc-database/scripts/generar_seed_divipola_desde_topojson.mjs.',
  '*/',
  '',
  'DELETE FROM dbo.Divipola;',
  '',
];

for (const chunk of chunks) {
  lines.push('INSERT INTO dbo.Divipola');
  lines.push('    (CodigoDepartamento, NombreDepartamento, CodigoMunicipio, NombreMunicipio, TipoTerritorio, Latitud, Longitud)');
  lines.push('VALUES');
  chunk.forEach((row, index) => {
    const suffix = index === chunk.length - 1 ? ';' : ',';
    lines.push(`    ('${escapeSql(row.CodigoDepartamento)}', N'${escapeSql(row.NombreDepartamento)}', '${escapeSql(row.CodigoMunicipio)}', N'${escapeSql(row.NombreMunicipio)}', N'${escapeSql(row.TipoTerritorio)}', ${numberOrNull(row.Latitud)}, ${numberOrNull(row.Longitud)})${suffix}`);
  });
  lines.push('');
}

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Generado ${path.relative(rootDir, outputPath)} con ${rows.length} registros.`);

if (rows.length < 1000) {
  console.error(`La carga generada parece incompleta: ${rows.length} registros.`);
  process.exit(1);
}
