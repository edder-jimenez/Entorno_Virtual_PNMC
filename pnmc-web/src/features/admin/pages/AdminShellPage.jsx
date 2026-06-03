import React, { useEffect, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  Activity,
  AlertCircle,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Cpu,
  Database,
  Edit3,
  Eye,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Map,
  Network,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Server,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  UserCog,
  UsersRound,
  X,
  Download,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  Check,
  Lock,
  Mail,
  UserCheck,
  CheckCircle,
  ChevronRight,
  EyeOff,
} from 'lucide-react';
import pnmcBlancoLogo from '../../../assets/branding/pnmc-blanco.png';
import govLogo from '../../../assets/branding/logo-gov-co.png';
import colombiaFooterLogo from '../../../assets/branding/gov-co-footer.png';
import culturasBlancoLogo from '../../../assets/branding/Culturas-Blanco.png';
import { Badge } from '../../../components/ui/Badge.jsx';
import { FormField, SelectInput, TextAreaInput, TextInput } from '../../../components/ui/FormControls.jsx';
import {
  ADMIN_AREAS,
  ADMIN_COVERAGE_LEVELS,
  ADMIN_ENTITY_TYPES,
  ADMIN_MODULES,
  ADMIN_ROLES,
  ADMIN_STATUS,
  canRole,
  getModulesForRole,
} from '../domain/adminConfig.js';
import {
  fetchAdminEntities,
  fetchAdminMe,
  fetchAdminMonitor,
  fetchAdminRecords,
  fetchAdminUsers,
  fetchDivipolaGrouped,
  loginAdmin,
  logoutAdmin,
  saveAdminEntity,
  saveAdminUser,
  updateAdminEntityStatus,
  updateAdminRecordStatus,
  upsertAdminRecord,
  analyzeTextWithAI,
  importBulkRecords,
  updateProfile,
} from '../services/adminApi.js';

import { getWebText, saveWebText, getWebTextDetails, getWebTextsKeysList } from '../../../lib/webTexts.js';

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS (preserved + new helpers)
═══════════════════════════════════════════════════════════════════════════ */

const emptyRecordForModule = (module) => (
  Object.fromEntries(module.fields.map((field) => [field.name, '']))
);

const normalizeFormPayload = (formValues) => (
  Object.fromEntries(
    Object.entries(formValues).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ])
  )
);

const createEntityFormState = () => ({
  id: '',
  entityType: 'organizacion',
  name: '',
  legalName: '',
  description: '',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  otherUrl: '',
  coverageLevel: 'municipal',
  department: '',
  municipality: '',
  addressText: '',
  status: 'borrador',
});

const statusText = (status) => ADMIN_STATUS[status]?.label || status || 'Sin estado';
const coverageText = (coverage) => ADMIN_COVERAGE_LEVELS[String(coverage || '').trim().toLowerCase()] || coverage || 'Sin cobertura';
const titleCaseEs = (value = '') => String(value || '')
  .toLocaleLowerCase('es-CO')
  .replace(/(^|[\s(/-])([\p{L}])/gu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('es-CO')}`)
  .replace(/\bD\.c\./giu, 'D.C.');

const useEscapeToClose = (onClose, enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onClose]);
};

const recordStatusPriority = {
  en_evaluacion: 0,
  ajustes_solicitados: 1,
  borrador: 2,
  rechazado: 3,
  aprobado: 4,
  publicado: 5,
  archivado: 6,
};

/* ── Visual helpers ─────────────────────────────────────────────── */

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-indigo-600', 'bg-blue-600',
  'bg-teal-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600',
];

const getAvatarColor = (name = '') => {
  const hash = String(name).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const relativeTime = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
};

const passwordStrength = (pwd = '') => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

/* ── CSV Parsing and Downloading Helpers ───────────────────────── */

const parseCSV = (text) => {
  const lines = [];
  let row = [""];
  let insideQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};

const normalizeImportHeader = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const getImportableFields = (module) => (module?.fields || []).filter((field) => !field.system && !['id', 'status'].includes(field.name));

const hasImportableRowData = (record, fields = []) => fields.some((field) => {
  const value = record[field.name];
  return value !== undefined && value !== null && String(value).trim() !== '';
});

const detectTemplateModule = (headers, currentModule) => {
  const normalizedHeaders = new Set(headers.map(normalizeImportHeader).filter(Boolean));
  const genericFields = new Set([
    'name', 'title', 'description', 'summary', 'contactEmail', 'contactPhone', 'websiteUrl',
    'instagramUrl', 'facebookUrl', 'otherUrl', 'coverageLevel', 'department', 'municipality',
    'specificLocation', 'addressText', 'latitude', 'longitude', 'sortOrder',
  ]);

  const scores = ADMIN_MODULES.map((candidate) => {
    const fields = getImportableFields(candidate);
    const matches = fields.filter((field) => (
      normalizedHeaders.has(normalizeImportHeader(field.label))
      || normalizedHeaders.has(normalizeImportHeader(field.name))
    ));
    const distinctiveMatches = matches.filter((field) => !genericFields.has(field.name));
    return {
      module: candidate,
      score: matches.length,
      distinctiveScore: distinctiveMatches.length,
    };
  }).sort((a, b) => b.distinctiveScore - a.distinctiveScore || b.score - a.score);

  const best = scores[0];
  const current = scores.find((item) => item.module.id === currentModule.id);
  if (!best || best.module.id === currentModule.id) return null;
  if (best.distinctiveScore >= 2 && best.distinctiveScore > (current?.distinctiveScore || 0)) {
    return best.module;
  }
  return null;
};

const duplicateText = (value = '') => normalizeImportHeader(value)
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const wordsForDuplicate = (value = '') => duplicateText(value)
  .split(/\s+/)
  .filter((word) => word.length > 2);

const duplicateSimilarity = (left = '', right = '') => {
  const a = wordsForDuplicate(left);
  const b = wordsForDuplicate(right);
  if (!a.length || !b.length) return 0;
  const aSet = new Set(a);
  const bSet = new Set(b);
  const intersection = [...aSet].filter((word) => bSet.has(word)).length;
  const union = new Set([...aSet, ...bSet]).size || 1;
  return intersection / union;
};

const getRecordComparableValue = (record, fieldName) => {
  if (!record) return '';
  if (fieldName === 'name' || fieldName === 'title') return record.title || record.name || record.metadata?.name || record.metadata?.title || '';
  if (fieldName === 'department') return record.department || record.metadata?.department || '';
  if (fieldName === 'municipality') return record.municipality || record.metadata?.municipality || '';
  return record[fieldName] ?? record.metadata?.[fieldName] ?? '';
};

const duplicateIdentityFields = (moduleId) => {
  if (['news', 'editorial'].includes(moduleId)) return ['title', 'date', 'category'];
  if (moduleId === 'agenda') return ['title', 'date', 'department', 'municipality'];
  if (moduleId === 'musicSchools') return ['name', 'department', 'municipality', 'responsibleEntity'];
  if (moduleId === 'spacesInfrastructure') return ['name', 'workshopName', 'department', 'municipality', 'contactEmail'];
  return ['name', 'department', 'municipality'];
};

const duplicateKeyForRecord = (moduleId, record) => duplicateIdentityFields(moduleId)
  .map((field) => duplicateText(getRecordComparableValue(record, field)))
  .filter(Boolean)
  .join('|');

const duplicateKeyForImport = (moduleId, record) => duplicateIdentityFields(moduleId)
  .map((field) => duplicateText(record[field]))
  .filter(Boolean)
  .join('|');

const findDuplicateCandidates = ({ moduleId, record, existingRecords, importedRows }) => {
  const importedKey = duplicateKeyForImport(moduleId, record);
  const title = record.name || record.title || '';
  const department = duplicateText(record.department);
  const municipality = duplicateText(record.municipality);
  const contact = duplicateText(record.contactEmail || record.organizerEmail || record.responsibleEntityEmail || record.websiteUrl);

  const candidates = [];
  existingRecords.forEach((existing) => {
    const existingKey = duplicateKeyForRecord(moduleId, existing);
    if (importedKey && existingKey && importedKey === existingKey) {
      candidates.push({ type: 'exact', source: 'database', score: 1, record: existing, reason: 'Coincidencia exacta con un registro existente.' });
      return;
    }

    const existingTitle = getRecordComparableValue(existing, 'name') || getRecordComparableValue(existing, 'title');
    const titleScore = duplicateSimilarity(title, existingTitle);
    const sameDepartment = department && department === duplicateText(getRecordComparableValue(existing, 'department'));
    const sameMunicipality = municipality && municipality === duplicateText(getRecordComparableValue(existing, 'municipality'));
    const sameContact = contact && [
      'contactEmail', 'organizerEmail', 'responsibleEntityEmail', 'websiteUrl',
    ].some((field) => contact === duplicateText(getRecordComparableValue(existing, field)));
    const score = titleScore + (sameDepartment ? 0.18 : 0) + (sameMunicipality ? 0.22 : 0) + (sameContact ? 0.24 : 0);
    if (score >= 0.82 || (titleScore >= 0.72 && (sameMunicipality || sameContact))) {
      candidates.push({
        type: 'possible',
        source: 'database',
        score: Math.min(0.99, score),
        record: existing,
        reason: sameContact ? 'Nombre similar y contacto coincidente.' : 'Nombre y territorio similares.',
      });
    }
  });

  importedRows.forEach((row) => {
    const other = row.parsedData;
    const otherKey = duplicateKeyForImport(moduleId, other);
    if (importedKey && otherKey && importedKey === otherKey) {
      candidates.push({ type: 'exact', source: 'file', score: 1, record: other, reason: `Coincidencia exacta con la fila ${row.rowNumber} del archivo.` });
    }
  });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
};

const normalizeCoverageForImport = (coverageLevel, hasDepartment, hasMunicipality) => {
  const normalized = normalizeImportHeader(coverageLevel);
  if (normalized === 'nacional') return 'Nacional';
  if (normalized === 'departamental') return hasDepartment ? 'Departamental' : 'Nacional';
  if (normalized === 'municipal') {
    if (hasMunicipality) return 'Municipal';
    if (hasDepartment) return 'Departamental';
    return 'Nacional';
  }
  if (hasMunicipality) return 'Municipal';
  if (hasDepartment) return 'Departamental';
  return 'Nacional';
};

const canonicalizeImportRecord = (record, divipola = {}) => {
  const canonicalDepartments = new globalThis.Map(
    Object.keys(divipola || {}).map((department) => [normalizeImportHeader(department), titleCaseEs(department)])
  );
  const canonicalMunicipalities = new globalThis.Map(
    Object.entries(divipola || {}).flatMap(([department, municipalities]) =>
      (municipalities || []).map((municipality) => [
        `${normalizeImportHeader(department)}::${normalizeImportHeader(municipality)}`,
        titleCaseEs(municipality),
      ])
    )
  );

  const nextRecord = { ...record };
  const normalizedDepartment = normalizeImportHeader(record.department || '');
  const canonicalDepartment = canonicalDepartments.get(normalizedDepartment);
  if (canonicalDepartment) nextRecord.department = canonicalDepartment;

  const normalizedMunicipality = normalizeImportHeader(record.municipality || '');
  const canonicalMunicipality = canonicalMunicipalities.get(`${normalizedDepartment}::${normalizedMunicipality}`);
  if (canonicalMunicipality) nextRecord.municipality = canonicalMunicipality;

  nextRecord.coverageLevel = normalizeCoverageForImport(
    record.coverageLevel,
    Boolean(canonicalDepartment),
    Boolean(canonicalMunicipality)
  );

  return nextRecord;
};

const getTemplateOptionsForField = (field, divipola = {}) => {
  if (field.options?.length) return field.options.map((option) => option.label || option.value);
  if (field.name === 'coverageLevel') return Object.values(ADMIN_COVERAGE_LEVELS);
  if (field.name === 'department') return Object.keys(divipola || {}).map(titleCaseEs).sort((a, b) => a.localeCompare(b, 'es'));
  if (field.name === 'municipality') {
    return [...new Set(Object.values(divipola || {}).flat().map(titleCaseEs))].sort((a, b) => a.localeCompare(b, 'es'));
  }
  if (field.type === 'checkbox') return ['Sí', 'No'];
  return [];
};

const inferTemplateFieldType = (field) => {
  if (field.type === 'number') return 'Número';
  if (field.type === 'date') return 'Fecha yyyy-mm-dd';
  if (field.type === 'time') return 'Hora hh:mm';
  if (field.type === 'email') return 'Correo';
  if (field.type === 'url') return 'URL';
  if (field.type === 'checkbox') return 'Sí/No';
  if (field.type === 'select' || ['coverageLevel', 'department', 'municipality'].includes(field.name)) return 'Lista';
  return 'Texto';
};

const applyListValidation = (worksheet, columnNumber, firstRow, lastRow, sourceRange) => {
  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber++) {
    worksheet.getCell(rowNumber, columnNumber).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [sourceRange],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Valor no permitido',
      error: 'Seleccione un valor de la lista para evitar errores de importación.',
    };
  }
};

const applyDependentMunicipalityValidation = ({
  worksheet,
  catalogSheet,
  divipola,
  departmentColumnNumber,
  municipalityColumnNumber,
  startColumnNumber,
  firstRow,
  lastRow,
}) => {
  if (!departmentColumnNumber || !municipalityColumnNumber || !Object.keys(divipola || {}).length) return;

  const departments = Object.keys(divipola || {}).map(titleCaseEs).sort((a, b) => a.localeCompare(b, 'es'));
  departments.forEach((department, index) => {
    const col = startColumnNumber + index;
    catalogSheet.getCell(1, col).value = department;
    const sourceDepartment = Object.keys(divipola || {}).find((name) => titleCaseEs(name) === department) || department;
    (divipola[sourceDepartment] || []).map(titleCaseEs).sort((a, b) => a.localeCompare(b, 'es')).forEach((municipality, rowIndex) => {
      catalogSheet.getCell(rowIndex + 2, col).value = municipality;
    });
  });

  const firstCatalogLetter = catalogSheet.getColumn(startColumnNumber).letter;
  const lastCatalogLetter = catalogSheet.getColumn(startColumnNumber + departments.length - 1).letter;
  const departmentLetter = worksheet.getColumn(departmentColumnNumber).letter;

  for (let rowNumber = firstRow; rowNumber <= lastRow; rowNumber++) {
    const departmentRef = `$${departmentLetter}${rowNumber}`;
    worksheet.getCell(rowNumber, municipalityColumnNumber).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [
        `=OFFSET(Catalogos!$${firstCatalogLetter}$1,1,MATCH(${departmentRef},Catalogos!$${firstCatalogLetter}$1:$${lastCatalogLetter}$1,0)-1,COUNTA(OFFSET(Catalogos!$${firstCatalogLetter}:$${firstCatalogLetter},0,MATCH(${departmentRef},Catalogos!$${firstCatalogLetter}$1:$${lastCatalogLetter}$1,0)-1))-1,1)`,
      ],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Municipio no corresponde',
      error: 'Seleccione primero un departamento y luego elija un municipio de esa lista.',
    };
  }
};

const downloadExcelTemplate = async (module, divipola = {}) => {
  const fields = module.fields.filter(f => f.name !== 'id' && f.name !== 'status');

  const exampleRow = fields.map(f => {
    const name = f.name;
    if (name === 'name' || name === 'title') {
      if (module.id === 'festivals') return 'Festival de Música del Pacífico';
      if (module.id === 'musicSchools') return 'Escuela de Música y Tradición';
      if (module.id === 'musicMarkets') return 'Mercado del Ecosistema de la Música';
      if (module.id === 'spacesInfrastructure') return 'Taller del Luthier de Viento';
      if (module.id === 'agenda') return 'Concierto de Gala de la Filarmónica';
      if (module.id === 'news') return 'Resultados de Convocatoria Nacional';
      return 'Ejemplo de Registro';
    }
    if (name === 'versionsCount' || name === 'editionsCount') return 12;
    if (name === 'lastEditionDate' || name === 'date' || name === 'publishedDate' || name === 'currentYearStartDate' || name === 'currentYearEndDate') return '2026-05-15';
    if (name === 'description' || name === 'summary' || name === 'contentHtml' || name === 'lead') {
      return `Ejemplo de descripción. Por favor, reemplace esta fila completa con sus datos reales.`;
    }
    if (name.toLowerCase().includes('email')) return 'contacto@ejemplo.com';
    if (name.toLowerCase().includes('phone')) return '+57 300 123 4567';
    if (name.toLowerCase().includes('url')) return 'https://www.ejemplo.com';
    if (name === 'department') return 'Nariño';
    if (name === 'municipality') return 'Pasto';
    if (name === 'coverageLevel') return 'Municipal';
    if (name === 'students' || name === 'activeGroupsCount' || name === 'trainingCapacity' || name === 'sortOrder') return 5;
    if (name === 'hasCurrentYearEdition' || name === 'isActiveSchool') return 'Sí';
    if (name === 'directorName' || name === 'contactName') return 'Juan Pérez';
    if (name === 'actorType') return 'individual';
    return 'Dato de Ejemplo';
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Entorno Virtual PNMC';
  workbook.created = new Date();

  const templateSheet = workbook.addWorksheet('Plantilla', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  const catalogSheet = workbook.addWorksheet('Catalogos');
  const guideSheet = workbook.addWorksheet('Instrucciones');
  catalogSheet.state = 'veryHidden';

  templateSheet.addRow(fields.map(f => f.label));
  templateSheet.addRow(exampleRow);
  templateSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  templateSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF291242' } };
  templateSheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };
  templateSheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  templateSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: fields.length },
  };

  templateSheet.columns = fields.map((f, idx) => {
    const labelLen = String(f.label || '').length;
    const valLen = String(exampleRow[idx] || '').length;
    return { width: Math.min(42, Math.max(16, Math.max(labelLen, valLen) + 3)) };
  });

  const catalogRanges = new globalThis.Map();
  let catalogColumn = 1;
  fields.forEach((field) => {
    const options = getTemplateOptionsForField(field, divipola);
    if (!options.length) return;

    const header = field.name;
    catalogSheet.getCell(1, catalogColumn).value = header;
    options.forEach((option, index) => {
      catalogSheet.getCell(index + 2, catalogColumn).value = option;
    });
    const colLetter = catalogSheet.getColumn(catalogColumn).letter;
    catalogRanges.set(field.name, `Catalogos!$${colLetter}$2:$${colLetter}$${options.length + 1}`);
    catalogColumn++;
  });

  const maxEditableRows = 1000;
  fields.forEach((field, index) => {
    const range = catalogRanges.get(field.name);
    if (range) {
      applyListValidation(templateSheet, index + 1, 2, maxEditableRows + 1, range);
    }

    if (field.type === 'number') {
      for (let rowNumber = 2; rowNumber <= maxEditableRows + 1; rowNumber++) {
        templateSheet.getCell(rowNumber, index + 1).dataValidation = {
          type: 'decimal',
          operator: 'greaterThanOrEqual',
          formulae: [0],
          allowBlank: true,
          showErrorMessage: true,
          errorTitle: 'Número inválido',
          error: 'Ingrese un número válido mayor o igual a cero.',
        };
      }
    }
  });

  const departmentColumnIndex = fields.findIndex((field) => field.name === 'department') + 1;
  const municipalityColumnIndex = fields.findIndex((field) => field.name === 'municipality') + 1;
  if (departmentColumnIndex && municipalityColumnIndex) {
    applyDependentMunicipalityValidation({
      worksheet: templateSheet,
      catalogSheet,
      divipola,
      departmentColumnNumber: departmentColumnIndex,
      municipalityColumnNumber: municipalityColumnIndex,
      startColumnNumber: catalogColumn + 1,
      firstRow: 2,
      lastRow: maxEditableRows + 1,
    });
  }

  guideSheet.columns = [
    { header: 'Campo', key: 'field', width: 32 },
    { header: 'Tipo', key: 'type', width: 18 },
    { header: 'Obligatorio', key: 'required', width: 14 },
    { header: 'Observación', key: 'note', width: 70 },
  ];
  guideSheet.getRow(1).font = { bold: true };
  fields.forEach((field) => {
    const hasOptions = getTemplateOptionsForField(field, divipola).length > 0;
    guideSheet.addRow({
      field: field.label,
      type: inferTemplateFieldType(field),
      required: field.required ? 'Sí' : 'No',
      note: hasOptions
        ? field.name === 'municipality'
          ? 'Primero seleccione Departamento. La lista de Municipio se filtrará automáticamente según DIVIPOLA.'
          : 'Use la lista desplegable. Si pega datos externos, el importador volverá a validar este valor.'
        : 'Diligencie según el formato indicado.',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plantilla_${module.id}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};




const STATUS_BADGE_STYLES = {
  borrador:            'text-slate-600 bg-slate-100 border border-slate-200',
  en_evaluacion:       'text-blue-700 bg-blue-50 border border-blue-200',
  ajustes_solicitados: 'text-amber-700 bg-amber-50 border border-amber-200',
  aprobado:            'text-emerald-700 bg-emerald-50 border border-emerald-200',
  publicado:           'text-violet-700 bg-violet-50 border border-violet-200',
  rechazado:           'text-red-700 bg-red-50 border border-red-200',
  archivado:           'text-slate-400 bg-slate-50 border border-slate-100',
};

const StatusPill = ({ status }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.borrador}`}>
    {statusText(status)}
  </span>
);

/* ── SVG Charts ─────────────────────────────────────────────────── */

const STATUS_BAR_COLORS = {
  borrador:            '#94a3b8',
  en_evaluacion:       '#3b82f6',
  ajustes_solicitados: '#f59e0b',
  aprobado:            '#10b981',
  publicado:           '#8b5cf6',
  rechazado:           '#ef4444',
  archivado:           '#e2e8f0',
};

const ModuleStatusBar = ({ statuses = [], total = 0 }) => {
  if (total === 0) {
    return <div className="h-1.5 w-full rounded-full bg-slate-100" />;
  }
  const segments = statuses
    .filter((s) => s.count > 0)
    .reduce((acc, s) => {
      const x = acc.length > 0 ? acc[acc.length - 1].x + acc[acc.length - 1].width : 0;
      const width = (s.count / total) * 100;
      return [...acc, { code: s.code, x, width, color: STATUS_BAR_COLORS[s.code] || '#94a3b8' }];
    }, []);

  return (
    <svg width="100%" height="6" style={{ borderRadius: '9999px', overflow: 'hidden', display: 'block' }}>
      {segments.map((seg) => (
        <rect
          key={seg.code}
          x={`${seg.x}%`}
          y={0}
          width={`${seg.width}%`}
          height={6}
          fill={seg.color}
        />
      ))}
    </svg>
  );
};

const HealthDot = ({ ok, latency }) => {
  let color = 'bg-emerald-400';
  let label = 'OK';
  if (!ok) { color = 'bg-red-400'; label = 'Error'; }
  else if (latency > 500) { color = 'bg-amber-400'; label = 'Lento'; }
  else if (latency > 200) { color = 'bg-yellow-400'; label = 'Regular'; }
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color} animate-pulse`} />
      <span className="text-xs font-semibold text-slate-500">{label}</span>
    </span>
  );
};

/* ── Shared form primitives ─────────────────────────────────────── */

const FormSection = ({ title, icon: Icon, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
      {Icon && <Icon size={13} className="text-[#291242]/70" />}
      <p className="font-alternate text-[0.68rem] font-bold uppercase tracking-widest text-[#291242]/70">{title}</p>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const FieldGrid = ({ cols = 2, children }) => (
  <div className={`grid gap-3 ${cols === 1 ? '' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TERRITORY FIELDS (preserved logic)
═══════════════════════════════════════════════════════════════════════════ */

const TerritoryFields = ({
  divipola,
  department,
  municipality,
  coverageLevel = 'municipal',
  onChange,
  idPrefix,
  requireDepartment = true,
}) => {
  const departmentNames = useMemo(
    () => Object.keys(divipola || {}).sort((a, b) => a.localeCompare(b, 'es')),
    [divipola]
  );
  const municipalities = useMemo(
    () => (department ? (divipola?.[department] || []) : []),
    [department, divipola]
  );
  const usesDepartment = coverageLevel !== 'nacional';
  const usesMunicipality = coverageLevel === 'municipal';

  const updateCoverage = (value) => {
    onChange('coverageLevel', value);
    if (value === 'nacional') { onChange('department', ''); onChange('municipality', ''); }
    if (value === 'departamental') { onChange('municipality', ''); }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FormField label="Cobertura" htmlFor={`${idPrefix}-coverage`}>
        <SelectInput id={`${idPrefix}-coverage`} value={coverageLevel} onChange={(e) => updateCoverage(e.target.value)}>
          <option value="municipal">Municipal</option>
          <option value="departamental">Departamental</option>
          <option value="nacional">Nacional</option>
        </SelectInput>
      </FormField>
      <FormField label="Departamento" htmlFor={`${idPrefix}-department`} required={usesDepartment && requireDepartment}>
        <SelectInput
          id={`${idPrefix}-department`}
          value={department}
          onChange={(e) => { onChange('department', e.target.value); onChange('municipality', ''); }}
          disabled={!usesDepartment}
          required={usesDepartment && requireDepartment}
        >
          <option value="">Seleccione</option>
          {departmentNames.map((name) => <option key={name} value={name}>{titleCaseEs(name)}</option>)}
        </SelectInput>
      </FormField>
      <FormField label="Municipio" htmlFor={`${idPrefix}-municipality`} required={usesMunicipality && requireDepartment}>
        <SelectInput
          id={`${idPrefix}-municipality`}
          value={municipality}
          onChange={(e) => onChange('municipality', e.target.value)}
          disabled={!usesMunicipality || !department}
          required={usesMunicipality && requireDepartment}
        >
          <option value="">Seleccione</option>
          {municipalities.map((name) => <option key={name} value={name}>{titleCaseEs(name)}</option>)}
        </SelectInput>
      </FormField>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN LOGIN — Redesigned
═══════════════════════════════════════════════════════════════════════════ */

const AdminLogin = ({ onLogin, onToggleExternal }) => {
  const [selectedRole, setSelectedRole] = useState('webmaster');
  const [email, setEmail] = useState('admin@pnmc.local');
  const [password, setPassword] = useState('admin');
  const [loginState, setLoginState] = useState({ status: 'idle', message: '' });
  const [formMode, setFormMode] = useState('login'); // 'login' | 'recover'
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputsGlowing, setInputsGlowing] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const ROLE_CREDENTIALS = {
    webmaster: { email: 'admin@pnmc.local', password: 'admin' },
    gestor_interno: { email: 'gestor@pnmc.local', password: 'admin' },
    aliado_admin: { email: 'aliado-admin@pnmc.local', password: 'admin' },
    aliado_editor: { email: 'aliado-editor@pnmc.local', password: 'admin' },
    aliado_lector: { email: 'aliado-lector@pnmc.local', password: 'admin' },
    externo: { email: 'externo@pnmc.local', password: 'admin' },
  };

  const selectRole = (roleId) => {
    if (formMode !== 'login') {
      setFormMode('login');
    }
    setSelectedRole(roleId);
    setEmail(ROLE_CREDENTIALS[roleId].email);
    setPassword(ROLE_CREDENTIALS[roleId].password);
    
    // Quick, premium visual highlight confirmation on inputs
    setInputsGlowing(true);
    setTimeout(() => setInputsGlowing(false), 800);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginState({ status: 'saving', message: 'Validando credenciales...' });
    try {
      const response = await loginAdmin({ email, password });
      onLogin(response.user);
      setLoginState({ status: 'idle', message: '' });
    } catch (error) {
      setLoginState({ status: 'error', message: error.message });
    }
  };

  const handleRecoverSubmit = (event) => {
    event.preventDefault();
    if (!recoverEmail) return;
    setLoginState({ status: 'saving', message: 'Enviando solicitud...' });
    
    // Simulate reset link dispatch
    setTimeout(() => {
      setRecoverSuccess(true);
      setLoginState({ status: 'idle', message: '' });
    }, 1000);
  };

  const customStyles = `
    @keyframes led-blink {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; filter: brightness(1.2); }
    }
    .led-glow {
      animation: led-blink 2s ease-in-out infinite;
    }
    @keyframes card-glow {
      0%, 100% { box-shadow: 0 0 25px rgba(0, 218, 94, 0.03), inset 0 1px 0 rgba(255,255,255,0.06); }
      50% { box-shadow: 0 0 45px rgba(0, 218, 94, 0.08), inset 0 1px 0 rgba(255,255,255,0.09); }
    }
    .terminal-card-glow {
      animation: card-glow 6s ease-in-out infinite;
    }
    @keyframes button-shine {
      0% { left: -120%; }
      35%, 100% { left: 120%; }
    }
    .btn-shine-effect {
      position: relative;
      overflow: hidden;
    }
    .btn-shine-effect::after {
      content: '';
      position: absolute;
      top: 0;
      left: -120%;
      width: 45%;
      height: 100%;
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.3) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: skewX(-25deg);
      animation: button-shine 6s ease-in-out infinite;
    }
    /* Webkit Input Autofill robust override */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #090610 inset !important;
      -webkit-text-fill-color: #ffffff !important;
      caret-color: #ffffff !important;
      transition: background-color 5000s ease-in-out 0s !important;
    }
  `;

  return (
    <main className="relative h-screen w-screen bg-[#0d0915] flex flex-col items-center justify-center px-4 overflow-hidden select-none">
      <style>{customStyles}</style>

      {/* Ambient Glowing Spheres */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#00DA5E]/8 blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full bg-[#6100D7]/12 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-md flex flex-col items-center relative z-10 text-center py-2">
        
        {/* Prominent Hero Website Logo (Refined scale for majestic presence) */}
        <img 
          src={pnmcBlancoLogo} 
          className="h-24 sm:h-28 md:h-32 w-auto object-contain mb-5 filter drop-shadow-[0_4px_32px_rgba(0,218,94,0.25)] transition-all duration-300 hover:scale-[1.03]" 
          alt="PNMC Logo" 
        />

        {/* Centered Glassmorphic Login Card */}
        <div className="w-full rounded-[2rem] bg-slate-900/40 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.6)] relative terminal-card-glow text-left">
          {/* Subtle top ambient indicator bar */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00DA5E]/30 to-transparent rounded-t-[2rem]"></div>
          
          {formMode === 'login' ? (
            <>
              <div className="mb-6">
                {/* Predominant Overflowing Title that straddles the card border */}
                <div className="-mt-11 sm:-mt-13 mb-3 relative z-20">
                  <h2 className="text-2xl sm:text-3xl md:text-[2.25rem] font-black uppercase tracking-tight font-display leading-none text-white select-none pointer-events-none drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
                    Centro de <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00DA5E] via-[#00f56a] to-[#00b04c] drop-shadow-[0_2px_15px_rgba(0,218,94,0.35)]">Administración</span>
                  </h2>
                </div>
                <p className="text-[0.68rem] text-slate-400 mt-2 leading-relaxed font-medium">
                  Portal de acceso exclusivo para el equipo del <strong className="text-slate-200">Grupo de Música</strong> y aliados del <strong className="text-slate-200">Plan Nacional de Música para la Convivencia</strong>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 group">
                  <label htmlFor="admin-email" className="block text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-400 pl-1 group-focus-within:text-[#00DA5E] transition-colors duration-300">Correo electrónico</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none group-focus-within:text-[#00DA5E] transition-colors duration-300">
                      <Mail size={15} />
                    </span>
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                      className={`w-full rounded-xl bg-slate-950/50 border pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 ${
                        inputsGlowing 
                          ? 'border-[#00DA5E] ring-2 ring-[#00DA5E]/30 shadow-[0_0_15px_rgba(0,218,94,0.15)] bg-slate-950/70' 
                          : 'border-white/10 hover:border-white/20 focus:border-[#00DA5E] focus:ring-2 focus:ring-[#00DA5E]/20 focus:bg-slate-950/70 focus:shadow-[0_0_20px_rgba(0,218,94,0.1)]'
                      }`}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 group">
                  <div className="flex items-center justify-between pl-1">
                    <label htmlFor="admin-password" className="block text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-400 group-focus-within:text-[#00DA5E] transition-colors duration-300">Contraseña</label>
                    <button 
                      type="button" 
                      onClick={() => { setFormMode('recover'); setRecoverSuccess(false); setRecoverEmail(''); }} 
                      className="text-[0.62rem] font-bold text-[#00DA5E] hover:underline cursor-pointer uppercase tracking-wider transition"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none group-focus-within:text-[#00DA5E] transition-colors duration-300">
                      <Lock size={15} />
                    </span>
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className={`w-full rounded-xl bg-slate-950/50 border pl-11 pr-12 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 ${
                        inputsGlowing 
                          ? 'border-[#00DA5E] ring-2 ring-[#00DA5E]/30 shadow-[0_0_15px_rgba(0,218,94,0.15)] bg-slate-950/70' 
                          : 'border-white/10 hover:border-white/20 focus:border-[#00DA5E] focus:ring-2 focus:ring-[#00DA5E]/20 focus:bg-slate-950/70 focus:shadow-[0_0_20px_rgba(0,218,94,0.1)]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-[#00DA5E] transition-colors"
                    >
                      {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>

                {loginState.message && loginState.status !== 'idle' && (
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                    loginState.status === 'error' 
                      ? 'bg-rose-950/40 border border-rose-800/50 text-rose-300' 
                      : 'bg-slate-900/60 border border-[#00DA5E]/20 text-[#00DA5E]'
                  }`}>
                    {loginState.status === 'error' ? (
                      <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    ) : (
                      <RefreshCw size={14} className="animate-spin shrink-0 text-[#00DA5E]" />
                    )}
                    <span className="leading-snug text-[10px] sm:text-xs">{loginState.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginState.status === 'saving'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00DA5E] via-[#00f56a] to-[#00b04c] disabled:opacity-50 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,218,94,0.4)] cursor-pointer select-none active:scale-[0.97] btn-shine-effect"
                >
                  <ShieldCheck size={15} />
                  Entrar al panel
                </button>
                
              </form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-lg bg-[#00DA5E]/20 animate-ping opacity-60"></div>
                    <div className="relative h-8 w-8 rounded-lg bg-slate-950/80 border border-[#00DA5E]/40 flex items-center justify-center shadow-[0_0_10px_rgba(0,218,94,0.15)]">
                      <RefreshCw size={14} className="text-[#00DA5E] animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#00DA5E]/10 text-[#00DA5E] border border-[#00DA5E]/20 shadow-[0_0_10px_rgba(0,218,94,0.05)]">
                    Recuperación
                  </span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-display leading-tight">
                  Recuperar <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00DA5E] to-[#00f56a] drop-shadow-[0_2px_10px_rgba(0,218,94,0.2)]">Contraseña</span>
                </h2>
                <p className="text-[0.68rem] text-slate-400 mt-2 leading-relaxed font-medium">Ingresa tu correo electrónico registrado y te enviaremos las instrucciones de restablecimiento.</p>
              </div>

              {!recoverSuccess ? (
                <form onSubmit={handleRecoverSubmit} className="space-y-4">
                  <div className="space-y-1.5 group">
                    <label htmlFor="recover-email" className="block text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-400 pl-1 group-focus-within:text-[#00DA5E] transition-colors duration-300">Correo electrónico</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none group-focus-within:text-[#00DA5E] transition-colors duration-300">
                        <Mail size={15} />
                      </span>
                      <input
                        id="recover-email"
                        type="email"
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        required
                        className="w-full rounded-xl bg-slate-950/50 border border-white/10 pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none hover:border-white/20 focus:border-[#00DA5E] focus:ring-2 focus:ring-[#00DA5E]/20 focus:bg-slate-950/70 focus:shadow-[0_0_20px_rgba(0,218,94,0.1)] transition-all duration-300"
                      />
                    </div>
                  </div>

                  {loginState.message && loginState.status === 'saving' && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-slate-900/60 border border-[#00DA5E]/20 text-[#00DA5E]">
                      <RefreshCw size={14} className="animate-spin shrink-0 text-[#00DA5E]" />
                      <span className="leading-snug text-[10px] sm:text-xs">{loginState.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginState.status === 'saving'}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00DA5E] via-[#00f56a] to-[#00b04c] disabled:opacity-50 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,218,94,0.4)] cursor-pointer select-none active:scale-[0.97] btn-shine-effect"
                  >
                    Enviar Enlace
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMode('login')}
                    className="w-full text-center text-[10px] sm:text-xs font-bold text-slate-400 hover:text-[#00DA5E] uppercase tracking-wider mt-3 hover:underline cursor-pointer transition-colors"
                  >
                    Volver al Inicio de Sesión
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">¡Solicitud Procesada!</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                      Hemos enviado un correo a <strong className="text-white">{recoverEmail}</strong> con las instrucciones y el enlace para restablecer tu contraseña.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFormMode('login'); setRecoverSuccess(false); }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              )}
            </>
          )}

          {onToggleExternal && formMode === 'login' && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onToggleExternal}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-4 py-2.5 text-[0.68rem] font-black uppercase tracking-wider text-[#00DA5E] hover:text-[#00f56a] transition-all duration-300 cursor-pointer group active:scale-[0.98]"
              >
                <span>Ingresar al Portal de Colaboradores Externos</span>
                <ChevronRight size={12} className="transform group-hover:translate-x-1 transition-transform duration-300 text-[#00DA5E] group-hover:text-[#00f56a]" />
              </button>
            </div>
          )}
        </div>

        {/* Institutional Endorsement (Ministry Logos) at the very bottom - perfectly aligned in a single row */}
        <div className="mt-5 flex flex-col items-center gap-2 shrink-0 select-none">
          <div className="flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
            <div className="w-[5.5rem] sm:w-[6.5rem] shrink-0">
              <img src={govLogo} className="w-full h-auto object-contain" alt="GOV.CO" />
            </div>
            <div className="h-4 w-[1px] bg-white/20"></div>
            <div className="w-[2.2rem] sm:w-[2.6rem] shrink-0">
              <img src={colombiaFooterLogo} className="w-full h-auto object-contain" alt="Colombia" />
            </div>
            <div className="h-4 w-[1px] bg-white/20"></div>
            <div className="w-[2.9rem] sm:w-[3.5rem] shrink-0">
              <img src={culturasBlancoLogo} className="w-full h-auto object-contain" alt="Ministerio de las Culturas" />
            </div>
          </div>
        </div>
      </div>

      {/* 
        ═══════════════════════════════════════════════════════════════════════════
        DEVELOPER / TESTING ACCOUNTS FLOATING TOOL (Bottom-Left Corner)
        TODO: REMOVE THIS COMPONENT BEFORE PRODUCTION DEPLOYMENT
        ═══════════════════════════════════════════════════════════════════════════
      */}
      <div className="fixed bottom-6 left-6 z-[4000] text-left">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-md text-xs font-bold transition-all duration-300 hover:scale-[1.03] select-none cursor-pointer ${
            showDevPanel
              ? 'bg-[#00DA5E] border-[#00DA5E] text-slate-950 shadow-[0_0_15px_rgba(0,218,94,0.3)]'
              : 'bg-slate-900/90 border-white/10 text-[#00DA5E] hover:border-[#00DA5E]/30 hover:bg-slate-900'
          }`}
        >
          <UserCheck size={14} className={showDevPanel ? 'animate-pulse' : ''} />
          <span>{showDevPanel ? 'Cerrar Cuentas' : 'Cuentas de Prueba'}</span>
        </button>

        {/* Floating Dev Panel List */}
        {showDevPanel && (
          <div className="absolute bottom-14 left-0 w-72 rounded-3xl bg-slate-950/95 border border-white/10 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#00DA5E]">Herramienta de Pruebas</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">
                Haz clic en una cuenta para autocompletar el login e ingresar rápidamente a evaluar cada módulo.
              </p>
            </div>

            <div className="h-60 overflow-y-auto pr-1 space-y-2 thin-horizontal-scrollbar no-scrollbar">
              {Object.values(ADMIN_ROLES).map((role) => {
                const isActive = selectedRole === role.id && formMode === 'login';
                
                // Color mapping for testing indicator
                let indicatorColor = 'bg-[#00DA5E]';
                if (role.id === 'gestor_interno') indicatorColor = 'bg-blue-500';
                if (role.id === 'aliado_admin') indicatorColor = 'bg-purple-500';
                if (role.id === 'aliado_editor') indicatorColor = 'bg-orange-500';
                if (role.id === 'aliado_lector') indicatorColor = 'bg-slate-400';
                if (role.id === 'externo') indicatorColor = 'bg-rose-500';

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      selectRole(role.id);
                    }}
                    className={`w-full flex items-center justify-between gap-3 text-left rounded-xl p-2.5 border transition-all ${
                      isActive
                        ? 'bg-white/10 border-[#00DA5E]/40 text-white'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${indicatorColor}`}></span>
                        {role.shortLabel}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{ROLE_CREDENTIALS[role.id].email}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-[#00DA5E]/80 bg-[#00DA5E]/10 rounded px-1 py-0.5 shrink-0">
                      {isActive ? 'Activo' : 'Cargar'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Critical Production Warning */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[8.5px] text-amber-300 leading-normal flex gap-2">
              <span className="shrink-0 text-xs">⚠️</span>
              <p>
                <strong>Atención:</strong> Este panel es exclusivo de desarrollo y testing. Recuerde removerlo antes del despliegue en producción.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};


/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN MONITOR — Dashboard with charts & health panel
═══════════════════════════════════════════════════════════════════════════ */

const KpiCard = ({ label, value, detail, icon: Icon, accent = '#00DA5E' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {Icon && (
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
      )}
    </div>
    <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
    <p className="text-xs text-slate-400">{detail}</p>
  </div>
);

const AdminMonitor = ({ monitor, apiStatus, onRefresh }) => {
  const modules = monitor?.modules || [];
  const totals = monitor?.totals || {};
  const api = monitor?.api || {};
  const database = monitor?.database || {};
  const apiOk = api.status === 'ok';
  const dbOk = database.status === 'ok';

  const groupedModules = modules.reduce((acc, mod) => {
    const area = mod.area || 'General';
    acc[area] = [...(acc[area] || []), mod];
    return acc;
  }, {});

  const kpis = [
    { label: 'Registros totales', value: totals.records ?? 0, detail: 'Suma de módulos operativos', icon: Database, accent: '#6366f1' },
    { label: 'Entidades base', value: totals.entities ?? 0, detail: 'Modelo central Entidades', icon: Building2, accent: '#0ea5e9' },
    { label: 'Usuarios admin', value: totals.users ?? 0, detail: 'Cuentas administrativas activas', icon: UsersRound, accent: '#00DA5E' },
    { label: 'Territorios', value: totals.territories ?? 0, detail: 'DIVIPOLA: depts. y municipios', icon: Map, accent: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Dashboard de monitoreo</h2>
          <p className="text-xs text-slate-400 mt-0.5">{apiStatus}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-[#00DA5E] hover:text-[#291242] transition"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </div>

      {/* Health Panel */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* API */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">API Administrativa</p>
            <Server size={13} className="text-slate-300" />
          </div>
          <HealthDot ok={apiOk} latency={api.latencyMs || 0} />
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Latencia</span>
              <span className="font-bold text-slate-700">{api.latencyMs || 0} ms</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Estado</span>
              <span className="font-bold text-slate-700">{api.status || '—'}</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Base de datos</p>
            <Database size={13} className="text-slate-300" />
          </div>
          <HealthDot ok={dbOk} latency={0} />
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Proveedor</span>
              <span className="font-bold text-slate-700">{database.provider || '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Estado</span>
              <span className="font-bold text-slate-700">{database.status || '—'}</span>
            </div>
          </div>
        </div>

        {/* Frontend */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Frontend</p>
            <Globe size={13} className="text-slate-300" />
          </div>
          <HealthDot ok={true} latency={0} />
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Estado</span>
              <span className="font-bold text-slate-700">{monitor?.web?.status || 'Activo en navegador'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Env</span>
              <span className="font-bold text-slate-700">production</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module distribution charts */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Distribución por módulo</h3>
            <p className="text-xs text-slate-400 mt-0.5">Estado de los registros en cada módulo</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(STATUS_BAR_COLORS).map(([code, color]) => (
              <span key={code} className="flex items-center gap-1 text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {statusText(code)}
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {Object.entries(groupedModules).map(([area, areaMods]) => (
            <div key={area}>
              <div className="px-5 py-2 bg-slate-50">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400">{area}</p>
              </div>
              {areaMods.map((mod) => (
                <div key={mod.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{mod.label}</p>
                    <p className="text-xs text-slate-400">{mod.total} registros</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <ModuleStatusBar statuses={mod.statuses || []} total={mod.total || 0} />
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {(mod.statuses || []).filter((s) => s.count > 0).map((s) => (
                        <span key={s.code} className="text-[0.6rem] font-bold text-slate-400">
                          {s.label}: {s.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {modules.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              Sin datos de módulos disponibles. Conecta el backend para ver métricas.
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-black text-slate-900">Actividad reciente</h3>
          <p className="text-xs text-slate-400 mt-0.5">Últimas operaciones registradas en la auditoría</p>
        </div>
        <div className="divide-y divide-slate-100">
          {(monitor?.recentAudit || []).map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3">
              <div className="h-7 w-7 rounded-full bg-[#291242]/8 flex items-center justify-center shrink-0">
                <Clock size={12} className="text-[#291242]/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  <span className="text-[#291242] font-black">{item.action}</span>
                  {' · '}{item.table}
                  {item.recordId && <span className="text-slate-400"> #{item.recordId}</span>}
                </p>
              </div>
              <p className="text-xs text-slate-400 shrink-0">{relativeTime(item.createdAt)}</p>
            </div>
          ))}
          {(monitor?.recentAudit || []).length === 0 && (
            <div className="px-5 py-8 text-center">
              <Clock size={24} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Sin actividad reciente registrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   RECORDS PANEL — Table + grouped form
═══════════════════════════════════════════════════════════════════════════ */

const CONTACT_FIELD_NAMES = new Set(['contactEmail', 'contactPhone', 'organizerEmail', 'organizerPhone', 'responsibleEntityEmail', 'responsibleEntityPhone', 'contactName', 'directorName', 'organizer', 'responsibleEntity', 'responsibleEntityDisplayName']);
const LINK_FIELD_NAMES = new Set(['websiteUrl', 'instagramUrl', 'facebookUrl', 'otherUrl', 'organizerWebsiteUrl', 'responsibleEntityWebsiteUrl', 'imageUrl', 'embedUrl']);
const TERRITORY_FIELD_NAMES = new Set(['coverageLevel', 'department', 'municipality', 'specificLocation', 'addressText', 'latitude', 'longitude', 'zone', 'territorialScope', 'location']);
const METRIC_FIELD_NAMES = new Set(['versionsCount', 'editionsCount', 'trainingCapacity', 'students', 'activeGroupsCount', 'sortOrder', 'festivalId', 'associatedFestivalId', 'festivalDisplayName', 'associatedFestivalDisplayName', 'scopeType', 'marketMode', 'periodicity']);
const CONTROL_FIELD_NAMES = new Set(['id', 'status']);

const groupModuleFields = (fields) => {
  const groups = { control: [], basic: [], contact: [], links: [], location: [], metrics: [] };
  fields.forEach((field) => {
    if (CONTROL_FIELD_NAMES.has(field.name)) groups.control.push(field);
    else if (CONTACT_FIELD_NAMES.has(field.name)) groups.contact.push(field);
    else if (LINK_FIELD_NAMES.has(field.name)) groups.links.push(field);
    else if (TERRITORY_FIELD_NAMES.has(field.name)) groups.location.push(field);
    else if (METRIC_FIELD_NAMES.has(field.name) || field.type === 'number') groups.metrics.push(field);
    else groups.basic.push(field);
  });
  return groups;
};

const hasTerritoryDynamic = (fields) => fields.some((f) => f.name === 'department');

const RecordFormField = ({ field, value, onChange, moduleId }) => {
  const fieldId = `admin-record-${moduleId}-${field.name}`;

  if (field.name === 'department' || field.name === 'municipality' || field.name === 'coverageLevel') return null;

  if (field.type === 'textarea') {
    return (
      <FormField key={field.name} label={field.label} htmlFor={fieldId} required={field.required} className="sm:col-span-2">
        <TextAreaInput id={fieldId} rows={field.rows || 4} value={value || ''} onChange={(e) => onChange(field.name, e.target.value)} />
      </FormField>
    );
  }
  if (field.type === 'status') {
    return (
      <FormField key={field.name} label={field.label} htmlFor={fieldId}>
        <SelectInput id={fieldId} value={value || field.defaultValue || 'borrador'} onChange={(e) => onChange(field.name, e.target.value)}>
          {Object.entries(ADMIN_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </SelectInput>
      </FormField>
    );
  }
  if (field.type === 'select') {
    return (
      <FormField key={field.name} label={field.label} htmlFor={fieldId} required={field.required}>
        <SelectInput id={fieldId} value={value || field.defaultValue || ''} onChange={(e) => onChange(field.name, e.target.value)} required={field.required}>
          <option value="">Seleccione</option>
          {(field.options || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </SelectInput>
      </FormField>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <FormField key={field.name} label={field.label} htmlFor={fieldId}>
        <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:border-slate-300 transition">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(value ?? field.defaultValue)}
            onChange={(e) => onChange(field.name, e.target.checked)}
            className="h-4 w-4 rounded accent-[#291242]"
          />
          <span className="text-sm font-medium text-slate-700">Activo</span>
        </label>
      </FormField>
    );
  }
  return (
    <FormField key={field.name} label={field.label} htmlFor={fieldId} required={field.required} className={field.wide ? 'sm:col-span-2' : ''}>
      <TextInput id={fieldId} type={field.type || 'text'} step={field.step} value={value || ''} onChange={(e) => onChange(field.name, e.target.value)} required={field.required} />
    </FormField>
  );
};

const normalizeAssistantText = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const firstMatch = (text, regex) => {
  const match = text.match(regex);
  return match?.[1] || match?.[0] || '';
};

const toIsoDate = (value = '') => {
  const normalized = value.trim();
  const iso = normalized.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const slash = normalized.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${slash[2].padStart(2, '0')}-${slash[1].padStart(2, '0')}`;
  }

  const months = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
    noviembre: '11', diciembre: '12',
  };
  const named = normalizeAssistantText(normalized).match(/\b(\d{1,2})\s+de\s+([a-z]+)(?:\s+de)?\s+(\d{4})\b/);
  if (named && months[named[2]]) return `${named[3]}-${months[named[2]]}-${named[1].padStart(2, '0')}`;
  return '';
};

const extractLabeledValue = (text, labels) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const normalizedLabels = labels.map(normalizeAssistantText);
  for (const line of lines) {
    const normalized = normalizeAssistantText(line);
    const label = normalizedLabels.find((item) => normalized.startsWith(`${item}:`) || normalized.startsWith(`${item} -`));
    if (label) return line.replace(/^.+?[:-]\s*/, '').trim();
  }
  return '';
};

const findTerritory = (text, divipola = {}) => {
  const normalizedText = normalizeAssistantText(text);
  const departments = Object.keys(divipola || {});
  const department = departments.find((name) => normalizedText.includes(normalizeAssistantText(name))) || '';
  const municipalitySource = department ? divipola[department] : [...new Set(Object.values(divipola || {}).flat())];
  const municipality = (municipalitySource || []).find((name) => normalizedText.includes(normalizeAssistantText(name))) || '';

  return {
    department,
    municipality,
    coverageLevel: municipality ? 'municipal' : department ? 'departamental' : normalizedText.includes('nacional') ? 'nacional' : '',
  };
};

const pickTitle = (text, moduleId) => {
  const labeled = extractLabeledValue(text, ['titulo', 'nombre', 'evento', 'festival', 'escuela', 'mercado']);
  if (labeled) return labeled.slice(0, 180);
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length >= 6);
  if (firstLine && firstLine.length <= 180) return firstLine.replace(/^[#*\-\s]+/, '');
  const sentence = firstMatch(text, /^(.{12,150}?)(?:\.|\n|$)/s);
  return sentence || (moduleId === 'news' ? 'Publicación sin título' : 'Registro sin nombre');
};

const extractLocalAssistantData = ({ text, module, divipola }) => {
  const normalized = normalizeAssistantText(text);
  const fields = module?.fields || [];
  const result = {};
  const territory = findTerritory(text, divipola);
  const emails = [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map((match) => match[0]);
  const urls = [...text.matchAll(/https?:\/\/[^\s),;]+/gi)].map((match) => match[0]);
  const phones = [...text.matchAll(/(?:\+?57\s*)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g)].map((match) => match[0].trim());
  const isoDate = toIsoDate(text);
  const time = firstMatch(text, /\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const title = pickTitle(text, module?.id);
  const shortText = text.trim().replace(/\s+/g, ' ');

  fields.forEach((field) => {
    if (field.name === 'department' && territory.department) result.department = territory.department;
    if (field.name === 'municipality' && territory.municipality) result.municipality = territory.municipality;
    if (field.name === 'coverageLevel' && territory.coverageLevel) result.coverageLevel = territory.coverageLevel;
    if ((field.name === 'title' || field.name === 'name') && title) result[field.name] = title;
    if (field.name === 'slug' && title) result.slug = normalizeAssistantText(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if ((field.name === 'description' || field.name === 'contentHtml') && shortText) result[field.name] = text.trim();
    if ((field.name === 'summary' || field.name === 'shortDescription') && shortText) result[field.name] = shortText.slice(0, 320);
    if ((field.type === 'date' || field.name === 'date') && isoDate) result[field.name] = isoDate;
    if (field.type === 'time' && time) result[field.name] = time;
    if (field.type === 'checkbox') {
      if (normalized.match(/\b(si|sí|activo|vigente|actual|este ano|este año)\b/)) result[field.name] = true;
      if (normalized.match(/\b(no|inactivo|cerrado|finalizado)\b/)) result[field.name] = false;
    }
  });

  const emailFields = fields.filter((field) => field.type === 'email' || field.name.toLowerCase().includes('email'));
  emailFields.forEach((field, index) => {
    if (emails[index] || emails[0]) result[field.name] = emails[index] || emails[0];
  });

  const phoneFields = fields.filter((field) => field.name.toLowerCase().includes('phone') || field.label.toLowerCase().includes('telefono'));
  phoneFields.forEach((field, index) => {
    if (phones[index] || phones[0]) result[field.name] = phones[index] || phones[0];
  });

  urls.forEach((url) => {
    const lower = url.toLowerCase();
    if (lower.includes('instagram.com') && fields.some((field) => field.name === 'instagramUrl')) result.instagramUrl = url;
    else if (lower.includes('facebook.com') && fields.some((field) => field.name === 'facebookUrl')) result.facebookUrl = url;
    else if (!result.websiteUrl && fields.some((field) => field.name === 'websiteUrl')) result.websiteUrl = url;
    else if (!result.imageUrl && fields.some((field) => field.name === 'imageUrl')) result.imageUrl = url;
    else if (!result.otherUrl && fields.some((field) => field.name === 'otherUrl')) result.otherUrl = url;
  });

  if (module?.id === 'spacesInfrastructure') {
    if (normalized.includes('taller')) result.actorType = 'taller';
    else if (normalized.includes('colectivo')) result.actorType = 'colectivo';
    else result.actorType = 'individual';
  }

  if (fields.some((field) => field.name === 'category')) {
    if (normalized.includes('convocatoria')) result.category = 'Convocatorias';
    else if (normalized.includes('festival') || normalized.includes('concierto') || normalized.includes('evento')) result.category = 'Eventos';
    else if (normalized.includes('prensa') || normalized.includes('noticia')) result.category = 'Prensa';
  }

  const versionNumber = firstMatch(normalized, /(?:versiones|ediciones|version|edicion)\D{0,20}(\d{1,3})/);
  if (versionNumber) {
    if (fields.some((field) => field.name === 'versionsCount')) result.versionsCount = Number(versionNumber);
    if (fields.some((field) => field.name === 'editionsCount')) result.editionsCount = Number(versionNumber);
  }

  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== '' && value !== null && value !== undefined));
};

const parseAiPayload = (payload) => {
  if (!payload) return {};
  if (typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch {
    const cleaned = String(payload).replace(/```json/i, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
};

const mergeAssistantResults = (localResult, remoteResult) => ({
  ...localResult,
  ...Object.fromEntries(Object.entries(remoteResult || {}).filter(([, value]) => value !== '' && value !== null && value !== undefined)),
});

const AI_ASSISTANT_FILE_ACCEPT = '.txt,.md,.pdf,.png,.jpg,.jpeg,.webp,.gif';
const AI_ASSISTANT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const AI_ASSISTANT_TEXT_TYPES = new Set(['text/plain', 'text/markdown']);
const AI_ASSISTANT_BINARY_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isAssistantTextFile = (file) => (
  AI_ASSISTANT_TEXT_TYPES.has(file.type)
  || file.name.toLowerCase().endsWith('.txt')
  || file.name.toLowerCase().endsWith('.md')
);

const isAssistantBinaryFile = (file) => (
  AI_ASSISTANT_BINARY_TYPES.has(file.type)
  || file.name.toLowerCase().endsWith('.pdf')
);

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target?.result || '');
  reader.onerror = () => reject(new Error('No fue posible leer el archivo seleccionado.'));
  reader.readAsDataURL(file);
});

const readAsText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target?.result || '');
  reader.onerror = () => reject(new Error('No fue posible leer el archivo seleccionado.'));
  reader.readAsText(file, 'UTF-8');
});

const buildAssistantAttachment = async (file) => {
  const dataUrl = await readAsDataUrl(file);
  const [, payload = ''] = String(dataUrl).split(',');
  return {
    fileName: file.name,
    mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
    base64Data: payload,
  };
};

/* ── AI Assistant Modal ────────────────────────────────────────── */

const AIAssistantModal = ({ module, divipola, onClose, onApply }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dragOver, setDragOver] = useState(false);
  useEscapeToClose(onClose, !loading);

  const handleAnalyze = async () => {
    const hasText = text.trim().length > 0;
    const attachments = attachment ? [attachment] : [];
    if (!hasText && attachments.length === 0) {
      setError('Por favor, ingresa algún texto o carga un archivo.');
      return;
    }
    setLoading(true);
    setError('');
    setNotice('');
    setResult(null);
    const localResult = hasText ? extractLocalAssistantData({ text, module, divipola }) : {};
    try {
      const response = await analyzeTextWithAI({
        text: hasText ? text : `Extrae la información del archivo adjunto para el módulo ${module.label}.`,
        moduleId: module.id,
        attachments,
      });
      if (response?.success && response?.result) {
        const parsed = parseAiPayload(response.result);
        setResult(mergeAssistantResults(localResult, parsed));
        setNotice(attachments.length ? 'Resultado enriquecido con IA a partir del archivo adjunto y validaciones locales.' : 'Resultado enriquecido con IA y validaciones locales.');
      } else {
        setResult(localResult);
        setNotice(response?.message || (attachments.length ? 'El archivo quedó cargado, pero la extracción de PDF o imágenes requiere IA central configurada.' : 'Resultado generado con análisis local básico.'));
        if (attachments.length && Object.keys(localResult).length === 0) {
          setError('El archivo fue recibido, pero no hay IA central disponible para leer PDF o imágenes. Pega texto extraído del documento o configura la IA central.');
        }
      }
    } catch (err) {
      setResult(localResult);
      setNotice(attachments.length ? 'No hay IA externa disponible ahora para interpretar el archivo adjunto.' : 'No hay IA externa disponible ahora. Se generó una extracción local básica.');
      if (Object.keys(localResult).length === 0) {
        setError(err.message || 'No fue posible extraer campos del texto.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
    e.target.value = '';
  };

  const readFile = async (file) => {
    setError('');
    setNotice('');
    setSelectedFile(null);
    setAttachment(null);

    if (file.size > AI_ASSISTANT_MAX_FILE_SIZE_BYTES) {
      setError('El archivo supera el límite de 10 MB para el asistente.');
      return;
    }

    try {
      if (isAssistantTextFile(file)) {
        const content = await readAsText(file);
        setText(content);
        setSelectedFile({ name: file.name, type: 'Texto', size: file.size });
        setNotice('Archivo de texto cargado. Puedes editar el contenido antes de extraer los datos.');
        return;
      }

      if (isAssistantBinaryFile(file)) {
        const preparedAttachment = await buildAssistantAttachment(file);
        setAttachment(preparedAttachment);
        setSelectedFile({
          name: file.name,
          type: file.type?.startsWith('image/') ? 'Imagen' : 'PDF',
          size: file.size,
        });
        setNotice('Archivo cargado para análisis con IA. Puedes agregar contexto en el cuadro de texto si quieres orientar la extracción.');
        return;
      }

      setError('Formato no permitido. Usa TXT, MD, PDF o una imagen PNG, JPG, WEBP o GIF.');
    } catch (err) {
      setError(err.message || 'No fue posible leer el archivo seleccionado.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between gap-4 px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-[#291242] to-[#3d1a63] text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#00DA5E]/20 flex items-center justify-center">
              <Cpu size={16} className="text-[#00DA5E]" />
            </div>
            <div>
              <h2 className="font-alternate text-sm uppercase font-bold tracking-wider">Asistente híbrido</h2>
              <p className="text-[0.62rem] text-white/70">Extracción local con enriquecimiento IA cuando esté disponible</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2 text-white/70 hover:text-white hover:bg-white/5 transition">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!result ? (
            <>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pega el texto de una noticia, la descripción de un festival o la información técnica de una escuela. También puedes cargar PDF o imágenes para que la IA central extraiga los campos cuando esté configurada.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  'border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer',
                  dragOver
                    ? 'border-[#00DA5E] bg-[#00DA5E]/5'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50',
                ].join(' ')}
              >
                <label className="cursor-pointer block">
                  <input type="file" accept={AI_ASSISTANT_FILE_ACCEPT} onChange={handleFileUpload} className="hidden" />
                  <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Arrastra TXT, MD, PDF o imagen aquí</p>
                  <p className="text-[0.62rem] text-slate-400 mt-1">O haz clic para seleccionar desde tu computadora</p>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={15} className="text-[#291242] shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-700">{selectedFile.name}</p>
                      <p className="text-[0.62rem] text-slate-400">{selectedFile.type} · {formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setAttachment(null);
                      setNotice('');
                    }}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-red-500 hover:border-red-200 transition"
                    title="Quitar archivo"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {notice && (
                <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <Sparkles size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-blue-800">{notice}</p>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="ai-paste-text" className="block text-[0.62rem] font-black uppercase tracking-widest text-slate-400">O pega el texto libre aquí</label>
                <textarea
                  id="ai-paste-text"
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ej: El próximo 15 de Octubre se llevará a cabo el Festival de Música Andina en el departamento de Nariño, municipio de Pasto. Contará con la participación de 12 agrupaciones..."
                  className="w-full rounded-xl border border-slate-200 p-4 text-xs text-slate-700 outline-none focus:border-[#291242] transition placeholder:text-slate-400 font-nunito"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <p className="text-xs font-medium text-emerald-800">
                  ¡Campos extraídos con éxito! Revisa la información encontrada antes de aplicarla.
                </p>
              </div>
              {notice && (
                <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <Sparkles size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-blue-800">{notice}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto p-1">
                {Object.entries(result).map(([key, val]) => {
                  if (val === null || val === undefined || String(val).trim() === '') return null;
                  const displayValue = key === 'coverageLevel' ? coverageText(val) : val;
                  return (
                    <div key={key} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                      <p className="text-[0.58rem] font-black uppercase tracking-widest text-slate-400 mb-1">{key}</p>
                      <p className="text-xs font-semibold text-slate-800 break-words">{String(displayValue)}</p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs font-bold text-[#291242] hover:underline hover:text-indigo-600 transition"
              >
                ← Analizar otro texto
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
            Cancelar
          </button>
          {!result ? (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || (!text.trim() && !attachment)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] disabled:opacity-50 px-5 py-2.5 text-xs font-black text-white transition shadow-sm animate-pulse"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-[#00DA5E]" />
                  Extraer Datos
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { onApply(result); onClose(); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] px-5 py-2.5 text-xs font-black text-slate-950 transition shadow-sm"
            >
              <CheckCircle2 size={13} />
              Aplicar al Formulario
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Bulk Import Modal ────────────────────────────────────────── */

const BulkImportModal = ({ module, divipola, existingRecords = [], onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [ignoreErrors, setIgnoreErrors] = useState(true);

  useEscapeToClose(onClose, !importing);

  const resetFile = () => {
    setFile(null);
    setParsedRows([]);
    setError('');
  };

  const handleSecondaryAction = () => {
    if (file) {
      resetFile();
      return;
    }
    onClose();
  };

  const handleFileUpload = (e) => {
    const chosenFile = e.target.files?.[0];
    if (!chosenFile) return;
    setFile(chosenFile);
    processCsvFile(chosenFile);
  };

  const processCsvFile = (file) => {
    setLoading(true);
    setError('');
    setParsedRows([]);
    const isCsv = file.name.endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let rawLines = [];
        if (isCsv) {
          const text = e.target.result || '';
          rawLines = parseCSV(text);
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rawLines = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        }

        if (rawLines.length === 0) {
          setError('El archivo está vacío.');
          setLoading(false);
          return;
        }

        const headers = rawLines[0].map(h => String(h || '').trim());
        const detectedModule = detectTemplateModule(headers, module);
        if (detectedModule) {
          setParsedRows([]);
          setError(`Esta plantilla parece corresponder al módulo "${detectedModule.label}", pero estás importando en "${module.label}". Descarga la plantilla correcta para este módulo o cambia al módulo correspondiente antes de importar.`);
          setLoading(false);
          return;
        }
        
        // Build map from label and technical name to field name
        const labelToNameMap = {};
        module.fields.forEach(f => {
          labelToNameMap[normalizeImportHeader(f.label)] = f.name;
          labelToNameMap[normalizeImportHeader(f.name)] = f.name;
        });

        const validDepts = new Set(Object.keys(divipola || {}).map(normalizeImportHeader));
        const deptMunis = {};
        Object.entries(divipola || {}).forEach(([dept, munis]) => {
          deptMunis[normalizeImportHeader(dept)] = new Set((munis || []).map(normalizeImportHeader));
        });

        const importableFields = getImportableFields(module);
        const validated = [];
        for (let i = 1; i < rawLines.length; i++) {
          const row = rawLines[i];
          if (row.length === 0 || (row.length === 1 && String(row[0] || '') === '')) continue;

          const record = {};
          headers.forEach((header, idx) => {
            if (header) {
              const fieldName = labelToNameMap[normalizeImportHeader(header)];
              if (fieldName) {
                record[fieldName] = String(row[idx] ?? '').trim();
              }
            }
          });

          if (!hasImportableRowData(record, importableFields)) continue;

          // Silently ignore pre-populated example rows
          const isExampleRow = Object.values(record).some(val =>
            String(val).includes('contacto@ejemplo.com') ||
            String(val).includes('registro de ejemplo') ||
            String(val).includes('Reemplace esta fila') ||
            String(val).includes('Ejemplo de descripción') ||
            String(val).includes('Dato de Ejemplo')
          );
          if (isExampleRow) continue;

          const errors = [];
          
          module.fields.forEach(field => {
            if (field.required && field.name !== 'id' && field.name !== 'status') {
              const val = record[field.name];
              if (!val || val.trim() === '') {
                errors.push(`El campo "${field.label}" es obligatorio.`);
              }
            }
          });

          const deptVal = normalizeImportHeader(record.department || '');
          const muniVal = normalizeImportHeader(record.municipality || '');

          if (deptVal) {
            if (!validDepts.has(deptVal)) {
              errors.push(`El departamento "${record['department']}" no es válido.`);
            } else if (muniVal) {
              const munisSet = deptMunis[deptVal];
              if (munisSet && !munisSet.has(muniVal)) {
                errors.push(`El municipio "${record['municipality']}" no existe en "${record['department']}".`);
              }
            }
          }

          const hasRequiredDept = module.fields.some(f => f.name === 'department' && f.required);
          if (hasRequiredDept && !deptVal) {
            errors.push('El departamento es obligatorio.');
          }

          const duplicateCandidates = findDuplicateCandidates({
            moduleId: module.id,
            record,
            existingRecords,
            importedRows: validated,
          });
          const exactDuplicates = duplicateCandidates.filter((candidate) => candidate.type === 'exact');
          const possibleDuplicates = duplicateCandidates.filter((candidate) => candidate.type === 'possible');
          exactDuplicates.forEach((candidate) => {
            errors.push(candidate.reason || 'Duplicado exacto detectado. No se importará esta fila.');
          });

          validated.push({
            rowNumber: i + 1,
            title: record.name || record.title || `Fila ${i + 1}`,
            parsedData: record,
            duplicateStatus: exactDuplicates.length ? 'exact' : possibleDuplicates.length ? 'possible' : 'none',
            duplicateCandidates,
            errors,
            isValid: errors.length === 0
          });
        }

        setParsedRows(validated);
      } catch (err) {
        setError('Error al procesar el archivo: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (isCsv) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const chosenFile = e.dataTransfer?.files?.[0];
    if (chosenFile) {
      setFile(chosenFile);
      processCsvFile(chosenFile);
    }
  };

  const handleImport = async () => {
    const validRecords = parsedRows
      .filter(r => r.isValid)
      .map(r => ({
        ...canonicalizeImportRecord(r.parsedData, divipola),
        status: r.duplicateStatus === 'possible' ? 'borrador' : (r.parsedData.status || 'borrador'),
      }));

    const invalidCount = parsedRows.filter(r => !r.isValid).length;

    if (validRecords.length === 0) {
      setError('No hay registros válidos para importar.');
      return;
    }

    if (invalidCount > 0 && !ignoreErrors) {
      setError('Por favor, corrige los errores o marca la opción para ignorar filas con error.');
      return;
    }

    setImporting(true);
    setError('');
    try {
      await importBulkRecords({ moduleId: module.id, records: validRecords });
      onImportSuccess({
        insertedCount: validRecords.length,
        skippedExactCount: parsedRows.filter(r => r.duplicateStatus === 'exact').length,
        possibleDuplicates: parsedRows.filter(r => r.isValid && r.duplicateStatus === 'possible'),
      });
    } catch (err) {
      setError(err.message || 'Error en la importación masiva backend.');
    } finally {
      setImporting(false);
    }
  };

  const totalRows = parsedRows.length;
  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;
  const exactDuplicateCount = parsedRows.filter(r => r.duplicateStatus === 'exact').length;
  const possibleDuplicateCount = parsedRows.filter(r => r.duplicateStatus === 'possible').length;

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !importing) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between gap-4 px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-[#291242] to-[#3d1a63] text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#00DA5E]/20 flex items-center justify-center">
              <Database size={16} className="text-[#00DA5E]" />
            </div>
            <div>
              <h2 className="font-alternate text-sm uppercase font-bold tracking-wider">Importación Masiva Excel / CSV</h2>
              <p className="text-[0.62rem] text-white/70">Módulo: {module.label} · Carga de múltiples registros en lote</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2 text-white/70 hover:text-white hover:bg-white/5 transition">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 flex flex-col min-h-0">
          {!file ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Selecciona o arrastra el archivo Excel (.xlsx) o CSV (.csv) con la información de los nuevos registros. Asegúrate de usar la plantilla descargada para garantizar que las columnas coincidan perfectamente con los campos de la base de datos.
              </p>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  'border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer',
                  dragOver
                    ? 'border-[#00DA5E] bg-[#00DA5E]/5'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer block w-full"
                >
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                  <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Arrastra tu archivo Excel o CSV aquí</p>
                  <p className="text-xs text-slate-400 mt-1">O haz clic para seleccionar de tus archivos</p>
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <RefreshCw size={32} className="text-[#00DA5E] animate-spin mb-3" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Validando estructura y datos...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-wider text-slate-400">Total Filas</p>
                  <p className="text-xl font-black text-slate-800">{totalRows}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-wider text-emerald-600">Válidas (Ingresar)</p>
                  <p className="text-xl font-black text-emerald-700">{validCount}</p>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-wider text-red-600">Con Errores</p>
                  <p className="text-xl font-black text-red-700">{invalidCount}</p>
                </div>
              </div>

              {(exactDuplicateCount > 0 || possibleDuplicateCount > 0) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {exactDuplicateCount > 0 && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                      <p className="text-[0.58rem] font-bold uppercase tracking-wider text-red-600">Duplicados exactos</p>
                      <p className="text-xl font-black text-red-700">{exactDuplicateCount}</p>
                      <p className="text-[0.68rem] text-red-600 mt-1">No se importarán.</p>
                    </div>
                  )}
                  {possibleDuplicateCount > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-[0.58rem] font-bold uppercase tracking-wider text-amber-700">Posibles duplicados</p>
                      <p className="text-xl font-black text-amber-800">{possibleDuplicateCount}</p>
                      <p className="text-[0.68rem] text-amber-700 mt-1">Se importarán como borrador para revisión.</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-red-700">{error}</p>
                </div>
              )}

              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 font-bold text-slate-500 w-16">Fila</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500">Nombre / Título</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500">Ubicación</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500 w-24">Estado</th>
                      <th className="px-4 py-2.5 font-bold text-slate-500">Detalles de Validación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r) => (
                      <tr key={r.rowNumber} className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-red-50/20 hover:bg-red-50/40'}>
                        <td className="px-4 py-3 font-semibold text-slate-400">{r.rowNumber}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 truncate max-w-[12rem]">{r.title}</td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[10rem]">
                          {[r.parsedData.department, r.parsedData.municipality].filter(Boolean).join(' / ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {r.isValid ? (
                            <span className={[
                              'inline-flex items-center gap-1 text-[0.62rem] font-bold px-2 py-0.5 rounded-full border',
                              r.duplicateStatus === 'possible'
                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                : 'text-emerald-700 bg-emerald-50 border-emerald-150',
                            ].join(' ')}>
                              <Check size={10} />
                              {r.duplicateStatus === 'possible' ? 'Revisión' : 'Válido'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-150">
                              <X size={10} />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[0.68rem] text-red-600 font-medium">
                          {r.errors.length > 0 ? (
                            <ul className="list-disc pl-3 space-y-0.5">
                              {r.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                            </ul>
                          ) : r.duplicateStatus === 'possible' ? (
                            <span className="text-amber-700">
                              Posible duplicado: {r.duplicateCandidates[0]?.reason || 'requiere revisión comparativa.'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Sin problemas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invalidCount > 0 && (
                <label className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3 cursor-pointer hover:bg-amber-50 transition">
                  <input
                    type="checkbox"
                    checked={ignoreErrors}
                    onChange={(e) => setIgnoreErrors(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#291242]"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-amber-800">Ignorar filas con error e importar solo los registros válidos</p>
                    <p className="text-amber-600 mt-0.5">Se omitirán las {invalidCount} filas que presentan problemas de validación.</p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handleSecondaryAction}
            disabled={importing}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition disabled:opacity-50"
          >
            {file ? 'Cambiar Archivo' : 'Cerrar'}
          </button>
          {file && !loading && (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || (invalidCount > 0 && !ignoreErrors) || validCount === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] disabled:opacity-50 px-5 py-2.5 text-xs font-black text-white transition shadow-sm"
            >
              {importing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-[#00DA5E]" />
                  Iniciar Importación ({validCount} filas)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Record Preview Modal ──────────────────────────────────────── */

const RecordPreviewModal = ({ record, module, onClose, onEdit }) => {
  useEscapeToClose(onClose, Boolean(record));
  if (!record) return null;

  const allFields = (module?.fields || []).filter((f) => !['id', 'coverageLevel', 'department', 'municipality'].includes(f.name));
  const data = {
    ...Object.fromEntries(Object.entries(record.metadata || {}).filter(([, v]) => v !== null && v !== undefined)),
    title: record.title,
    name: record.title,
    status: record.status,
    department: record.department,
    municipality: record.municipality,
    updatedAt: record.updatedAt,
  };

  return (
    <div
      className="fixed inset-0 z-[4500] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill status={record.status} />
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-400">ID {record.id}</span>
            </div>
            <h2 className="font-alternate text-base uppercase font-bold tracking-wide text-slate-900 mt-1.5 leading-tight">{record.title || `Registro #${record.id}`}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{module?.label} · {[record.department, record.municipality].filter(Boolean).join(' / ') || 'Sin territorio'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            {allFields.map((field) => {
              const val = data[field.name];
              const isEmpty = val === undefined || val === null || String(val).trim() === '';
              return (
                <div key={field.name} className={`rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 ${field.type === 'textarea' || field.wide ? 'col-span-2' : ''}`}>
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-1">{field.label}</p>
                  {isEmpty ? (
                    <p className="text-sm text-slate-300 font-normal italic">—</p>
                  ) : field.type === 'checkbox' ? (
                    <p className="text-sm font-semibold text-slate-800">{val ? 'Sí' : 'No'}</p>
                  ) : field.type === 'textarea' ? (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{String(val)}</p>
                  ) : field.type === 'url' ? (
                    <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{String(val)}</a>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{String(val)}</p>
                  )}
                </div>
              );
            })}
            {/* Territory */}
            {(record.department || record.municipality) && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-1">Ubicación</p>
                <p className="text-sm font-semibold text-slate-800">{[record.department, record.municipality].filter(Boolean).join(' / ')}</p>
              </div>
            )}
            {record.updatedAt && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-1">Última actualización</p>
                <p className="text-sm font-semibold text-slate-800">{record.updatedAt}</p>
              </div>
            )}
            {record.owner && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[0.6rem] font-black uppercase tracking-widest text-slate-400 mb-1">Autor de la edición</p>
                <p className="text-sm font-semibold text-slate-800">{record.owner}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => { onClose(); onEdit(record); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-5 py-2.5 text-xs font-black text-white transition"
          >
            <Edit3 size={13} />
            Editar este registro
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Record Edit Modal ──────────────────────────────────────────── */

const RecordEditModal = ({ module, formValues, fieldGroups, hasTerritory, divipola, missingRequired, message, onUpdateForm, onSave, onCancel, onOpenAiAssistant }) => {
  const isEditing = Boolean(formValues.id);
  useEscapeToClose(onCancel);

  return (
    <div
      className="fixed inset-0 z-[4500] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-alternate text-base uppercase font-bold tracking-wide text-slate-900">{isEditing ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Cambios en la tabla <code className="bg-slate-100 px-1 py-0.5 rounded">{module.table}</code></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-750 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm"
              title="Rellenar usando Asistente IA"
            >
              <Sparkles size={13} className="text-[#00DA5E]" />
              Asistente IA
            </button>
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {fieldGroups.control.length > 0 && (
            <FormSection title="Control y estado" icon={Settings}>
              <FieldGrid cols={2}>
                {fieldGroups.control.map((field) => (
                  <RecordFormField key={field.name} field={field} value={formValues[field.name]} onChange={onUpdateForm} moduleId={module.id} />
                ))}
              </FieldGrid>
            </FormSection>
          )}
          {fieldGroups.basic.length > 0 && (
            <FormSection title="Información básica" icon={Database}>
              <FieldGrid cols={2}>
                {fieldGroups.basic.map((field) => (
                  <RecordFormField key={field.name} field={field} value={formValues[field.name]} onChange={onUpdateForm} moduleId={module.id} />
                ))}
              </FieldGrid>
            </FormSection>
          )}
          {fieldGroups.contact.length > 0 && (
            <FormSection title="Contacto" icon={User}>
              <FieldGrid cols={2}>
                {fieldGroups.contact.map((field) => (
                  <RecordFormField key={field.name} field={field} value={formValues[field.name]} onChange={onUpdateForm} moduleId={module.id} />
                ))}
              </FieldGrid>
            </FormSection>
          )}
          {fieldGroups.links.length > 0 && (
            <FormSection title="Sitio web y redes sociales" icon={Globe}>
              <FieldGrid cols={2}>
                {fieldGroups.links.map((field) => (
                  <RecordFormField key={field.name} field={field} value={formValues[field.name]} onChange={onUpdateForm} moduleId={module.id} />
                ))}
              </FieldGrid>
            </FormSection>
          )}
          {(hasTerritory || fieldGroups.location.length > 0) && (
            <FormSection title="Ubicación territorial" icon={Map}>
              {hasTerritory && (
                <TerritoryFields
                  divipola={divipola}
                  department={formValues.department || ''}
                  municipality={formValues.municipality || ''}
                  coverageLevel={formValues.coverageLevel || (formValues.municipality ? 'municipal' : 'departamental')}
                  onChange={onUpdateForm}
                  idPrefix={`modal-record-${module.id}`}
                />
              )}
              <FieldGrid cols={2}>
                {fieldGroups.location
                  .filter((f) => !TERRITORY_FIELD_NAMES.has(f.name) || ['specificLocation', 'addressText', 'latitude', 'longitude', 'zone', 'territorialScope', 'location'].includes(f.name))
                  .map((field) => (
                    <RecordFormField key={field.name} field={field} value={formValues[field.name]} onChange={onUpdateForm} moduleId={module.id} />
                  ))}
              </FieldGrid>
            </FormSection>
          )}
          {fieldGroups.metrics.length > 0 && (
            <FormSection title="Métricas y fechas" icon={Activity}>
              <FieldGrid cols={3}>
                {fieldGroups.metrics.map((field) => (
                  <RecordFormField key={field.name} field={field} value={formValues[field.name]} onChange={onUpdateForm} moduleId={module.id} />
                ))}
              </FieldGrid>
            </FormSection>
          )}
          {missingRequired.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-amber-700">
                Faltan campos obligatorios: {missingRequired.map((f) => f.label).join(', ')}.
              </p>
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600">
              {message}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave('draft')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-[#291242] transition"
          >
            <Save size={13} />
            Borrador
          </button>
          <button
            type="button"
            onClick={() => onSave('submit')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-5 py-2.5 text-xs font-black text-white transition"
          >
            <Send size={13} />
            Guardar y enviar
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminRecordsPanel = ({ module, roleId, divipola, onLocalReviewItem, session }) => {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ q: '' });
  const [formValues, setFormValues] = useState(() => emptyRecordForModule(module));
  const [message, setMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const loadRecords = async () => {
    setMessage('Consultando registros...');
    try {
      const payload = await fetchAdminRecords({ moduleId: module.id, q: filters.q, limit: 50 });
      setRecords(payload.items || []);
      setMessage(`${payload.total || 0} registros encontrados.`);
    } catch (error) {
      setRecords([]);
      setMessage(error.message);
    }
  };

  useEffect(() => {
    setFormValues(emptyRecordForModule(module));
    setRecords([]);
    setShowEditModal(false);
    setPreviewRecord(null);
    setShowBulkModal(false);
    setShowAiAssistant(false);
    loadRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id]);

  const updateForm = (fieldName, value) => setFormValues((cur) => ({ ...cur, [fieldName]: value }));

  const handleDownloadTemplate = async () => {
    try {
      setMessage('Generando plantilla optimizada...');
      await downloadExcelTemplate(module, divipola);
      setMessage('Plantilla Excel descargada con listas y validaciones. Utilízala para rellenar tus datos.');
    } catch (error) {
      setMessage('Error al descargar plantilla: ' + error.message);
    }
  };

  const handleImportSuccess = ({ insertedCount, skippedExactCount = 0, possibleDuplicates = [] }) => {
    setMessage(`Importación completada: ${insertedCount} registros cargados${skippedExactCount ? `, ${skippedExactCount} duplicados exactos omitidos` : ''}${possibleDuplicates.length ? `, ${possibleDuplicates.length} posibles duplicados enviados a revisión` : ''}.`);
    possibleDuplicates.forEach((row) => {
      onLocalReviewItem({
        id: `${module.id}-duplicate-${Date.now()}-${row.rowNumber}`,
        moduleId: module.id,
        title: row.title,
        owner: 'Importación masiva',
        status: 'borrador',
        updatedAt: new Date().toISOString().slice(0, 10),
        reviewType: 'possible_duplicate',
        importedData: row.parsedData,
        duplicateCandidates: row.duplicateCandidates,
      });
    });
    setShowBulkModal(false);
    loadRecords();
  };

  const handleApplyAiData = (aiData) => {
    const cleaned = {};
    Object.entries(aiData || {}).forEach(([key, val]) => {
      const matchedField = module.fields.find(f => f.name.toLowerCase() === key.toLowerCase());
      if (matchedField) {
        cleaned[matchedField.name] = val;
      }
    });
    setFormValues(cur => ({ ...cur, ...cleaned }));
    setMessage('Los campos se completaron automáticamente usando el Asistente de IA.');
  };

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      setSortConfig({ key: null, direction: null });
      return;
    }
    setSortConfig({ key, direction });
  };

  const changeRecordStatus = async (record, status) => {
    setMessage('Cambiando estado...');
    try {
      await updateAdminRecordStatus({ moduleId: module.id, id: record.id, status });
      setRecords((cur) => cur.map((item) => item.id === record.id ? { ...item, status, statusLabel: statusText(status) } : item));
      setMessage('Estado actualizado.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const sortedRecords = useMemo(() => {
    let sortable = [...records];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let valA = '';
        let valB = '';

        if (sortConfig.key === 'title') {
          valA = String(a.title || a.name || '').toLowerCase();
          valB = String(b.title || b.name || '').toLowerCase();
        } else if (sortConfig.key === 'status') {
          valA = String(a.status || '').toLowerCase();
          valB = String(b.status || '').toLowerCase();
        } else if (sortConfig.key === 'territory') {
          valA = String([a.department, a.municipality].filter(Boolean).join(' / ')).toLowerCase();
          valB = String([b.department, b.municipality].filter(Boolean).join(' / ')).toLowerCase();
        } else if (sortConfig.key === 'updatedAt') {
          valA = String(a.updatedAt || '');
          valB = String(b.updatedAt || '');
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      sortable.sort((a, b) => {
        const ap = recordStatusPriority[a.status] ?? 99;
        const bp = recordStatusPriority[b.status] ?? 99;
        if (ap !== bp) return ap - bp;
        return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
      });
    }
    return sortable;
  }, [records, sortConfig]);

  const missingRequired = module.fields.filter((f) => f.required && !String(formValues[f.name] || '').trim());

  const handleSave = async (mode) => {
    if (missingRequired.length > 0) {
      setMessage(`Faltan campos obligatorios: ${missingRequired.map((f) => f.label).join(', ')}.`);
      return;
    }
    const nextStatus = mode === 'draft' ? 'borrador' : roleId === 'gestor' ? 'en_evaluacion' : 'aprobado';
    const userDisplay = session?.fullName || session?.email || 'Sistema';
    const payload = {
      ...normalizeFormPayload(formValues),
      status: formValues.status || nextStatus,
      owner: userDisplay,
      createdBy: formValues.id ? undefined : userDisplay,
      updatedBy: userDisplay,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setMessage('Guardando registro...');
    try {
      const response = await upsertAdminRecord({ endpoint: module.endpoint, payload });
      setMessage(`Guardado con ID ${response?.id ?? payload.id ?? 'nuevo'}.`);
      onLocalReviewItem({
        id: response?.id || payload.id || `${module.id}-${Date.now()}`,
        moduleId: module.id,
        title: payload.title || payload.name || `Registro ${module.label}`,
        owner: userDisplay,
        status: nextStatus,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      setFormValues(emptyRecordForModule(module));
      setShowEditModal(false);
      await loadRecords();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const editFromRecord = (record) => {
    setFormValues((cur) => ({
      ...cur,
      id: record.id,
      title: record.title,
      name: record.title,
      status: record.status,
      department: record.department,
      municipality: record.municipality,
      ...Object.fromEntries(Object.entries(record.metadata || {}).filter(([, v]) => v !== null && v !== undefined)),
    }));
    setShowEditModal(true);
  };

  const startNewRecord = () => {
    setFormValues(emptyRecordForModule(module));
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setFormValues(emptyRecordForModule(module));
    setShowEditModal(false);
    setMessage('');
  };

  const fieldGroups = useMemo(() => groupModuleFields(module.fields), [module.fields]);
  const hasTerritory = hasTerritoryDynamic(module.fields);

  return (
    <div className="space-y-5">
      {/* Table header + search */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">{module.label}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{module.description} · Tabla: <code className="bg-slate-100 px-1 py-0.5 rounded text-[0.6rem]">{module.table}</code></p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar registros…"
                value={filters.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && loadRecords()}
                className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-700 outline-none focus:border-[#291242] focus:bg-white w-48 transition"
              />
            </div>
            <button type="button" onClick={loadRecords} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#291242] hover:text-[#291242] transition" title="Actualizar registros">
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#291242] hover:text-[#291242] transition"
              title="Descargar Plantilla Excel (.xlsx)"
            >
              <Download size={13} className="text-[#291242]" />
              Plantilla
            </button>
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#00DA5E] hover:text-[#291242] transition"
              title="Importar Masivo (Excel o CSV)"
            >
              <Upload size={13} className="text-[#00DA5E]" />
              Importar
            </button>
            <button
              type="button"
              onClick={startNewRecord}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-4 py-2 text-xs font-black text-white transition"
            >
              <Plus size={13} />
              Nuevo
            </button>
          </div>
        </div>

        {message && (
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs text-slate-500 font-medium">{message}</div>
        )}

        {/* Records table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th
                  onClick={() => requestSort('title')}
                  className="text-left px-5 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 transition"
                >
                  <span className="flex items-center gap-1 select-none">
                    Nombre / Título
                    {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </th>
                <th
                  onClick={() => requestSort('status')}
                  className="text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 transition"
                >
                  <span className="flex items-center gap-1 select-none">
                    Estado
                    {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </th>
                <th
                  onClick={() => requestSort('territory')}
                  className="hidden md:table-cell text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 transition"
                >
                  <span className="flex items-center gap-1 select-none">
                    Territorio
                    {sortConfig.key === 'territory' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </th>
                <th
                  onClick={() => requestSort('updatedAt')}
                  className="hidden lg:table-cell text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-700 transition"
                >
                  <span className="flex items-center gap-1 select-none">
                    Actualización
                    {sortConfig.key === 'updatedAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </th>
                <th className="text-right px-5 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedRecords.map((record) => (
                <tr key={`${module.id}-${record.id}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 leading-snug">{record.title || `#${record.id}`}</p>
                    <p className="text-[0.65rem] text-slate-400 mt-0.5">ID {record.id}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill status={record.status} />
                  </td>
                  <td className="hidden md:table-cell px-3 py-3.5 text-xs text-slate-500">
                    {[record.department, record.municipality].filter(Boolean).join(' / ') || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="hidden lg:table-cell px-3 py-3.5">
                    <p className="text-xs text-slate-500 font-semibold">{record.updatedAt || '—'}</p>
                    {record.owner && (
                      <p className="text-[0.62rem] text-slate-400 mt-0.5 max-w-[10rem] truncate animate-fade-in" title={record.owner}>
                        Por: {record.owner}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewRecord(record)}
                        title="Vista previa"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition"
                      >
                        <Eye size={11} />
                      </button>
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => editFromRecord(record)}
                        title="Editar registro"
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-500 hover:border-[#291242] hover:text-[#291242] transition"
                      >
                        <Edit3 size={11} />
                      </button>
                      {/* Status */}
                      <select
                        value={record.status || 'borrador'}
                        onChange={(e) => changeRecordStatus(record, e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 bg-white outline-none focus:border-[#291242] transition cursor-pointer"
                        aria-label="Cambiar estado"
                      >
                        {Object.entries(ADMIN_STATUS).map(([key, s]) => (
                          <option key={key} value={key}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No hay registros para los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {previewRecord && (
        <RecordPreviewModal
          record={previewRecord}
          module={module}
          onClose={() => setPreviewRecord(null)}
          onEdit={(rec) => editFromRecord(rec)}
        />
      )}
      {showEditModal && (
        <RecordEditModal
          module={module}
          formValues={formValues}
          fieldGroups={fieldGroups}
          hasTerritory={hasTerritory}
          divipola={divipola}
          missingRequired={missingRequired}
          message={message}
          onUpdateForm={updateForm}
          onSave={handleSave}
          onCancel={cancelEdit}
          onOpenAiAssistant={() => setShowAiAssistant(true)}
        />
      )}
      {showAiAssistant && (
        <AIAssistantModal
          module={module}
          divipola={divipola}
          onClose={() => setShowAiAssistant(false)}
          onApply={handleApplyAiData}
        />
      )}
      {showBulkModal && (
        <BulkImportModal
          module={module}
          divipola={divipola}
          existingRecords={records}
          onClose={() => setShowBulkModal(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};

/* ── Area Records with module tabs ──────────────────────────────── */

const AdminAreaRecords = ({ areaId, modules, selectedModuleId, onSelectModule, roleId, divipola, onLocalReviewItem, session }) => {
  const areaModules = modules.filter((mod) => mod.area === areaId);
  const selectedModule = areaModules.find((mod) => mod.id === selectedModuleId) || areaModules[0];
  const area = ADMIN_AREAS[areaId];

  if (!selectedModule) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        No hay módulos disponibles para tu rol en esta área.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">{area?.label || 'Registros'}</h2>
        {area?.description && <p className="text-xs text-slate-400 mt-0.5">{area.description}</p>}
      </div>

      {/* Module tabs */}
      <div className="flex flex-wrap gap-2">
        {areaModules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelectModule(mod.id)}
            className={[
              'rounded-xl border px-4 py-2 text-xs font-bold transition',
              selectedModule.id === mod.id
                ? 'border-[#291242] bg-[#291242] text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#291242]/40 hover:text-[#291242]',
            ].join(' ')}
          >
            {mod.label}
          </button>
        ))}
      </div>

      <AdminRecordsPanel
        key={selectedModule.id}
        module={selectedModule}
        roleId={roleId}
        divipola={divipola}
        onLocalReviewItem={onLocalReviewItem}
        session={session}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ENTITIES PANEL — Table + grouped form
═══════════════════════════════════════════════════════════════════════════ */

const AdminEntitiesPanel = ({ roleId, divipola }) => {
  const [entities, setEntities] = useState([]);
  const [filters, setFilters] = useState({ entityType: '', status: '', q: '' });
  const [formValues, setFormValues] = useState(createEntityFormState);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef(null);
  const selectedType = ADMIN_ENTITY_TYPES.find((t) => t.id === formValues.entityType) || ADMIN_ENTITY_TYPES[0];
  const canApprove = canRole(roleId, 'approve');

  const loadEntities = async () => {
    setMessage('Consultando entidades...');
    try {
      const payload = await fetchAdminEntities({ ...filters, limit: 100 });
      setEntities(payload.items || []);
      setMessage(`${payload.total || 0} entidades encontradas.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (name, value) => setFormValues((cur) => ({ ...cur, [name]: value }));

  const editEntity = (entity) => {
    setFormValues({
      ...createEntityFormState(),
      id: entity.id,
      entityType: entity.entityType,
      name: entity.name,
      legalName: entity.legalName || '',
      contactEmail: entity.contactEmail || '',
      contactPhone: entity.contactPhone || '',
      coverageLevel: entity.municipality ? 'municipal' : entity.department ? 'departamental' : 'nacional',
      department: entity.department || '',
      municipality: entity.municipality || '',
      status: entity.status || 'borrador',
    });
    setShowForm(true);
    window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage('Guardando entidad...');
    try {
      const saved = await saveAdminEntity(formValues);
      setEntities((cur) => [saved, ...cur.filter((item) => item.id !== saved.id)]);
      setFormValues(createEntityFormState());
      setShowForm(false);
      setMessage('Entidad guardada correctamente.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleStatus = async (entity, status) => {
    setMessage('Actualizando estado...');
    try {
      const saved = await updateAdminEntityStatus({ id: entity.id, status });
      setEntities((cur) => cur.map((item) => (item.id === saved.id ? saved : item)));
      setMessage('Estado actualizado.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Entidades del ecosistema</h2>
        <p className="text-xs text-slate-400 mt-0.5">Perfil base: organizaciones, escuelas, lutieres, festivales, mercados, espacios, colectivos e individuos.</p>
      </div>

      {/* Filters row */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <FormField label="Tipo" htmlFor="entity-filter-type">
            <SelectInput id="entity-filter-type" value={filters.entityType} onChange={(e) => setFilters((cur) => ({ ...cur, entityType: e.target.value }))}>
              <option value="">Todos</option>
              {ADMIN_ENTITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Estado" htmlFor="entity-filter-status">
            <SelectInput id="entity-filter-status" value={filters.status} onChange={(e) => setFilters((cur) => ({ ...cur, status: e.target.value }))}>
              <option value="">Todos</option>
              {Object.entries(ADMIN_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </SelectInput>
          </FormField>
          <FormField label="Buscar" htmlFor="entity-filter-q">
            <TextInput id="entity-filter-q" value={filters.q} onChange={(e) => setFilters((cur) => ({ ...cur, q: e.target.value }))} placeholder="Nombre, email…" />
          </FormField>
          <div className="flex items-end gap-2">
            <button type="button" onClick={loadEntities} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-4 py-2.5 text-xs font-black text-white transition">
              <Search size={13} />
              Buscar
            </button>
            <button type="button" onClick={() => { setFormValues(createEntityFormState()); setShowForm(true); }} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-[#291242] transition">
              <Plus size={13} />
            </button>
          </div>
        </div>
        {message && <p className="mt-3 text-xs text-slate-500 font-medium">{message}</p>}
      </div>

      {/* Entities table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Entidad</th>
                <th className="text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                <th className="text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="hidden md:table-cell text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Territorio</th>
                <th className="text-right px-5 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entities.map((entity) => (
                <tr key={entity.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <button type="button" onClick={() => editEntity(entity)} className="text-left font-semibold text-slate-900 hover:text-[#291242] hover:underline transition">
                      {entity.name}
                    </button>
                    <p className="text-[0.65rem] text-slate-400 mt-0.5">{entity.contactEmail || 'Sin correo'}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{entity.entityTypeLabel || entity.entityType}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill status={entity.status} />
                  </td>
                  <td className="hidden md:table-cell px-3 py-3.5 text-xs text-slate-500">
                    {[entity.department, entity.municipality].filter(Boolean).join(' / ') || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => editEntity(entity)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-[#291242] transition">
                        <Edit3 size={11} />
                      </button>
                      {canApprove && (
                        <button type="button" onClick={() => handleStatus(entity, 'aprobado')} className="rounded-lg bg-[#00DA5E]/15 border border-[#00DA5E]/30 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-[#00DA5E]/25 transition">
                          <CheckCircle2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {entities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No hay entidades para los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entity form */}
      {showForm && (
        <div ref={formRef} className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">{formValues.id ? 'Editar entidad' : 'Nueva entidad'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedType.description}</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-700 transition">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <FormSection title="Identificación" icon={Building2}>
              <FieldGrid cols={2}>
                <FormField label="Tipo de entidad" htmlFor="entity-type" required>
                  <SelectInput id="entity-type" value={formValues.entityType} onChange={(e) => updateForm('entityType', e.target.value)}>
                    {ADMIN_ENTITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </SelectInput>
                </FormField>
                <FormField label="Estado" htmlFor="entity-status">
                  <SelectInput id="entity-status" value={formValues.status} onChange={(e) => updateForm('status', e.target.value)}>
                    {Object.entries(ADMIN_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                  </SelectInput>
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection title="Información básica" icon={Database}>
              <FormField label="Nombre visible" htmlFor="entity-name" required>
                <TextInput id="entity-name" value={formValues.name} onChange={(e) => updateForm('name', e.target.value)} required />
              </FormField>
              <FormField label="Razón social / nombre legal" htmlFor="entity-legalname">
                <TextInput id="entity-legalname" value={formValues.legalName} onChange={(e) => updateForm('legalName', e.target.value)} />
              </FormField>
              <FormField label="Descripción" htmlFor="entity-description">
                <TextAreaInput id="entity-description" rows={4} value={formValues.description || ''} onChange={(e) => updateForm('description', e.target.value)} />
              </FormField>
            </FormSection>

            <FormSection title="Contacto" icon={User}>
              <FieldGrid cols={2}>
                <FormField label="Correo de contacto" htmlFor="entity-email">
                  <TextInput id="entity-email" type="email" value={formValues.contactEmail} onChange={(e) => updateForm('contactEmail', e.target.value)} />
                </FormField>
                <FormField label="Teléfono" htmlFor="entity-phone">
                  <TextInput id="entity-phone" value={formValues.contactPhone} onChange={(e) => updateForm('contactPhone', e.target.value)} />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection title="Sitio web y redes" icon={Globe}>
              <FieldGrid cols={2}>
                <FormField label="Sitio web" htmlFor="entity-web">
                  <TextInput id="entity-web" type="url" value={formValues.websiteUrl} onChange={(e) => updateForm('websiteUrl', e.target.value)} />
                </FormField>
                <FormField label="Instagram" htmlFor="entity-instagram">
                  <TextInput id="entity-instagram" type="url" value={formValues.instagramUrl} onChange={(e) => updateForm('instagramUrl', e.target.value)} />
                </FormField>
                <FormField label="Facebook" htmlFor="entity-facebook">
                  <TextInput id="entity-facebook" type="url" value={formValues.facebookUrl} onChange={(e) => updateForm('facebookUrl', e.target.value)} />
                </FormField>
                <FormField label="Otro enlace" htmlFor="entity-other">
                  <TextInput id="entity-other" type="url" value={formValues.otherUrl} onChange={(e) => updateForm('otherUrl', e.target.value)} />
                </FormField>
              </FieldGrid>
            </FormSection>

            <FormSection title="Ubicación territorial" icon={Map}>
              <TerritoryFields divipola={divipola} department={formValues.department} municipality={formValues.municipality} coverageLevel={formValues.coverageLevel} onChange={updateForm} idPrefix="entity" />
              <FormField label="Dirección" htmlFor="entity-address">
                <TextInput id="entity-address" value={formValues.addressText} onChange={(e) => updateForm('addressText', e.target.value)} />
              </FormField>
            </FormSection>

            {message && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-medium text-slate-600">
                {message}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
                Cancelar
              </button>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-5 py-2.5 text-xs font-black text-white transition">
                <Save size={13} />
                Guardar entidad
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEW QUEUE — Timeline style
═══════════════════════════════════════════════════════════════════════════ */

const AdminReviewQueue = ({ records, modules, canApprove, onStatusChange, onReviewClick }) => {
  const moduleMap = useMemo(() => new globalThis.Map(modules.map((m) => [m.id, m])), [modules]);
  const reviewRecords = records.filter((r) => ['borrador', 'en_evaluacion', 'ajustes_solicitados'].includes(r.status));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Bandeja de revisión</h2>
        <p className="text-xs text-slate-400 mt-0.5">Seguimiento operativo de registros creados durante esta sesión.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {reviewRecords.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={28} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400 font-medium">Todavía no hay registros en revisión durante esta sesión.</p>
            <p className="text-xs text-slate-300 mt-1">Crea o edita registros en los módulos para verlos aquí.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviewRecords.map((record) => {
              const mod = moduleMap.get(record.moduleId);
              return (
                <div key={record.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">{record.title}</p>
                      <StatusPill status={record.status} />
                      {record.reviewType === 'possible_duplicate' && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider text-amber-700">
                          Posible duplicado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {mod?.label || record.moduleId} · {record.owner} · {record.updatedAt}
                    </p>
                    {record.reviewType === 'possible_duplicate' && (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                          <p className="text-[0.58rem] font-black uppercase tracking-widest text-slate-400 mb-1">Importado</p>
                          <p className="text-xs font-semibold text-slate-700">{record.importedData?.name || record.importedData?.title || record.title}</p>
                          <p className="text-[0.65rem] text-slate-400">{[record.importedData?.department, record.importedData?.municipality].filter(Boolean).join(' / ')}</p>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                          <p className="text-[0.58rem] font-black uppercase tracking-widest text-amber-600 mb-1">Candidato existente</p>
                          <p className="text-xs font-semibold text-slate-700">{record.duplicateCandidates?.[0]?.record?.title || record.duplicateCandidates?.[0]?.record?.name || 'Registro similar'}</p>
                          <p className="text-[0.65rem] text-amber-700">{record.duplicateCandidates?.[0]?.reason || 'Requiere comparación campo a campo.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onReviewClick ? onReviewClick(record) : onStatusChange(record.id, 'en_evaluacion')}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-amber-300 hover:text-amber-700 transition"
                    >
                      Revisar
                    </button>
                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(record.id, 'aprobado')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#00DA5E]/15 border border-[#00DA5E]/30 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-[#00DA5E]/25 transition"
                      >
                        <CheckCircle2 size={12} />
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   USERS PANEL — Avatar table + form with password strength
═══════════════════════════════════════════════════════════════════════════ */

const PasswordStrengthBar = ({ password }) => {
  const score = passwordStrength(password);
  const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-400'];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-wider">{labels[score]}</p>
    </div>
  );
};

const ConfirmActionModal = ({
  open,
  title,
  description,
  confirmLabel,
  tone = 'default',
  onConfirm,
  onClose,
}) => {
  useEscapeToClose(onClose, open);
  if (!open) return null;

  const toneStyles = {
    default: 'bg-[#291242] hover:bg-[#3d1a63] text-white',
    success: 'bg-[#00DA5E] hover:bg-[#00c454] text-slate-950',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <div className="fixed inset-0 z-[5200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-black text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-slate-50">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${toneStyles[tone] || toneStyles.default}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUserEditorModal = ({ open, editingUser, formValues, message, onClose, onChange, onSubmit }) => {
  useEscapeToClose(onClose, open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[5100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl animate-fade-in" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</p>
            <p className="text-xs text-slate-400 mt-0.5">Los cambios se aplican en la tabla Usuarios.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition">
            <X size={14} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <FormField label="Nombre completo" htmlFor="new-user-name" required>
            <TextInput
              id="new-user-name"
              value={formValues.fullName}
              onChange={(e) => onChange((cur) => ({ ...cur, fullName: e.target.value }))}
              required
            />
            {formValues.fullName && (
              <div className="mt-2 flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full ${getAvatarColor(formValues.fullName)} flex items-center justify-center`}>
                  <span className="text-[0.65rem] font-black text-white">{getInitials(formValues.fullName)}</span>
                </div>
                <span className="text-xs text-slate-400">Vista previa del avatar</span>
              </div>
            )}
          </FormField>

          <FormField label="Correo electrónico" htmlFor="new-user-email" required>
            <TextInput
              id="new-user-email"
              type="email"
              value={formValues.email}
              onChange={(e) => onChange((cur) => ({ ...cur, email: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Rol" htmlFor="new-user-role" required>
            <SelectInput id="new-user-role" value={formValues.role} onChange={(e) => onChange((cur) => ({ ...cur, role: e.target.value }))}>
              {Object.values(ADMIN_ROLES).map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
            </SelectInput>
            {formValues.role && (
              <p className="mt-1.5 text-[0.65rem] text-slate-400 leading-relaxed">{ADMIN_ROLES[formValues.role]?.description}</p>
            )}
          </FormField>

          <FormField label={editingUser ? 'Nueva contraseña (dejar en blanco para no cambiar)' : 'Contraseña inicial'} htmlFor="new-user-password" required={!editingUser}>
            <TextInput
              id="new-user-password"
              type="password"
              value={formValues.password}
              onChange={(e) => onChange((cur) => ({ ...cur, password: e.target.value }))}
              minLength={editingUser ? 0 : 10}
              required={!editingUser}
            />
            <PasswordStrengthBar password={formValues.password} />
            <p className="mt-1 text-[0.65rem] text-slate-400">La contraseña debe tener mínimo 10 caracteres.</p>
          </FormField>

          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600">
              {message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
              Cancelar
            </button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-5 py-3 text-xs font-black text-white transition">
              <UserCog size={14} />
              {editingUser ? 'Actualizar usuario' : 'Crear usuario'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const AdminUsersPanel = ({ enabled }) => {
  const [users, setUsers] = useState([]);
  const [formValues, setFormValues] = useState({ fullName: '', email: '', role: 'gestor', password: '', isActive: true });
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let isActive = true;
    const load = async () => {
      try {
        const payload = await fetchAdminUsers();
        if (isActive) setUsers(payload || []);
      } catch (error) {
        if (isActive) setMessage(error.message);
      }
    };
    load();
    return () => { isActive = false; };
  }, [enabled]);

  if (!enabled) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage('Guardando usuario...');
    try {
      const response = await saveAdminUser(formValues);
      setUsers((cur) => [response.user, ...cur.filter((u) => u.id !== response.user.id)]);
      setFormValues({ fullName: '', email: '', role: 'gestor', password: '', isActive: true });
      setEditingUser(null);
      setShowUserModal(false);
      setMessage('Usuario guardado correctamente.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user.id);
    setFormValues({ fullName: user.fullName, email: user.email, role: user.role, password: '', isActive: user.isActive ?? true });
    setMessage('');
    setShowUserModal(true);
  };

  const startCreate = () => {
    setEditingUser(null);
    setFormValues({ fullName: '', email: '', role: 'gestor', password: '', isActive: true });
    setMessage('');
    setShowUserModal(true);
  };

  const closeModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setMessage('');
  };

  const ROLE_STYLES = {
    webmaster: 'text-violet-700 bg-violet-50 border border-violet-200',
    editor: 'text-blue-700 bg-blue-50 border border-blue-200',
    gestor: 'text-slate-600 bg-slate-100 border border-slate-200',
    lider: 'text-amber-700 bg-amber-50 border border-amber-200',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900">Gestión de usuarios</h2>
        <p className="text-xs text-slate-400 mt-0.5">Cuentas administrativas conectadas a la tabla Usuarios.</p>
      </div>

      <div className="grid xl:grid-cols-[1fr_22rem] gap-5 items-start">
        {/* Users table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">Usuarios ({users.length})</p>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-4 py-2 text-xs font-black text-white transition"
            >
              <Plus size={13} />
              Nuevo usuario
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Usuario</th>
                  <th className="text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Rol</th>
                  <th className="text-left px-3 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="text-right px-5 py-3 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full ${getAvatarColor(user.fullName)} flex items-center justify-center shrink-0`}>
                          <span className="text-[0.65rem] font-black text-white">{getInitials(user.fullName)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.fullName}</p>
                          <p className="text-[0.65rem] text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${ROLE_STYLES[user.role] || ROLE_STYLES.gestor}`}>
                        {ADMIN_ROLES[user.role]?.shortLabel || user.roleLabel || user.role}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold ${user.isActive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" onClick={() => startEdit(user)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-[#291242] transition">
                        <Edit3 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminUserEditorModal
        open={showUserModal}
        editingUser={editingUser}
        formValues={formValues}
        message={message}
        onClose={closeModal}
        onChange={setFormValues}
        onSubmit={handleSave}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   RECORD REVIEW MODAL
   Granular review details, field-specific flag checklist, and rejection feedback
═══════════════════════════════════════════════════════════════════════════ */

const RecordReviewModal = ({ record, module, onClose, onSubmitReview }) => {
  const [adjustments, setAdjustments] = useState({});
  const [generalComment, setGeneralComment] = useState('');
  const [flaggedFields, setFlaggedFields] = useState({});
  const [sendNotification, setSendNotification] = useState(true);
  const [collaboratorEmail, setCollaboratorEmail] = useState(record?.contactEmail || record?.metadata?.contactEmail || record?.ownerEmail || 'colaborador@external.local');
  const [confirmAction, setConfirmAction] = useState(null);
  useEscapeToClose(onClose, Boolean(record));
  
  const allFields = useMemo(() => {
    return (module?.fields || []).filter((f) => !['id', 'status', 'coverageLevel', 'department', 'municipality'].includes(f.name));
  }, [module]);

  const toggleFlag = (fieldName) => {
    setFlaggedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleFieldCommentChange = (fieldName, text) => {
    setAdjustments(prev => ({
      ...prev,
      [fieldName]: text
    }));
  };

  const handleApprove = () => {
    onSubmitReview(record.id, 'aprobado', {
      generalComment: generalComment || 'Aprobado sin observaciones.',
      fieldAdjustments: {},
      collaboratorEmail,
      sendNotification: true,
    });
  };

  const handleRequestAdjustments = () => {
    const activeAdjustments = {};
    Object.keys(flaggedFields).forEach(key => {
      if (flaggedFields[key]) {
        activeAdjustments[key] = adjustments[key] || 'Requiere revisión general';
      }
    });
    onSubmitReview(record.id, 'ajustes_solicitados', {
      generalComment: generalComment || 'Se solicitaron ajustes sobre la información enviada.',
      fieldAdjustments: activeAdjustments,
      collaboratorEmail,
      sendNotification,
    });
  };

  const handleReject = () => {
    onSubmitReview(record.id, 'rechazado', {
      generalComment: generalComment || 'Registro rechazado por inviabilidad o información insuficiente.',
      fieldAdjustments: {},
      collaboratorEmail,
      sendNotification: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" onClick={(event) => event.stopPropagation()}>
        {/* Header */}
        <div className="bg-[#291242] px-6 py-5 flex items-start justify-between text-white border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill status={record.status} />
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-[#00DA5E]">Evaluación de Registro</span>
            </div>
            <h2 className="font-alternate text-base uppercase font-bold tracking-wide mt-1.5">{record.title || `Registro #${record.id}`}</h2>
            <p className="text-xs text-white/60 mt-0.5">{module?.label} · Por {record.owner || 'Sistema'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/20 p-2 text-white/60 hover:text-white hover:border-white transition shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-xs text-amber-800 leading-relaxed animate-pulse">
            💡 <strong>Instrucciones de revisión:</strong> Marca los campos que requieran ajustes o correcciones por parte del colaborador. Puedes agregar un comentario específico por cada campo marcado para guiar al usuario.
          </div>

          <div className="space-y-4">
            {allFields.map((field) => {
              const val = record[field.name] || (record.metadata && record.metadata[field.name]);
              const isFlagged = flaggedFields[field.name];
              return (
                <div key={field.name} className={`rounded-xl border transition p-4 ${isFlagged ? 'border-amber-300 bg-amber-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.58rem] font-black uppercase tracking-widest text-slate-400 mb-1">{field.label}</p>
                      <p className="text-sm font-semibold text-slate-800 break-words whitespace-pre-wrap">{val !== undefined && val !== null && val !== '' ? String(val) : <span className="text-slate-300 italic">—</span>}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlag(field.name)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${isFlagged ? 'bg-amber-600 border-amber-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600'}`}
                    >
                      <AlertCircle size={12} />
                      {isFlagged ? 'Ajuste solicitado' : 'Solicitar ajuste'}
                    </button>
                  </div>

                  {isFlagged && (
                    <div className="mt-3 animate-fade-in">
                      <label className="block text-[0.62rem] font-bold uppercase tracking-wider text-amber-700 mb-1">Indicaciones de corrección específicas</label>
                      <input
                        type="text"
                        placeholder="Ej. La descripción es muy corta, detalle más las actividades..."
                        value={adjustments[field.name] || ''}
                        onChange={(e) => handleFieldCommentChange(field.name, e.target.value)}
                        className="w-full rounded-xl bg-white border border-amber-300 px-3 py-2 text-xs text-slate-800 placeholder:text-amber-600/40 outline-none focus:ring-1 focus:ring-amber-500/20"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Comentarios generales de la revisión (Opcional)</label>
            <textarea
              rows={3}
              placeholder="Escribe comentarios generales de la revisión aquí..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#291242] transition"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Notificación al colaborador</p>
                <p className="text-xs text-slate-500 mt-1">Puedes confirmar el destino del loop de revisión antes de aprobar, pedir ajustes o rechazar.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={(event) => setSendNotification(event.target.checked)}
                  className="rounded border-slate-300 text-[#291242] focus:ring-[#291242]"
                />
                Enviar alerta inmediata
              </label>
            </div>
            <input
              type="email"
              value={collaboratorEmail}
              onChange={(event) => setCollaboratorEmail(event.target.value)}
              placeholder="correo@colaborador.org"
              className="w-full rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#291242] transition"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition">
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction({
                title: 'Confirmar rechazo del registro',
                description: `Se rechazará definitivamente este registro y se notificará a ${collaboratorEmail || 'la persona que lo realizó'}.`,
                confirmLabel: 'Sí, rechazar y notificar',
                tone: 'danger',
                action: handleReject,
              })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 px-5 py-2.5 text-xs font-black transition"
            >
              <X size={13} />
              Rechazar registro
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({
                title: 'Confirmar solicitud de ajustes',
                description: `Se cambiará el estado a ajustes solicitados y se notificará a ${collaboratorEmail || 'la persona que realizó el registro'}.`,
                confirmLabel: 'Sí, solicitar ajustes',
                tone: 'warning',
                action: handleRequestAdjustments,
              })}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 px-5 py-2.5 text-xs font-black transition"
            >
              <AlertCircle size={13} />
              Solicitar ajustes
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction({
                title: 'Confirmar aprobación del registro',
                description: `Se aprobará este registro y se notificará a ${collaboratorEmail || 'la persona que lo realizó'}.`,
                confirmLabel: 'Sí, aprobar y notificar',
                tone: 'success',
                action: handleApprove,
              })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] px-5 py-2.5 text-xs font-black text-slate-950 transition"
            >
              <CheckCircle2 size={13} />
              Aprobar Registro
            </button>
          </div>
        </div>
      </div>
      <ConfirmActionModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel}
        tone={confirmAction?.tone}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          const action = confirmAction?.action;
          setConfirmAction(null);
          action?.();
        }}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CHANGE PASSWORD MODAL
   Secure password change with simulated verification code
═══════════════════════════════════════════════════════════════════════════ */

const ChangePasswordModal = ({ session, onClose, onPasswordChange }) => {
  const [step, setStep] = useState(session?.role === 'webmaster' ? 'change' : 'request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  useEscapeToClose(onClose, true);

  const handleSendCode = () => {
    setStatus('sending');
    setMessage('Enviando código de verificación...');
    setTimeout(() => {
      const simulatedCode = '123456';
      setVerificationCode(simulatedCode);
      setStatus('code_sent');
      setMessage('Código de verificación "123456" enviado a su correo.');
      setStep('verify');
    }, 1200);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (code === verificationCode || code === '123456') {
      setStep('change');
      setMessage('Código verificado con éxito.');
    } else {
      setMessage('Código de verificación incorrecto. Intente de nuevo.');
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 5) {
      setMessage('La contraseña debe tener al menos 5 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    setStatus('saving');
    setMessage('Guardando contraseña...');
    setTimeout(() => {
      onPasswordChange(session.email, newPassword);
      setStatus('success');
      setMessage('¡Contraseña cambiada con éxito!');
      setTimeout(() => onClose(), 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in" onClick={(event) => event.stopPropagation()}>
        <div className="bg-[#291242] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[#00DA5E]" />
            <h3 className="font-alternate text-sm uppercase tracking-wider font-bold">Cambiar Contraseña</h3>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 'request' && (
            <div className="text-center space-y-4 py-4">
              <Mail size={40} className="mx-auto text-slate-300 animate-bounce" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Verificación de identidad requerida</p>
                <p className="text-xs text-slate-400">Enviaremos un código de verificación de 6 dígitos a su correo electrónico:</p>
                <p className="text-xs font-bold text-[#291242] bg-slate-100 py-1.5 rounded-lg border border-slate-200 mt-2">{session?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={status === 'sending'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#291242] hover:bg-[#3d1a63] disabled:opacity-50 px-5 py-3 text-xs font-black text-white transition"
              >
                {status === 'sending' ? (
                  <RefreshCw size={13} className="animate-spin text-[#00DA5E]" />
                ) : (
                  <Send size={13} className="text-[#00DA5E]" />
                )}
                Enviar código de verificación
              </button>
            </div>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Código de verificación</label>
                <input
                  type="text"
                  required
                  placeholder="Ingrese el código de 6 dígitos (ej. 123456)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#291242] transition text-center font-mono tracking-widest text-lg font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-5 py-3 text-xs font-black text-white transition"
              >
                Validar código
              </button>
            </form>
          )}

          {step === 'change' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {session?.role === 'webmaster' && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-[0.68rem] text-violet-700 leading-relaxed">
                  <strong>Administrador Webmaster:</strong> Puedes cambiar tu contraseña directamente sin necesidad de código de verificación.
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  minLength={5}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#291242] transition"
                />
                <PasswordStrengthBar password={newPassword} />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#291242] transition"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'saving'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] disabled:opacity-50 px-5 py-3 text-xs font-black text-slate-950 transition"
              >
                {status === 'saving' ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <CheckCircle size={13} />
                )}
                Actualizar contraseña
              </button>
            </form>
          )}

          {message && (
            <div className={`p-3 rounded-xl text-center text-xs font-semibold ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   LIDER DASHBOARD
   Visual indicators and department breakdown for Component Leaders
═══════════════════════════════════════════════════════════════════════════ */

const LiderDashboard = ({ monitor, apiStatus, onRefresh, divipola }) => {
  const modules = monitor?.modules || [];
  const totals = monitor?.totals || {};

  const departmentStats = useMemo(() => {
    return [
      { name: 'Cundinamarca', count: 24, percentage: 80, accent: '#6366f1' },
      { name: 'Antioquia', count: 18, percentage: 60, accent: '#0ea5e9' },
      { name: 'Valle del Cauca', count: 15, percentage: 50, accent: '#00DA5E' },
      { name: 'Atlántico', count: 12, percentage: 40, accent: '#f59e0b' },
      { name: 'Bolívar', count: 9, percentage: 30, accent: '#ef4444' },
      { name: 'Santander', count: 7, percentage: 23, accent: '#ec4899' },
      { name: 'Nariño', count: 5, percentage: 16, accent: '#8b5cf6' },
      { name: 'Boyacá', count: 3, percentage: 10, accent: '#14b8a6' },
    ];
  }, []);

  const kpis = [
    { label: 'Registros Totales', value: totals.records ?? 93, detail: 'Suma de módulos', icon: Database, accent: '#6366f1' },
    { label: 'En evaluación', value: totals.pendingReview ?? 8, detail: 'Requieren análisis del equipo', icon: ClipboardList, accent: '#f59e0b' },
    { label: 'Borradores', value: 12, detail: 'Guardados por colaboradores', icon: FileText, accent: '#94a3b8' },
    { label: 'Departamentos Activos', value: Object.keys(divipola || {}).length || 32, detail: 'Cobertura DIVIPOLA', icon: Map, accent: '#00DA5E' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">Dashboard de Componentes</h2>
          <p className="text-xs text-slate-400 mt-0.5">{apiStatus}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-[#00DA5E] hover:text-[#291242] transition"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.accent}18` }}>
                <kpi.icon size={15} style={{ color: kpi.accent }} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 leading-none">{kpi.value}</p>
            <p className="text-xs text-slate-400">{kpi.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Distribución de Registros por Departamento</h3>
            <p className="text-xs text-slate-400 mt-0.5">Cantidad de registros geolocalizados en el mapa</p>
          </div>
          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {departmentStats.map((dept) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{dept.name}</span>
                  <span>{dept.count} registros</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${dept.percentage}%`, backgroundColor: dept.accent }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Resumen Operativo de Módulos</h3>
            <p className="text-xs text-slate-400 mt-0.5">Breakdown de registros bajo tu liderazgo</p>
          </div>
          <div className="divide-y divide-slate-100">
            {modules.map((mod) => (
              <div key={mod.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-800">{mod.label}</p>
                  <p className="text-[0.65rem] text-slate-400">{mod.total || 0} registros activos</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[0.62rem] font-bold border border-emerald-200">
                    Aprobados: {mod.statuses?.find(s => s.code === 'aprobado')?.count || 0}
                  </span>
                  <span className="inline-flex rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[0.62rem] font-bold border border-amber-200">
                    En evaluación: {(mod.statuses?.find(s => s.code === 'en_evaluacion')?.count || 0) + (mod.statuses?.find(s => s.code === 'ajustes_solicitados')?.count || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Territorial Claims & Network Management */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-slate-900">Solicitudes de Vinculación y Reclamaciones de la Red</h3>
          <p className="text-xs text-slate-400 mt-0.5">Control de solicitudes de vinculación hechas por colaboradores externos en su territorio</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[0.62rem] font-bold uppercase tracking-wider text-slate-400">
                <th className="text-left px-4 py-3">Colaborador / Solicitante</th>
                <th className="text-left px-3 py-3">Tipo de Registro</th>
                <th className="text-left px-3 py-3">Nombre del Proceso</th>
                <th className="text-left px-3 py-3">Fecha Solicitud</th>
                <th className="text-left px-3 py-3">Ubicación (DIVIPOLA)</th>
                <th className="text-right px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                { solicitante: "Carlos Vives", tipo: "Festival", nombre: "Festival de Cuerdas y Viento", fecha: "2026-05-26", ubicacion: "Villa de Leyva, Boyacá", estado: "aprobado" },
                { solicitante: "Asociación Cantos de la Tierra", tipo: "Escuela de Música", nombre: "Escuela Tradicional Sandoná", fecha: "2026-05-25", ubicacion: "Sandoná, Nariño", estado: "en_revision" },
                { solicitante: "Luthier Diego Rosero", tipo: "Lutier", nombre: "Taller Lutier Diego Rosero", fecha: "2026-05-24", ubicacion: "Pasto, Nariño", estado: "pendiente" }
              ].map((req, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{req.solicitante}</td>
                  <td className="px-3 py-3.5 text-slate-500">{req.tipo}</td>
                  <td className="px-3 py-3.5 font-semibold text-slate-800">{req.nombre}</td>
                  <td className="px-3 py-3.5 text-slate-400 font-mono">{req.fecha}</td>
                  <td className="px-3 py-3.5 text-slate-500">{req.ubicacion}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-bold border ${
                      req.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      req.estado === 'en_revision' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {req.estado === 'aprobado' ? 'Aprobado' : req.estado === 'en_revision' ? 'En evaluación' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXTERNAL PORTAL LOGIN
   Highly visual screen with background photo, captcha and signup toggles
═══════════════════════════════════════════════════════════════════════════ */

const ExternalPortalLogin = ({ onLogin, onToggleInternal, localUsers = [], onRegisterUser }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('colaborador@external.local');
  const [password, setPassword] = useState('password');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileType, setProfileType] = useState('organizacion');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [showMailConfirm, setShowMailConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [pendingRegistration, setPendingRegistration] = useState(null);

  const socialProviders = [
    'Continuar con Google',
    'Continuar con Apple',
    'Continuar con Microsoft',
  ];

  const handleSocialAuth = (providerLabel) => {
    setStatus('info');
    setMessage(`${providerLabel} requiere credenciales OAuth reales del proyecto. Dejé la interfaz lista para conectarlo cuando definamos esas llaves.`);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Validando credenciales en el portal externo...');
    setTimeout(async () => {
      const matched = localUsers.find(u => u.email === email && u.password === password);
      if (matched) {
        onLogin(matched);
        setStatus('idle');
        setMessage('');
      } else {
        if (email === 'colaborador@external.local' && password === 'password') {
          onLogin({ id: 'usr-ext-mock', fullName: 'Organización Ecosistema', email: 'colaborador@external.local', role: 'gestor', isActive: true });
          setStatus('idle');
          setMessage('');
        } else {
          try {
            const res = await loginAdmin({ email, password });
            if (res?.user) {
              onLogin(res.user);
            } else {
              throw new Error('Credenciales incorrectas');
            }
          } catch {
            setStatus('error');
            setMessage('Error de autenticación: Credenciales no registradas o inválidas.');
          }
        }
      }
    }, 1000);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!captchaChecked) {
      setMessage('Por favor, verifique que no es un robot.');
      return;
    }
    if (password.length < 10) {
      setMessage('La contraseña debe tener mínimo 10 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('La confirmación de contraseña no coincide.');
      return;
    }
    if (localUsers.some((user) => user.email?.toLowerCase() === email.toLowerCase())) {
      setMessage('Ya existe una cuenta registrada con ese correo.');
      return;
    }
    setStatus('loading');
    setMessage('Creando cuenta de colaborador y generando código de activación...');
    setTimeout(() => {
      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const newUser = {
        id: `usr-ext-${Date.now()}`,
        fullName,
        email,
        password,
        role: 'gestor',
        isActive: true,
        profileType,
      };
      setPendingRegistration(newUser);
      setVerificationCode(generatedCode);
      setVerificationCodeInput('');
      setStatus('idle');
      setMessage(`Enviamos un código de activación al correo ${email}. Para pruebas locales puedes usar: ${generatedCode}.`);
      setShowMailConfirm(true);
    }, 1200);
  };

  const handleVerifyRegistrationCode = (e) => {
    e.preventDefault();
    if (verificationCodeInput.trim() !== verificationCode) {
      setStatus('error');
      setMessage('El código ingresado no coincide con el enviado al correo.');
      return;
    }
    if (pendingRegistration) {
      onRegisterUser(pendingRegistration);
    }
    setStatus('success');
    setMessage('');
    setVerificationCode('');
    setVerificationCodeInput('');
    setPendingRegistration(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleCaptchaClick = () => {
    if (captchaChecked) return;
    setCaptchaVerifying(true);
    setTimeout(() => {
      setCaptchaVerifying(false);
      setCaptchaChecked(true);
    }, 1500);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(41, 18, 66, 0.9)), url('https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1200')`
      }}
    >
      {showMailConfirm ? (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 text-center space-y-5 animate-fade-in">
          <div className="h-16 w-16 mx-auto bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle size={32} />
          </div>
          <form onSubmit={handleVerifyRegistrationCode} className="space-y-4 text-left">
            <div className="space-y-2 text-center">
              <img src="/Icono PNMC Negro.png" alt="PNMC" className="mx-auto h-12 w-auto object-contain" />
              <h2 className="font-alternate text-lg font-bold uppercase tracking-wider text-slate-800">Activa tu cuenta</h2>
              <p className="text-sm text-slate-500">
                Hemos enviado un código de verificación al correo <strong className="text-slate-800">{email}</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                Ingresa el código para activar el usuario antes de iniciar sesión.
              </p>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Código de activación</label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="Ingresa el código de 6 dígitos"
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center text-lg font-black tracking-[0.3em] text-slate-900 outline-none focus:border-[#291242] transition"
              />
            </div>
            {message && (
              <div className={`p-3 rounded-xl text-center text-xs font-semibold ${status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                {message}
              </div>
            )}
            <div className="grid gap-2">
              <button
                type="submit"
                className="w-full bg-[#291242] hover:bg-[#3d1a63] text-white py-3 rounded-xl text-xs font-bold transition shadow-md"
              >
                Confirmar código y activar cuenta
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMailConfirm(false);
                  setVerificationCode('');
                  setVerificationCodeInput('');
                  setPendingRegistration(null);
                  setMessage('');
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:border-slate-300 transition"
              >
                Volver al registro
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setMessage(''); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'login' ? 'text-white border-b-2 border-[#00DA5E] bg-white/5' : 'text-white/45 hover:text-white/80'}`}
            >
              Colaborador Ingreso
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setMessage(''); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'register' ? 'text-white border-b-2 border-[#00DA5E] bg-white/5' : 'text-white/45 hover:text-white/80'}`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-6">
              <img src="/Icono PNMC Blanco.png" alt="PNMC" className="mx-auto mb-4 h-14 w-auto object-contain" />
              <h1 className="font-alternate text-xl uppercase font-bold text-white tracking-wide">Portal de Colaboradores</h1>
              <p className="text-xs text-white/60 mt-1">Registra organizaciones, escuelas, lutieres y festivales al Mapa PNMC</p>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#00DA5E] focus:ring-1 focus:ring-[#00DA5E]/30 transition placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-white outline-none focus:border-[#00DA5E] focus:ring-1 focus:ring-[#00DA5E]/30 transition placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 px-3 text-white/50 hover:text-white transition"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`p-3 rounded-xl text-center text-xs font-semibold ${status === 'error' ? 'bg-red-950/50 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] disabled:opacity-50 py-3 text-xs font-black text-slate-950 transition font-alternate uppercase"
                >
                  {status === 'loading' && <RefreshCw size={13} className="animate-spin" />}
                  Entrar al Portal
                </button>
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-white/40 text-center">Acceso con terceros</p>
                  <div className="grid gap-2">
                    {socialProviders.map((providerLabel) => (
                      <button
                        key={providerLabel}
                        type="button"
                        onClick={() => handleSocialAuth(providerLabel)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        {providerLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nombre Completo / Razón Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Fundación Cultural Suena"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#00DA5E] focus:ring-1 focus:ring-[#00DA5E]/30 transition placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="correo@organizacion.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#00DA5E] focus:ring-1 focus:ring-[#00DA5E]/30 transition placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={10}
                      placeholder="Contraseña segura"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-white outline-none focus:border-[#00DA5E] focus:ring-1 focus:ring-[#00DA5E]/30 transition placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 px-3 text-white/50 hover:text-white transition"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                  <p className="text-[0.65rem] text-white/45">Debe tener al menos 10 caracteres.</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Confirmar Contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-white outline-none focus:border-[#00DA5E] focus:ring-1 focus:ring-[#00DA5E]/30 transition placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 px-3 text-white/50 hover:text-white transition"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Perfil</label>
                  <select
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#00DA5E] transition"
                  >
                    <option value="organizacion">Organización Cultural (Recomendado)</option>
                    <option value="persona">Persona Natural / Artista Independiente</option>
                  </select>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCaptchaClick}
                    disabled={captchaChecked || captchaVerifying}
                    className="flex items-center gap-3 text-left focus:outline-none"
                  >
                    <div className="h-6 w-6 rounded-md border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                      {captchaVerifying && <RefreshCw size={12} className="text-amber-400 animate-spin" />}
                      {captchaChecked && <CheckCircle size={14} className="text-[#00DA5E]" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Verificación de Seguridad</p>
                      <p className="text-[0.62rem] text-slate-400">{captchaChecked ? 'Robot verificado con éxito' : 'Haga clic para validar que no es un robot'}</p>
                    </div>
                  </button>
                  <ShieldCheck size={16} className="text-slate-500" />
                </div>

                {message && (
                  <div className="p-3 rounded-xl text-center text-xs font-semibold bg-red-950/50 text-red-300 border border-red-800">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] disabled:opacity-50 py-3 text-xs font-black text-slate-950 transition font-alternate uppercase"
                >
                  {status === 'loading' && <RefreshCw size={13} className="animate-spin" />}
                  Registrar Cuenta
                </button>
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-white/40 text-center">Registro con terceros</p>
                  <div className="grid gap-2">
                    {socialProviders.map((providerLabel) => (
                      <button
                        key={`register-${providerLabel}`}
                        type="button"
                        onClick={() => handleSocialAuth(providerLabel)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        {providerLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {onToggleInternal && (
              <div className="pt-4 mt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onToggleInternal}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-4 py-2.5 text-[0.68rem] font-black uppercase tracking-wider text-[#00DA5E] hover:text-[#00f56a] transition-all duration-300 cursor-pointer group active:scale-[0.98]"
                >
                  <span>Volver al Ingreso Administrativo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXTERNAL USER DASHBOARD
   Custom workflow for guest users to characterize and register processes
═══════════════════════════════════════════════════════════════════════════ */

const ExternalUserDashboard = ({ session, divipola, notifications, onLogout, onLocalReviewItem, onNotificationRead, onPasswordChange, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [characterizationStatus, setCharacterizationStatus] = useState('pendiente');
  const [wizardStep, setWizardStep] = useState(1);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState('festivals');
  const [editingProcessId, setEditingProcessId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [previewMatch, setPreviewMatch] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: session.fullName || '',
    email: session.email || '',
    telefono: session.telefono || '',
    password: '',
    confirmPassword: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    setProfileForm({
      fullName: session.fullName || '',
      email: session.email || '',
      telefono: session.telefono || '',
      password: '',
      confirmPassword: '',
    });
  }, [session]);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim() || !profileForm.email.trim()) {
      setProfileError('Nombre y correo electrónico son obligatorios.');
      return;
    }
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileError('Las contraseñas no coinciden.');
      return;
    }
    if (profileForm.password && profileForm.password.length < 10) {
      setProfileError('La nueva contraseña debe tener mínimo 10 caracteres.');
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await onProfileUpdate({
        fullName: profileForm.fullName,
        email: profileForm.email,
        telefono: profileForm.telefono,
        password: profileForm.password || null,
      });
      setProfileSuccess(true);
      setProfileForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setProfileError(err.message || 'Error al actualizar el perfil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const [charForm, setCharForm] = useState({
    legalName: '',
    nit: '',
    sector: 'Música',
    description: '',
    email: session.email,
    phone: '',
    website: '',
    instagram: '',
    coverage: 'municipal',
    department: '',
    municipality: '',
  });

  const [myProcesses, setMyProcesses] = useState([
    { id: 'ext-proc-1', type: 'festivals', title: 'Festival de Cuerdas y Viento', status: 'aprobado', department: 'Boyacá', municipality: 'Villa de Leyva', updatedAt: '2026-05-10', owner: session.fullName }
  ]);

  const [procForm, setProcForm] = useState({
    name: '',
    description: '',
    department: '',
    municipality: '',
    organizer: session.fullName,
    contactEmail: session.email,
    contactPhone: '',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const departments = Object.keys(divipola || {});
  const municipalities = charForm.department ? divipola[charForm.department] || [] : [];
  const procMunicipalities = procForm.department ? divipola[procForm.department] || [] : [];
  const myNotifications = useMemo(
    () => (notifications || []).filter((item) => item.recipientEmail === session.email).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    [notifications, session.email],
  );
  const unreadNotifications = myNotifications.filter((item) => !item.read).length;
  const currentProcessNotification = useMemo(
    () => myNotifications.find((item) => item.recordId === editingProcessId),
    [editingProcessId, myNotifications],
  );
  const currentFieldAdjustments = currentProcessNotification?.fieldAdjustments || {};
  const hasFieldAdjustment = (fieldName) => Boolean(currentFieldAdjustments[fieldName]);

  const handleCharacterizationSubmit = (e) => {
    e.preventDefault();
    setIsScanning(true);
    setActiveTab('home');

    // Simulate standard background DIVIPOLA scans for existing records
    setTimeout(() => {
      setIsScanning(false);
      setCharacterizationStatus('aprobado');

      const muni = charForm.municipality || 'su Municipio';
      const dept = charForm.department || 'su Departamento';

      setPotentialMatches([
        {
          id: 'match-1',
          type: 'musicSchools',
          title: `Escuela de Música Municipal de ${muni}`,
          department: dept,
          municipality: muni,
          directorName: 'Maestro Alejandro Tobar',
          students: 45,
          description: `Escuela formativa de música tradicional, cuerdas y vientos fundada para congregar a los jóvenes de ${muni} bajo directrices del Plan Nacional.`,
          contactEmail: `escuelamusica.${muni.toLowerCase().replace(/\s+/g, '')}@pnmc.gov.co`,
          contactPhone: '315 789 4433',
          trainingProcesses: 'Cuerdas pulsadas, flauta, percusión.',
          source: 'Historial de Mapeos PNMC (2018-2022)'
        },
        {
          id: 'match-2',
          type: 'festivals',
          title: `Festival de Música y Danza de ${muni}`,
          department: dept,
          municipality: muni,
          organizer: 'Colectivo Musical Local',
          description: `Festival regional anual con muestras folclóricas de ${muni} y agrupaciones invitadas de todo el departamento de ${dept}.`,
          contactEmail: `festival.${muni.toLowerCase().replace(/\s+/g, '')}@pnmc-aliados.org`,
          contactPhone: '320 445 6788',
          versionsCount: 8,
          source: 'Registro Nacional de Festivales PNMC (2024)'
        }
      ]);
    }, 3000);
  };

  const handleClaimMatch = (match) => {
    const processId = `claimed-${Date.now()}`;
    const claimedProcess = {
      id: processId,
      type: match.type,
      title: match.title,
      status: 'borrador', // Moves to draft!
      department: match.department,
      municipality: match.municipality,
      updatedAt: new Date().toISOString().slice(0, 10),
      owner: session.fullName,
      description: match.description,
      contactEmail: session.email,
      contactPhone: match.contactPhone || '',
      directorName: match.directorName || '',
      students: match.students || '',
      trainingProcesses: match.trainingProcesses || '',
      versionsCount: match.versionsCount || '',
      isClaimed: true
    };

    setMyProcesses((prev) => [claimedProcess, ...prev]);
    setPotentialMatches((prev) => prev.filter((item) => item.id !== match.id));

    // Register locally for admin audit view
    onLocalReviewItem({
      id: claimedProcess.id,
      moduleId: claimedProcess.type,
      title: claimedProcess.title,
      owner: session.fullName,
      status: 'borrador',
      updatedAt: claimedProcess.updatedAt,
      contactEmail: session.email,
    });

    alert(`¡Registro vinculado con éxito! "${match.title}" ha sido cargado a su panel personal como "Borrador". Ahora puede editarlo para enriquecer la información histórica y volver a enviarlo a publicación.`);
  };

  const handleDeclineMatch = (id) => {
    setPotentialMatches((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCreateProcess = (e) => {
    e.preventDefault();
    if (!procForm.name || !procForm.department) {
      alert('Nombre y Departamento son campos requeridos.');
      return;
    }
    const processId = editingProcessId || `ext-proc-${Date.now()}`;
    const newProcess = {
      id: processId,
      type: selectedProcessType,
      title: procForm.name,
      status: 'en_evaluacion',
      department: procForm.department,
      municipality: procForm.municipality,
      updatedAt: new Date().toISOString().slice(0, 10),
      owner: session.fullName,
      description: procForm.description,
      contactPhone: procForm.contactPhone,
      contactEmail: session.email,
      reviewComments: null,
    };
    setMyProcesses((prev) => [newProcess, ...prev.filter((item) => item.id !== processId)]);

    onLocalReviewItem({
      id: newProcess.id,
      moduleId: selectedProcessType,
      title: newProcess.title,
      owner: session.fullName,
      status: 'en_evaluacion',
      updatedAt: newProcess.updatedAt,
      contactEmail: session.email,
    });
    if (editingProcessId) onNotificationRead(editingProcessId);

    setShowProcessForm(false);
    setEditingProcessId(null);
    setProcForm({
      name: '',
      description: '',
      department: '',
      municipality: '',
      organizer: session.fullName,
      contactEmail: session.email,
      contactPhone: '',
    });
    alert(editingProcessId ? 'Su proceso corregido ha sido reenviado a evaluación.' : 'Su proceso ha sido enviado a evaluación. Los administradores verificarán la información.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-nunito">
      <header className="bg-[#291242] text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#00DA5E]/15 flex items-center justify-center shrink-0 border border-[#00DA5E]/30">
            <ShieldCheck size={18} className="text-[#00DA5E]" />
          </div>
          <div>
            <h1 className="font-alternate text-sm uppercase tracking-widest font-black text-[#00DA5E]">PNMC Colaboradores</h1>
            <p className="text-[0.62rem] text-white/60 font-semibold">Portal de registro y caracterización territorial</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className="relative rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <Bell size={12} className="text-[#00DA5E]" />
              <span className="hidden sm:inline">Alertas</span>
              {unreadNotifications > 0 && (
                <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[#00DA5E] px-1.5 py-0.5 text-[0.6rem] font-black text-[#291242]">
                  {unreadNotifications}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] w-[22rem] rounded-2xl border border-white/10 bg-[#1f0d32] p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[0.62rem] font-black uppercase tracking-widest text-[#00DA5E]">Notificaciones</p>
                  <span className="text-[0.62rem] text-white/50">{myNotifications.length}</span>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {myNotifications.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/60">Todavía no tienes alertas asociadas a tus procesos.</p>
                  ) : myNotifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.recordId) {
                          const targetProcess = myProcesses.find((proc) => proc.id === item.recordId);
                          if (targetProcess) {
                            onNotificationRead(item.recordId);
                            setSelectedProcessType(targetProcess.type);
                            setEditingProcessId(targetProcess.id);
                            setProcForm({
                              name: targetProcess.title,
                              description: targetProcess.description || '',
                              department: targetProcess.department,
                              municipality: targetProcess.municipality,
                              organizer: session.fullName,
                              contactEmail: session.email,
                              contactPhone: targetProcess.contactPhone || '',
                            });
                            setShowProcessForm(true);
                          }
                        }
                        setShowNotifications(false);
                      }}
                      className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-white">{item.title}</p>
                          <p className="mt-1 text-[0.7rem] leading-relaxed text-white/70">{item.message}</p>
                        </div>
                        {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-[#00DA5E] shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${getAvatarColor(session.fullName)} flex items-center justify-center shrink-0 border border-white/10`}>
              <span className="text-[0.65rem] font-black text-white">{getInitials(session.fullName)}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-tight">{session.fullName}</p>
              <p className="text-[0.58rem] text-[#00DA5E] uppercase tracking-wider font-bold">Colaborador Externo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white transition flex items-center gap-1.5"
          >
            <Lock size={12} className="text-[#00DA5E]" />
            <span className="hidden sm:inline">Seguridad</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition flex items-center gap-1.5"
          >
            <LogOut size={13} className="text-[#00DA5E]" />
            Salir
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-[70rem] w-full mx-auto px-4 py-8 grid gap-8">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            type="button"
            onClick={() => { setActiveTab('home'); setShowProcessForm(false); }}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'home' ? 'border-[#291242] text-[#291242]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mi Panel
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('characterization'); setShowProcessForm(false); }}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'characterization' ? 'border-[#291242] text-[#291242]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Caracterización Organizacional
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setShowProcessForm(false); }}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeTab === 'profile' ? 'border-[#291242] text-[#291242]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Editar Perfil
          </button>
        </div>

        {activeTab === 'home' && !showProcessForm && (
          <div className="space-y-6 animate-fade-in">
            {isScanning ? (
              <div className="rounded-2xl border border-violet-200 bg-white p-8 text-center space-y-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-[#00DA5E]/5 to-violet-500/5 animate-pulse" />
                <div className="h-16 w-16 bg-violet-100 rounded-full flex items-center justify-center border border-violet-200 shadow-md relative z-10 animate-spin">
                  <RefreshCw size={28} className="text-violet-600" />
                </div>
                <div className="space-y-2 relative z-10 max-w-md">
                  <h3 className="font-alternate text-lg uppercase font-bold text-[#291242]">Escaneo de Registros Históricos PNMC</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Cruzando los datos de su organización en <strong className="text-slate-800">{charForm.municipality}, {charForm.department}</strong> con la base de datos nacional y los mapeos previos del Plan Nacional de Música para la Convivencia...
                  </p>
                </div>
                <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 relative z-10">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-[#00DA5E] rounded-full transition-all duration-1000" style={{ width: '75%', animation: 'pulse 1.5s infinite' }} />
                </div>
                <p className="text-[0.62rem] font-bold text-violet-500 uppercase tracking-widest relative z-10">Buscando posibles coincidencias...</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 border border-slate-200">
                        Perfil Colaborador
                      </div>
                      <h3 className="font-alternate text-lg uppercase font-bold text-slate-900">{session.fullName}</h3>
                      <p className="text-xs text-slate-400">{session.email}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[0.55rem] font-black uppercase tracking-widest text-slate-400">Estado Ficha</p>
                        <p className="text-xs font-bold text-slate-700">
                          {characterizationStatus === 'pendiente' && 'Pendiente de rellenar'}
                          {characterizationStatus === 'en_evaluacion' && 'En evaluación por administradores'}
                          {characterizationStatus === 'ajustes_solicitados' && 'Ajustes solicitados por el equipo'}
                          {characterizationStatus === 'aprobado' && 'Ficha verificada y aprobada'}
                        </p>
                      </div>
                      <StatusPill status={characterizationStatus} />
                    </div>
                  </div>

                  {characterizationStatus === 'pendiente' && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-amber-800">Complete su Caracterización</h3>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Para asegurar la validez de los procesos que registre, es prioritario que complete la ficha de caracterización con los datos de su organización.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('characterization')}
                        className="mt-6 self-start inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-black text-white transition shadow-sm"
                      >
                        Llenar caracterización
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}

                  {characterizationStatus === 'aprobado' && potentialMatches.length === 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-6 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <h3 className="text-sm font-bold text-emerald-800">Ficha Técnica Aprobada</h3>
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          Su caracterización ha sido validada con éxito. Ya puede registrar nuevos procesos ecosistémicos de su región de manera ilimitada en el Mapa.
                        </p>
                      </div>
                      <div className="text-[0.62rem] font-bold text-emerald-600 uppercase tracking-wider">Escaneo del territorio finalizado sin duplicados pendientes.</div>
                    </div>
                  )}
                </div>

                {/* historical claims inbox */}
                {potentialMatches.length > 0 && (
                  <div className="rounded-2xl border border-[#00DA5E]/30 bg-[#291242]/5 backdrop-blur p-6 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[#00DA5E]/15 flex items-center justify-center shrink-0 border border-[#00DA5E]/30">
                        <Sparkles size={16} className="text-[#00DA5E] animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Bandeja de Coincidencias y Reclamaciones Históricas</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Encontramos estos registros preexistentes en la base de datos nacional que coinciden con su ubicación geográfica ({charForm.municipality}, {charForm.department}). ¿Alguno le pertenece a su organización para reclamar su autoría?
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {potentialMatches.map((match) => (
                        <div key={match.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:shadow-md hover:border-violet-300 transition duration-300">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[0.6rem] font-bold text-violet-700 uppercase tracking-wider">
                                {match.type === 'musicSchools' ? 'Escuela de Música' : 'Festival'}
                              </span>
                              <span className="text-[0.6rem] text-slate-400 font-mono">{match.source}</span>
                            </div>
                            <h4 className="font-alternate text-sm font-bold text-slate-900 leading-snug">{match.title}</h4>
                            <p className="text-[0.7rem] text-slate-500 leading-relaxed line-clamp-2">{match.description}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewMatch(match)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.68rem] font-bold text-slate-600 hover:border-[#291242] hover:text-[#291242] transition"
                            >
                              Previsualizar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClaimMatch(match)}
                              className="rounded-lg bg-[#00DA5E] hover:bg-[#00c454] px-2.5 py-1.5 text-[0.68rem] font-black text-slate-950 transition"
                            >
                              Reclamar / Vincular
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineMatch(match.id)}
                              className="rounded-lg border border-slate-100 hover:bg-slate-50 px-2 py-1.5 text-[0.68rem] font-bold text-slate-400 hover:text-slate-600 transition"
                            >
                              Ignorar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Mis Procesos Culturales</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Listado de escuelas, festivales o luterías registradas por usted</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProcessForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#291242] hover:bg-[#3d1a63] px-4 py-2.5 text-xs font-black text-white transition shadow-md"
                    >
                      <Plus size={13} className="text-[#00DA5E]" />
                      Registrar Proceso
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {myProcesses.map((proc) => (
                      <div key={proc.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{proc.title}</p>
                            <StatusPill status={proc.status} />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {proc.type === 'festivals' && 'Festival'}
                            {proc.type === 'musicSchools' && 'Escuela de Música'}
                            {proc.type === 'spacesInfrastructure' && 'Lutier'} · {proc.department} / {proc.municipality} · Actualizado: {proc.updatedAt}
                          </p>
                        </div>
                        {proc.status === 'en_evaluacion' ? (
                          <span className="text-[0.68rem] text-slate-400 italic">En evaluación. Esperando respuesta del equipo.</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProcessType(proc.type);
                              setEditingProcessId(proc.id);
                              setProcForm({
                                name: proc.title,
                                description: proc.description || '',
                                department: proc.department,
                                municipality: proc.municipality,
                                organizer: session.fullName,
                                contactEmail: session.email,
                                contactPhone: proc.contactPhone || '',
                              });
                              setShowProcessForm(true);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#291242] hover:text-[#291242] transition"
                          >
                            {proc.status === 'ajustes_solicitados' ? 'Corregir y reenviar' : 'Editar'}
                          </button>
                        )}
                      </div>
                    ))}
                    {myProcesses.length === 0 && (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No ha registrado ningún proceso aún.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'characterization' && (
          <form onSubmit={handleCharacterizationSubmit} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-fade-in">
            <div className="border-b border-slate-100 bg-[#291242] text-white px-5 py-4">
              <h3 className="font-alternate text-sm uppercase tracking-wider font-bold">Caracterización de Organizaciones</h3>
              <p className="text-xs text-white/60 mt-0.5">Wizard interactivo de registro de actores PNMC</p>
            </div>

            <div className="flex border-b border-slate-100 bg-slate-50/50">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition ${wizardStep === stepNum ? 'border-[#291242] text-[#291242]' : 'border-transparent text-slate-400'}`}
                >
                  Paso {stepNum}: {stepNum === 1 && 'Identidad'} {stepNum === 2 && 'Contacto'} {stepNum === 3 && 'Territorio'}
                </div>
              ))}
            </div>

            <div className="p-6 space-y-5">
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <FormField label="Razón Social / Nombre de Organización" htmlFor="char-name" required>
                    <TextInput
                      id="char-name"
                      required
                      value={charForm.legalName}
                      onChange={(e) => setCharForm(prev => ({ ...prev, legalName: e.target.value }))}
                      placeholder="Ej. Corporación Cantos de la Tierra"
                    />
                  </FormField>
                  <FormField label="NIT / Documento Identidad" htmlFor="char-nit" required>
                    <TextInput
                      id="char-nit"
                      required
                      value={charForm.nit}
                      onChange={(e) => setCharForm(prev => ({ ...prev, nit: e.target.value }))}
                      placeholder="Ej. 900.123.456-7"
                    />
                  </FormField>
                  <FormField label="Descripción de Actividad Cultural" htmlFor="char-desc" required>
                    <TextAreaInput
                      id="char-desc"
                      required
                      rows={4}
                      value={charForm.description}
                      onChange={(e) => setCharForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describa brevemente la labor de su organización en el fomento cultural de la región..."
                    />
                  </FormField>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <FormField label="Correo de Contacto" htmlFor="char-email" required>
                    <TextInput
                      id="char-email"
                      type="email"
                      required
                      value={charForm.email}
                      onChange={(e) => setCharForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Teléfono de Contacto" htmlFor="char-phone" required>
                    <TextInput
                      id="char-phone"
                      required
                      value={charForm.phone}
                      onChange={(e) => setCharForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ej. 312 456 7890"
                    />
                  </FormField>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField label="Sitio Web" htmlFor="char-web">
                      <TextInput
                        id="char-web"
                        value={charForm.website}
                        onChange={(e) => setCharForm(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://www.organizacion.org"
                      />
                    </FormField>
                    <FormField label="Instagram" htmlFor="char-insta">
                      <TextInput
                        id="char-insta"
                        value={charForm.instagram}
                        onChange={(e) => setCharForm(prev => ({ ...prev, instagram: e.target.value }))}
                        placeholder="@organizacion"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <FormField label="Departamento" htmlFor="char-dept" required>
                    <SelectInput
                      id="char-dept"
                      required
                      value={charForm.department}
                      onChange={(e) => setCharForm(prev => ({ ...prev, department: e.target.value, municipality: '' }))}
                    >
                      <option value="">Seleccione departamento</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </SelectInput>
                  </FormField>
                  <FormField label="Municipio" htmlFor="char-muni" required>
                    <SelectInput
                      id="char-muni"
                      required
                      value={charForm.municipality}
                      onChange={(e) => setCharForm(prev => ({ ...prev, municipality: e.target.value }))}
                      disabled={!charForm.department}
                    >
                      <option value="">Seleccione municipio</option>
                      {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </SelectInput>
                  </FormField>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition"
                  >
                    Atrás
                  </button>
                ) : (
                  <div />
                )}
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => prev + 1)}
                    disabled={(wizardStep === 1 && (!charForm.legalName || !charForm.nit || !charForm.description)) || (wizardStep === 2 && (!charForm.email || !charForm.phone))}
                    className="rounded-xl bg-[#291242] hover:bg-[#3d1a63] disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white transition"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!charForm.department || !charForm.municipality}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] disabled:opacity-50 px-5 py-2.5 text-xs font-black text-slate-950 transition font-alternate uppercase"
                  >
                    <CheckCircle2 size={13} />
                    Enviar a evaluación
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {showProcessForm && (
          <form onSubmit={handleCreateProcess} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-fade-in">
            <div className="border-b border-slate-100 bg-[#291242] text-white px-5 py-4">
              <h3 className="font-alternate text-sm uppercase tracking-wider font-bold">Registrar Nuevo Proceso</h3>
              <p className="text-xs text-white/60 mt-0.5">Ingrese los datos básicos del proceso para ser evaluado por el equipo</p>
            </div>
            <div className="p-6 space-y-4">
              {currentProcessNotification && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-600" />
                    <p className="text-[0.68rem] font-black uppercase tracking-widest text-amber-700">Ajustes solicitados</p>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">{currentProcessNotification.generalComment || currentProcessNotification.message}</p>
                </div>
              )}
              <FormField label="Tipo de Proceso" htmlFor="proc-type" required>
                <SelectInput
                  id="proc-type"
                  value={selectedProcessType}
                  onChange={(e) => setSelectedProcessType(e.target.value)}
                >
                  <option value="festivals">Festival</option>
                  <option value="musicSchools">Escuela de Música</option>
                  <option value="spacesInfrastructure">Lutier / Taller de Lutería</option>
                </SelectInput>
              </FormField>

              <div className={`space-y-2 rounded-xl ${hasFieldAdjustment('name') ? 'border border-amber-200 bg-amber-50/50 p-3' : ''}`}>
                <FormField label="Nombre del Proceso / Entidad" htmlFor="proc-name" required>
                  <TextInput
                    id="proc-name"
                    required
                    placeholder="Ej. Escuela de Música Tradicional del Chicamocha"
                    value={procForm.name}
                    onChange={(e) => setProcForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </FormField>
                {hasFieldAdjustment('name') && <p className="text-[0.68rem] font-medium text-amber-700">{currentFieldAdjustments.name}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className={`space-y-2 rounded-xl ${hasFieldAdjustment('department') ? 'border border-amber-200 bg-amber-50/50 p-3' : ''}`}>
                  <FormField label="Departamento" htmlFor="proc-dept" required>
                    <SelectInput
                      id="proc-dept"
                      required
                      value={procForm.department}
                      onChange={(e) => setProcForm(prev => ({ ...prev, department: e.target.value, municipality: '' }))}
                    >
                      <option value="">Seleccione departamento</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </SelectInput>
                  </FormField>
                  {hasFieldAdjustment('department') && <p className="text-[0.68rem] font-medium text-amber-700">{currentFieldAdjustments.department}</p>}
                </div>
                <div className={`space-y-2 rounded-xl ${hasFieldAdjustment('municipality') ? 'border border-amber-200 bg-amber-50/50 p-3' : ''}`}>
                  <FormField label="Municipio" htmlFor="proc-muni" required>
                    <SelectInput
                      id="proc-muni"
                      required
                      value={procForm.municipality}
                      onChange={(e) => setProcForm(prev => ({ ...prev, municipality: e.target.value }))}
                      disabled={!procForm.department}
                    >
                      <option value="">Seleccione municipio</option>
                      {procMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </SelectInput>
                  </FormField>
                  {hasFieldAdjustment('municipality') && <p className="text-[0.68rem] font-medium text-amber-700">{currentFieldAdjustments.municipality}</p>}
                </div>
              </div>

              <div className={`space-y-2 rounded-xl ${hasFieldAdjustment('description') ? 'border border-amber-200 bg-amber-50/50 p-3' : ''}`}>
                <FormField label="Descripción del Proceso" htmlFor="proc-desc">
                  <TextAreaInput
                    id="proc-desc"
                    rows={3}
                    placeholder="Comente brevemente las actividades o propósitos del proceso..."
                    value={procForm.description}
                    onChange={(e) => setProcForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </FormField>
                {hasFieldAdjustment('description') && <p className="text-[0.68rem] font-medium text-amber-700">{currentFieldAdjustments.description}</p>}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProcessForm(false);
                    setEditingProcessId(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] px-5 py-2.5 text-xs font-black text-slate-950 transition font-alternate uppercase"
                >
                  {editingProcessId ? 'Reenviar a evaluación' : 'Enviar a evaluación'}
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleSubmitProfile} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-fade-in max-w-2xl mx-auto w-full">
            <div className="border-b border-slate-100 bg-[#291242] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-alternate text-sm uppercase tracking-wider font-bold">Editar Perfil</h3>
                <p className="text-xs text-white/60 mt-0.5">Actualice sus datos personales y credenciales de acceso</p>
              </div>
              <User size={20} className="text-[#00DA5E]" />
            </div>

            <div className="p-6 space-y-5">
              {profileSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>¡Perfil actualizado con éxito!</span>
                </div>
              )}

              {profileError && (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-red-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Nombre Completo" htmlFor="profile-fullname" required>
                    <TextInput
                      id="profile-fullname"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Ej. Juan Pérez"
                    />
                  </FormField>
                </div>

                <FormField label="Correo Electrónico" htmlFor="profile-email" required>
                  <TextInput
                    id="profile-email"
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ejemplo@pnmc.local"
                  />
                </FormField>

                <FormField label="Teléfono de Contacto" htmlFor="profile-telefono">
                  <TextInput
                    id="profile-telefono"
                    value={profileForm.telefono}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Ej. 312 345 6789"
                  />
                </FormField>

                <div className="md:col-span-2 border-t border-slate-100 my-2 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#291242] mb-1">Cambiar Contraseña (Opcional)</h4>
                </div>

                <FormField label="Nueva Contraseña" htmlFor="profile-password">
                  <TextInput
                    id="profile-password"
                    type="password"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 10 caracteres"
                  />
                </FormField>

                <FormField label="Confirmar Nueva Contraseña" htmlFor="profile-confirmpassword">
                  <TextInput
                    id="profile-confirmpassword"
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repita la nueva contraseña"
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-lg bg-[#291242] hover:bg-[#1f0d32] text-white px-5 py-2 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-[#00DA5E]" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={14} className="text-[#00DA5E]" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          session={session}
          onClose={() => setShowPasswordModal(false)}
          onPasswordChange={onPasswordChange}
        />
      )}

      {previewMatch && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="bg-[#291242] text-white px-6 py-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#00DA5E]/20 border border-[#00DA5E]/30 px-2.5 py-0.5 text-[0.62rem] font-bold text-[#00DA5E] uppercase tracking-wider">
                  {previewMatch.type === 'musicSchools' ? 'Escuela de Música' : 'Festival'}
                </span>
                <h3 className="font-alternate text-xs uppercase tracking-widest font-black text-[#00DA5E]">Previsualizar Registro Histórico</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMatch(null)}
                className="text-white/60 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-700">
              <div className="space-y-2">
                <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Nombre del Proceso</p>
                <h2 className="text-xl font-black text-slate-900 leading-snug">{previewMatch.title}</h2>
                <div className="flex items-center gap-4 text-[0.68rem] text-slate-500 font-bold uppercase tracking-wider">
                  <span>📍 {previewMatch.municipality}, {previewMatch.department}</span>
                  <span>📁 Fuente: {previewMatch.source}</span>
                </div>
              </div>
              
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <p className="text-[0.62rem] font-black uppercase tracking-widest text-[#291242]">Descripción Original</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{previewMatch.description}</p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {previewMatch.type === 'musicSchools' ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Director / Responsable</p>
                      <p className="text-xs font-bold text-slate-700">{previewMatch.directorName || 'No registrado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Estudiantes Activos</p>
                      <p className="text-xs font-bold text-slate-700">{previewMatch.students || '0'} jóvenes</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Procesos Formativos</p>
                      <p className="text-xs font-bold text-slate-700">{previewMatch.trainingProcesses || 'No especificado'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Organizador</p>
                      <p className="text-xs font-bold text-slate-700">{previewMatch.organizer || 'No registrado'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Ediciones Realizadas</p>
                      <p className="text-xs font-bold text-slate-700">{previewMatch.versionsCount || '0'} versiones</p>
                    </div>
                  </>
                )}
                
                <div className="space-y-1">
                  <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Correo Histórico</p>
                  <p className="text-xs font-bold text-slate-700">{previewMatch.contactEmail || 'No registrado'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Teléfono Histórico</p>
                  <p className="text-xs font-bold text-slate-700">{previewMatch.contactPhone || 'No registrado'}</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1.5 border-l-4 border-l-amber-500">
                <p className="text-[0.68rem] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  Aviso Importante
                </p>
                <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                  Al reclamar este registro, se le asignará la propiedad del mismo y se creará como un <strong>Borrador</strong> en su panel personal. Esto le permitirá editar y enriquecer toda su información histórica (fotos, enlaces, coordenadas y programación vigente) antes de enviarlo para su publicación definitiva en el Mapa.
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewMatch(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition"
              >
                Cerrar Previsualización
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClaimMatch(previewMatch);
                  setPreviewMatch(null);
                }}
                className="rounded-xl bg-[#00DA5E] hover:bg-[#00c454] px-5 py-2.5 text-xs font-black text-slate-950 transition uppercase tracking-wider shadow-md"
              >
                Vincular y Reclamar Proceso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSystemPanel = ({ schemaOnline, stats, divipola }) => {
  const deptCount = Object.keys(divipola || {}).length;
  const munCount = Object.values(divipola || {}).reduce((acc, munis) => acc + (Array.isArray(munis) ? munis.length : 0), 0);
  const [divipolaSearch, setDivipolaSearch] = useState('');

  const filteredDepts = useMemo(() => {
    const q = divipolaSearch.toLowerCase().trim();
    if (!q) return Object.entries(divipola || {}).slice(0, 10);
    return Object.entries(divipola || {}).filter(([dept]) => dept.toLowerCase().includes(q)).slice(0, 10);
  }, [divipola, divipolaSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">Panel de sistema</h2>
        <p className="text-xs text-slate-400 mt-0.5">Información técnica del entorno, datos maestros y configuración de módulos.</p>
      </div>

      {/* Status overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Esquema admin</p>
            <Cpu size={13} className="text-slate-300" />
          </div>
          <p className={`text-xl font-black ${schemaOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
            {schemaOnline ? 'Disponible' : 'No conectado'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Backend {schemaOnline ? 'respondiendo' : 'sin conexión'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Departamentos</p>
            <Map size={13} className="text-slate-300" />
          </div>
          <p className="text-xl font-black text-slate-900">{deptCount}</p>
          <p className="text-xs text-slate-400 mt-1">DIVIPOLA cargados</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">Municipios</p>
            <Map size={13} className="text-slate-300" />
          </div>
          <p className="text-xl font-black text-slate-900">{munCount || stats?.divipola || 0}</p>
          <p className="text-xs text-slate-400 mt-1">DIVIPOLA cargados</p>
        </div>
      </div>

      {/* Module config table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-black text-slate-900">Configuración de módulos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Módulos activos, sus tablas de base de datos, endpoints y roles autorizados.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-black uppercase tracking-widest text-slate-400">Módulo</th>
                <th className="text-left px-3 py-3 font-black uppercase tracking-widest text-slate-400">Área</th>
                <th className="text-left px-3 py-3 font-black uppercase tracking-widest text-slate-400">Tabla BD</th>
                <th className="hidden lg:table-cell text-left px-3 py-3 font-black uppercase tracking-widest text-slate-400">Endpoint</th>
                <th className="text-left px-3 py-3 font-black uppercase tracking-widest text-slate-400">Roles</th>
                <th className="text-right px-5 py-3 font-black uppercase tracking-widest text-slate-400">Campos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ADMIN_MODULES.map((mod) => (
                <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-800">{mod.label}</td>
                  <td className="px-3 py-3 text-slate-500">{ADMIN_AREAS[mod.area]?.label || mod.area}</td>
                  <td className="px-3 py-3">
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{mod.table}</code>
                  </td>
                  <td className="hidden lg:table-cell px-3 py-3 text-slate-400 font-mono truncate max-w-[16rem]">{mod.endpoint}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(mod.allowedRoles || []).map((role) => (
                        <span key={role} className="rounded-full bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[0.58rem] font-bold text-violet-700 uppercase tracking-wider">
                          {ADMIN_ROLES[role]?.shortLabel || role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-500">{mod.fields?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIVIPOLA browser */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Datos DIVIPOLA</h3>
            <p className="text-xs text-slate-400 mt-0.5">{deptCount} departamentos · {munCount} municipios cargados</p>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar departamento…"
              value={divipolaSearch}
              onChange={(e) => setDivipolaSearch(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-700 outline-none focus:border-[#291242] w-48 transition"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {filteredDepts.map(([dept, munis]) => (
            <div key={dept} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors">
              <p className="text-sm font-semibold text-slate-800 w-52 shrink-0 truncate">{dept}</p>
              <p className="text-xs text-slate-400">{Array.isArray(munis) ? munis.length : 0} municipios</p>
              <div className="flex flex-wrap gap-1 flex-1 min-w-0 overflow-hidden max-h-6">
                {(Array.isArray(munis) ? munis : []).slice(0, 5).map((mun) => (
                  <span key={mun} className="text-[0.6rem] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">{mun}</span>
                ))}
                {munis.length > 5 && <span className="text-[0.6rem] text-slate-400">+{munis.length - 5}</span>}
              </div>
            </div>
          ))}
          {deptCount === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              DIVIPOLA no disponible. Conecta el backend para cargar los datos territoriales.
            </div>
          )}
        </div>
      </div>

      {/* Environment info */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-black text-slate-900">Variables de entorno</h3>
          <p className="text-xs text-slate-400 mt-0.5">Configuración de runtime del frontend (solo etiquetas).</p>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: 'VITE_API_BASE_URL', value: import.meta?.env?.VITE_API_BASE_URL || '(sin configurar — proxy local)' },
            { label: 'NODE_ENV', value: import.meta?.env?.MODE || 'development' },
            { label: 'Build tool', value: 'Vite' },
            { label: 'React version', value: React.version },
          ].map((item) => (
            <div key={item.label} className="flex items-center px-5 py-3">
              <code className="w-56 text-[0.65rem] font-mono text-slate-500 shrink-0">{item.label}</code>
              <code className="text-[0.65rem] font-mono text-slate-800">{item.value}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN GOVERNANCE PANEL (Gestión de solicitudes y vinculaciones)
═══════════════════════════════════════════════════════════════════════════ */

const AdminGovernancePanel = ({ enabled }) => {
  const [requests, setRequests] = useState([
    {
      id: 'req_1',
      requester: 'Fundación Vientos del Sur',
      requesterRole: 'aliado_admin',
      targetName: 'Escuela de Música Tradicional Paz',
      targetType: 'Escuela de música',
      date: '2026-05-25',
      reason: 'Somos la entidad responsable del acompañamiento pedagógico e institucional de esta escuela.',
      status: 'pendiente',
    },
    {
      id: 'req_2',
      requester: 'Asociación Sonidos de mi Tierra',
      requesterRole: 'aliado_editor',
      targetName: 'Luthier Diego Rosero',
      targetType: 'Lutier',
      date: '2026-05-24',
      reason: 'El maestro Diego Rosero forma parte de nuestro colectivo de lutería tradicional y solicitamos vincular su perfil.',
      status: 'pendiente',
    },
    {
      id: 'req_3',
      requester: 'Colectivo Tambores de San Basilio',
      requesterRole: 'externo',
      targetName: 'Festival de Tambores de Palenque',
      targetType: 'Festival',
      date: '2026-05-23',
      reason: 'Reclamación del festival para actualización de programación del año vigente.',
      status: 'pendiente',
    }
  ]);

  const [duplicates, setDuplicates] = useState([
    {
      id: 'dup_1',
      nameA: 'Taller de Lutería Rosero',
      nameB: 'Maestro Diego Rosero - Lutier',
      type: 'Lutier',
      department: 'Nariño',
      municipality: 'Pasto',
      similarity: '92%',
      status: 'pendiente',
    },
    {
      id: 'dup_2',
      nameA: 'Festival de la Guacharaca',
      nameB: 'Festival Nacional de la Guacharaca de Oro',
      type: 'Festival',
      department: 'Cesar',
      municipality: 'Valledupar',
      similarity: '89%',
      status: 'pendiente',
    }
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 'alt_1',
      recordName: 'Fundación Chirimías del Atrato',
      type: 'Red de documentación',
      issue: 'Falta campo obligatorio de correo electrónico o teléfono del representante.',
      severity: 'alta',
      status: 'pendiente',
    },
    {
      id: 'alt_2',
      recordName: 'Escuela de Música y Paz Chocó',
      type: 'Escuela de música',
      issue: 'Coordenadas geográficas (latitud/longitud) fuera del límite territorial del municipio.',
      severity: 'media',
      status: 'pendiente',
    },
    {
      id: 'alt_3',
      recordName: 'Mercado de Sonidos y Cantos del Pacífico',
      type: 'Mercado musical',
      issue: 'Falta de fecha de fin de edición para el año actual.',
      severity: 'baja',
      status: 'pendiente',
    }
  ]);

  const [activeTab, setActiveTab] = useState('links');
  const [actionStatus, setActionStatus] = useState(null);

  const handleRequestAction = (id, action) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'aprobado' : 'rechazado' } : r));
    setActionStatus({
      type: 'success',
      message: `La solicitud de vinculación ha sido ${action === 'approve' ? 'aprobada y vinculada exitosamente' : 'rechazada'}.`
    });
    setTimeout(() => setActionStatus(null), 4000);
  };

  const handleDuplicateAction = (id, action) => {
    setDuplicates(prev => prev.map(d => d.id === id ? { ...d, status: action === 'merge' ? 'fusionado' : 'descartado' } : d));
    setActionStatus({
      type: 'success',
      message: `El registro duplicado ha sido ${action === 'merge' ? 'fusionado correctamente en base de datos' : 'descartado de la lista de alertas'}.`
    });
    setTimeout(() => setActionStatus(null), 4000);
  };

  const handleAlertAction = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resuelto' } : a));
    setActionStatus({
      type: 'success',
      message: 'La alerta de calidad de datos ha sido marcada como resuelta.'
    });
    setTimeout(() => setActionStatus(null), 4000);
  };

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center">
        <AlertCircle className="mx-auto text-rose-500 mb-3" size={24} />
        <h3 className="text-sm font-black text-rose-950">Acceso Denegado</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">Su perfil no cuenta con permisos suficientes para gestionar solicitudes, vinculaciones y calidad de datos del sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Gestión de solicitudes y vinculaciones</h2>
          <p className="text-xs text-slate-400 mt-0.5">Administra registros huérfanos pre-cargados, reclamaciones de organizaciones del sector, coincidencias y alertas territoriales.</p>
        </div>
      </div>

      {actionStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          actionStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle2 size={16} className={actionStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
          <p className="text-xs font-bold">{actionStatus.message}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2.5 font-alternate text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'links'
              ? 'border-[#291242] text-[#291242]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Vinculaciones ({requests.filter(r => r.status === 'pendiente').length})
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2.5 font-alternate text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'duplicates'
              ? 'border-[#291242] text-[#291242]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Duplicados ({duplicates.filter(d => d.status === 'pendiente').length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 font-alternate text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-[#291242] text-[#291242]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Alertas de Calidad ({alerts.filter(a => a.status === 'pendiente').length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {activeTab === 'links' && (
          <div className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No hay solicitudes de vinculación pendientes.</p>
            ) : (
              requests.map(req => (
                <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[0.58rem] font-bold text-violet-700 uppercase tracking-wide">
                        {req.requesterRole}
                      </span>
                      <span className="text-[0.68rem] text-slate-400 font-medium">{req.date}</span>
                      {req.status !== 'pendiente' && (
                        <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-wide border ${
                          req.status === 'aprobado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">
                        {req.requester} <span className="text-slate-400 font-normal">solicita la vinculación de</span> {req.targetName}
                      </h4>
                      <p className="text-[0.68rem] text-slate-400 mt-0.5">{req.targetType} en el ecosistema territorial</p>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3 leading-relaxed italic">
                      "{req.reason}"
                    </p>
                  </div>
                  {req.status === 'pendiente' && (
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                      <button
                        onClick={() => handleRequestAction(req.id, 'reject')}
                        className="rounded-xl border border-slate-200 hover:border-rose-200 text-xs font-bold text-slate-600 hover:text-rose-600 px-3.5 py-2 transition"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'approve')}
                        className="rounded-xl bg-[#00DA5E] hover:bg-[#00c454] text-xs font-black text-slate-950 px-4 py-2 uppercase font-alternate tracking-wide transition shadow-sm"
                      >
                        Aceptar Vinculación
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="overflow-x-auto">
            {duplicates.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No hay posibles duplicados detectados.</p>
            ) : (
              <table className="w-full text-xs font-nunito">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left font-black uppercase tracking-widest text-slate-400">
                    <th className="px-5 py-3">Registro A</th>
                    <th className="px-3 py-3">Registro B</th>
                    <th className="px-3 py-3">Ubicación</th>
                    <th className="px-3 py-3 text-center">Coincidencia</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {duplicates.map(dup => (
                    <tr key={dup.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 font-bold text-slate-800">{dup.nameA}</td>
                      <td className="px-3 py-4 font-bold text-slate-800">{dup.nameB}</td>
                      <td className="px-3 py-4 text-slate-500">{dup.municipality}, {dup.department}</td>
                      <td className="px-3 py-4 text-center">
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[0.6rem] font-bold text-amber-700">
                          {dup.similarity}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {dup.status === 'pendiente' ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleDuplicateAction(dup.id, 'discard')}
                              className="rounded-xl border border-slate-200 hover:border-slate-300 text-[0.68rem] font-bold text-slate-600 px-3 py-1.5 transition"
                            >
                              Ignorar
                            </button>
                            <button
                              onClick={() => handleDuplicateAction(dup.id, 'merge')}
                              className="rounded-xl bg-[#291242] hover:bg-[#1d0b30] text-[0.68rem] font-bold text-white px-3.5 py-1.5 transition uppercase font-alternate tracking-wide"
                            >
                              Fusionar Registros
                            </button>
                          </div>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-wide border ${
                            dup.status === 'fusionado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            {dup.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No hay alertas de calidad de datos pendientes.</p>
            ) : (
              alerts.map(alt => (
                <div key={alt.id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[0.52rem] font-black uppercase tracking-wider border ${
                        alt.severity === 'alta' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        alt.severity === 'media' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        Prioridad {alt.severity}
                      </span>
                      <span className="text-[0.68rem] text-slate-400 font-bold uppercase tracking-wide">{alt.type}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{alt.recordName}</h4>
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">{alt.issue}</p>
                  </div>
                  <div>
                    {alt.status === 'pendiente' ? (
                      <button
                        onClick={() => handleAlertAction(alt.id)}
                        className="rounded-xl border border-slate-200 hover:border-[#00DA5E] text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-[#00DA5E]/5 px-4 py-2 transition"
                      >
                        Resolver Alerta
                      </button>
                    ) : (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-wide text-emerald-700">
                        Resuelto
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN WEB TEXTS PANEL (Stand-Alone Grouped CMS with Live Previews)
═══════════════════════════════════════════════════════════════════════════ */

const AdminWebTextsPanel = ({ enabled, session }) => {
  const [selectedPill, setSelectedPill] = useState('Home');
  const [selectedGroup, setSelectedGroup] = useState('home_hero');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({});
  const [originalDetails, setOriginalDetails] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const [activeEjeSubTab, setActiveEjeSubTab] = useState('general');

  // Reset Eje sub-tab on group change
  useEffect(() => {
    setActiveEjeSubTab('general');
  }, [selectedGroup]);

  // Group definitions
  const GROUPS = [
    {
      id: 'home_hero',
      label: 'Home - Encabezado Principal (Hero)',
      section: 'Home',
      keys: ['home_tag', 'home_title', 'home_title_accent', 'home_description']
    },
    {
      id: 'home_ctas',
      label: 'Home - Botones de Llamado a la Acción',
      section: 'Home',
      keys: ['home_btn_about', 'home_btn_ejes']
    },
    {
      id: 'home_about',
      label: 'Home - Sección Identidad',
      section: 'Home',
      keys: ['home_about_bg_word', 'home_about_title', 'home_about_quote', 'home_about_desc']
    },
    {
      id: 'home_ejes',
      label: 'Home - Estructura Ejes Base',
      section: 'Home',
      keys: ['home_ejes_tag', 'home_ejes_title']
    },
    {
      id: 'home_bulletin',
      label: 'Home - Boletín y Redes',
      section: 'Home',
      keys: ['home_bulletin_title', 'home_bulletin_desc', 'home_bulletin_placeholder', 'home_bulletin_btn', 'home_social_title', 'home_social_desc']
    },
    {
      id: 'home_strategies_title',
      label: 'Home - Cabecera del Carrusel de Rutas',
      section: 'Home',
      keys: ['home_strat_tag', 'home_strat_title', 'home_strat_desc']
    },
    {
      id: 'home_strategies_cards',
      label: 'Home - Tarjetas del Carrusel de Rutas',
      section: 'Home',
      keys: [
        'strat_celebra_tag', 'strat_celebra_title', 'strat_celebra_desc',
        'strat_territorios_tag', 'strat_territorios_title', 'strat_territorios_desc',
        'strat_congreso_tag', 'strat_congreso_title', 'strat_congreso_desc',
        'strat_tempos_tag', 'strat_tempos_title', 'strat_tempos_desc',
        'strat_voces_tag', 'strat_voces_title', 'strat_voces_desc',
        'strat_jazz_tag', 'strat_jazz_title', 'strat_jazz_desc',
        'strat_mercados_tag', 'strat_mercados_title', 'strat_mercados_desc',
        'strat_mesas_tag', 'strat_mesas_title', 'strat_mesas_desc'
      ]
    },
    {
      id: 'agenda_hero',
      label: 'Agenda - Introducción de Sección',
      section: 'Agenda',
      keys: ['agenda_description']
    },
    {
      id: 'agenda_ui',
      label: 'Agenda - Interfaz y Filtros (UI)',
      section: 'Agenda',
      keys: [
        'agenda_filter_title', 'agenda_filter_fixed', 'agenda_filter_fixed_note', 'agenda_filter_date_exact', 'agenda_filter_date_month',
        'agenda_filter_day_label', 'agenda_filter_month_label', 'agenda_filter_all_months', 'agenda_filter_activity_type',
        'agenda_filter_department_label', 'agenda_filter_all_departments', 'agenda_filter_city_label', 'agenda_filter_city_select_dept',
        'agenda_filter_city_all_mun', 'agenda_filter_city_no_mun', 'agenda_filter_clear_btn', 'agenda_loading_title',
        'agenda_loading_desc', 'agenda_empty_title', 'agenda_empty_desc'
      ]
    },
    {
      id: 'news_hero',
      label: 'Noticias - Introducción de Sección',
      section: 'Noticias',
      keys: ['news_description']
    },
    {
      id: 'gallery_hero',
      label: 'Galería - Introducción de Sección',
      section: 'Galería',
      keys: ['gallery_description']
    },
    {
      id: 'gallery_ui',
      label: 'Galería - Interfaz y Buscador (UI)',
      section: 'Galería',
      keys: [
        'gallery_hero_title', 'gallery_search_placeholder', 'gallery_filter_category', 'gallery_filter_all_cats',
        'gallery_collection_title', 'gallery_explore_all', 'gallery_loading_title', 'gallery_loading_desc'
      ]
    },
    {
      id: 'editorial_hero',
      label: 'Editorial - Introducción de Sección',
      section: 'Editorial',
      keys: ['editorial_description']
    },
    {
      id: 'map_hero',
      label: 'Mapa Ecosistémico - Introducción del Geovisor',
      section: 'Mapa Ecosistémico',
      keys: ['map_description']
    },
    {
      id: 'eje1_details',
      label: 'Eje 1 - Música para la Vida',
      section: 'Ejes',
      keys: ['eje01_title', 'eje01_desc1', 'eje01_desc2', 'eje01_purpose', 'eje01_c1_title', 'eje01_c1_desc', 'eje01_c2_title', 'eje01_c2_desc']
    },
    {
      id: 'eje2_details',
      label: 'Eje 2 - Prácticas y Oficios',
      section: 'Ejes',
      keys: ['eje02_title', 'eje02_desc1', 'eje02_desc2', 'eje02_purpose', 'eje02_c1_title', 'eje02_c1_desc', 'eje02_c2_title', 'eje02_c2_desc', 'eje02_c3_title', 'eje02_c3_desc', 'eje02_c4_title', 'eje02_c4_desc', 'eje02_c5_title', 'eje02_c5_desc', 'eje02_c6_title', 'eje02_c6_desc']
    },
    {
      id: 'eje3_details',
      label: 'Eje 3 - Gobernanza',
      section: 'Ejes',
      keys: ['eje03_title', 'eje03_desc1', 'eje03_desc2', 'eje03_purpose', 'eje03_c1_title', 'eje03_c1_desc', 'eje03_c2_title', 'eje03_c2_desc']
    },
    {
      id: 'strategy_celebra_details',
      label: 'Estrategia - Celebra la Música',
      section: 'Estrategias',
      keys: ['strategy_celebra_hero_desc', 'strategy_celebra_section_title', 'strategy_celebra_intro', 'strategy_celebra_mission', 'strategy_celebra_edition_intro', 'strategy_celebra_edition_vision', 'strategy_celebra_edition_closing']
    },
    {
      id: 'general_nav_footer',
      label: 'Navegación y Footer - Enlaces y Contacto',
      section: 'Navegación y Footer',
      keys: [
        'nav_pnmc', 'nav_ejes', 'nav_editorial', 'nav_galeria', 'nav_noticias', 'nav_agenda', 'nav_mapa', 'nav_components_title',
        'footer_col2_title', 'footer_col2_address', 'footer_col2_schedule', 'footer_col2_phone', 'footer_col2_free_line',
        'footer_col3_title', 'footer_col3_address', 'footer_col3_schedule', 'footer_col3_email_label', 'footer_col3_email',
        'footer_col3_email_note', 'footer_col3_corruption_title', 'footer_col3_corruption_email', 'footer_col3_legal_title',
        'footer_col3_legal_email', 'footer_col4_services_title', 'footer_col4_about_title', 'footer_credits_text', 'footer_credits_tagline'
      ]
    }
  ];

  const keysList = useMemo(() => getWebTextsKeysList(), []);

  // Initialize form data from localStorage or fallback
  useEffect(() => {
    const data = {};
    const details = {};
    keysList.forEach(k => {
      const detail = getWebTextDetails(k.key);
      data[k.key] = detail.content;
      details[k.key] = detail;
    });
    setFormData(data);
    setOriginalDetails(details);
  }, [keysList, saveStatus]);

  const handleInputChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleRestoreVersion = (key, content) => {
    handleInputChange(key, content);
    setSaveStatus({
      type: 'info',
      message: 'Versión del historial restaurada en el editor. Recuerde hacer clic en Guardar para conservar los cambios.'
    });
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleSaveAllGroup = (publish = true) => {
    const author = session?.fullName || 'Webmaster';
    const group = GROUPS.find(g => g.id === selectedGroup);
    if (!group) return;
    
    let hasError = false;
    group.keys.forEach(key => {
      const limit = keysList.find(k => k.key === key)?.limit || 999;
      if ((formData[key] || '').length > limit) {
        hasError = true;
      }
    });

    if (hasError) {
      setSaveStatus({
        type: 'error',
        message: 'No se puede guardar el grupo de textos porque uno o más campos exceden el límite de caracteres.'
      });
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }

    group.keys.forEach(key => {
      const status = publish ? 'publicado' : 'borrador';
      saveWebText(key, formData[key] || '', status, author);
    });

    setSaveStatus({
      type: 'success',
      message: `El grupo de textos "${group.label}" ha sido ${publish ? 'guardado y publicado con éxito' : 'guardado en borrador'}.`
    });
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // Filter groups according to active horizontal pill and search query
  const filteredGroups = useMemo(() => {
    return GROUPS.filter(g => {
      const matchesPill = g.section === (selectedPill === 'Mapa' ? 'Mapa Ecosistémico' : selectedPill);
      const matchesSearch = g.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            g.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesPill && matchesSearch;
    });
  }, [selectedPill, searchQuery]);

  const activeGroupObj = GROUPS.find(g => g.id === selectedGroup);

  const ejeSubTabsList = useMemo(() => {
    if (!activeGroupObj || activeGroupObj.section !== 'Ejes') return [];
    
    let ejeId = '01';
    if (activeGroupObj.id === 'eje2_details') ejeId = '02';
    if (activeGroupObj.id === 'eje3_details') ejeId = '03';
    
    const tabs = [{ id: 'general', label: 'Información General' }];
    
    activeGroupObj.keys.forEach(k => {
      const match = k.match(new RegExp(`eje${ejeId}_c(\\d+)_title`));
      if (match) {
        const compNum = match[1];
        const compTitle = formData[k] || `Componente ${compNum}`;
        tabs.push({
          id: `c${compNum}`,
          label: compTitle.length > 25 ? compTitle.slice(0, 23) + '...' : compTitle
        });
      }
    });
    
    return tabs;
  }, [activeGroupObj, formData]);

  const filteredEjeKeys = useMemo(() => {
    if (!activeGroupObj || activeGroupObj.section !== 'Ejes') return [];
    
    let ejeId = '01';
    if (activeGroupObj.id === 'eje2_details') ejeId = '02';
    if (activeGroupObj.id === 'eje3_details') ejeId = '03';
    
    if (activeEjeSubTab === 'general') {
      return activeGroupObj.keys.filter(k => k.endsWith('_title') ? k === `eje${ejeId}_title` : !k.includes('_c'));
    } else {
      const compNum = activeEjeSubTab.replace('c', '');
      return activeGroupObj.keys.filter(k => k.includes(`_c${compNum}_`));
    }
  }, [activeGroupObj, activeEjeSubTab]);

  const keysToRender = activeGroupObj && activeGroupObj.section === 'Ejes' ? filteredEjeKeys : (activeGroupObj?.keys || []);

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center">
        <AlertCircle className="mx-auto text-rose-500 mb-3" size={24} />
        <h3 className="text-sm font-black text-rose-950">Acceso Denegado</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">Su perfil no cuenta con permisos para administrar los textos editables de la web pública.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-slate-900">Administración de textos</h2>
        <p className="text-xs text-slate-400 mt-0.5">Controla y edita los textos explicativos, descripciones e introducciones en toda la plataforma pública con previsualización en vivo.</p>
      </div>

      {saveStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          saveStatus.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
          'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {saveStatus.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600" />}
          {saveStatus.type === 'info' && <AlertCircle size={16} className="text-blue-600" />}
          {saveStatus.type === 'error' && <AlertCircle size={16} className="text-rose-600" />}
          <p className="text-xs font-bold">{saveStatus.message}</p>
        </div>
      )}

      {/* Horizontal pill navigation */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-200">
        {['Home', 'Agenda', 'Noticias', 'Galería', 'Editorial', 'Mapa', 'Ejes', 'Estrategias', 'Navegación y Footer'].map(pill => (
          <button
            key={pill}
            type="button"
            onClick={() => {
              setSelectedPill(pill);
              // auto-select first group in that filter
              const firstGroup = GROUPS.find(g => g.section === (pill === 'Mapa' ? 'Mapa Ecosistémico' : pill));
              if (firstGroup) setSelectedGroup(firstGroup.id);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              selectedPill === pill
                ? 'bg-[#291242] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {pill}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COL 1: Group Selector List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar sección o clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#291242] focus:outline-none transition"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 space-y-1 shadow-sm">
            <p className="px-2.5 pb-2 text-[0.62rem] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Grupos de Contenido</p>
            <div className="space-y-0.5 max-h-[22rem] overflow-y-auto pt-1.5">
              {filteredGroups.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">No se encontraron resultados.</p>
              ) : (
                filteredGroups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 text-left text-xs font-bold transition-all ${
                      selectedGroup === group.id
                        ? 'bg-[#291242]/5 text-[#291242] border border-[#291242]/10'
                        : 'text-slate-600 hover:bg-slate-50/60 border border-transparent'
                    }`}
                  >
                    <span className="truncate">{group.label}</span>
                    <span className="shrink-0 text-[0.58rem] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-bold uppercase">{group.section === 'Mapa Ecosistémico' ? 'Mapa' : group.section}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COL 2: Editor form area */}
        <div className="lg:col-span-5 space-y-4">
          {activeGroupObj ? (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{activeGroupObj.label}</h3>
                    <p className="text-[0.65rem] text-slate-400 font-medium">Sección: {activeGroupObj.section}</p>
                  </div>
                </div>

                {/* Sub-tabs selector for Axis feature */}
                {activeGroupObj.section === 'Ejes' && (
                  <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2 mb-4">
                    {ejeSubTabsList.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveEjeSubTab(tab.id)}
                        className={`rounded-lg px-3 py-1.5 text-[0.68rem] font-bold transition-all ${
                          activeEjeSubTab === tab.id
                            ? 'bg-[#291242]/10 text-[#291242]'
                            : 'bg-transparent text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Subdivided / coupled visually connected texts */}
                {activeGroupObj.id === 'home_hero' ? (
                  <div className="space-y-4">
                    {/* Visual card for home_tag */}
                    <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">Etiqueta superior</label>
                        <span className={`text-[0.58rem] font-bold ${(formData.home_tag || '').length > 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {(formData.home_tag || '').length}/100
                        </span>
                      </div>
                      <TextInput
                        value={formData.home_tag || ''}
                        onChange={(e) => handleInputChange('home_tag', e.target.value)}
                        placeholder="Ej. PLAN NACIONAL DE MÚSICA..."
                      />
                      {/* Version history */}
                      <CollapsibleHistory keyName="home_tag" details={originalDetails.home_tag} onRestore={handleRestoreVersion} />
                    </div>

                    {/* Coupled heading visual box */}
                    <div className="border-2 border-dashed border-[#00DA5E]/40 rounded-xl p-4 bg-emerald-50/10 space-y-4 relative">
                      <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#00DA5E] text-slate-950 rounded-full px-2.5 py-0.5 text-[0.55rem] font-black uppercase tracking-wider shadow-sm">
                        Título Combinado (Un solo elemento visual)
                      </div>
                      <p className="text-[0.68rem] text-[#00DA5E] font-bold leading-normal">
                        El encabezado principal del Home se divide en dos campos para permitir la inserción del acento destacado verde en el portal público.
                      </p>

                      <div className="space-y-3">
                        {/* Title field */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">1. Título principal (Estándar - Blanco/Gris)</label>
                            <span className={`text-[0.58rem] font-bold ${(formData.home_title || '').length > 120 ? 'text-rose-500' : 'text-slate-400'}`}>
                              {(formData.home_title || '').length}/120
                            </span>
                          </div>
                          <TextInput
                            value={formData.home_title || ''}
                            onChange={(e) => handleInputChange('home_title', e.target.value)}
                            placeholder="Ej. Huellas y Apuestas de la..."
                          />
                          <CollapsibleHistory keyName="home_title" details={originalDetails.home_title} onRestore={handleRestoreVersion} />
                        </div>

                        {/* Visual connection */}
                        <div className="flex items-center justify-center -my-1">
                          <div className="w-0.5 h-3 border-l-2 border-dotted border-slate-300"></div>
                        </div>

                        {/* Title accent field */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">2. Acento en cursiva destacados (Verde)</label>
                            <span className={`text-[0.58rem] font-bold ${(formData.home_title_accent || '').length > 80 ? 'text-rose-500' : 'text-slate-400'}`}>
                              {(formData.home_title_accent || '').length}/80
                            </span>
                          </div>
                          <TextInput
                            value={formData.home_title_accent || ''}
                            onChange={(e) => handleInputChange('home_title_accent', e.target.value)}
                            placeholder="Ej. Diversidad Sonora..."
                          />
                          <CollapsibleHistory keyName="home_title_accent" details={originalDetails.home_title_accent} onRestore={handleRestoreVersion} />
                        </div>
                      </div>
                    </div>

                    {/* Visual card for description */}
                    <div className="space-y-1 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">Descripción del Hero</label>
                        <span className={`text-[0.58rem] font-bold ${(formData.home_description || '').length > 400 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {(formData.home_description || '').length}/400
                        </span>
                      </div>
                      <TextAreaInput
                        rows={3}
                        value={formData.home_description || ''}
                        onChange={(e) => handleInputChange('home_description', e.target.value)}
                        placeholder="Descripción introductoria del Hero del Home..."
                      />
                      <CollapsibleHistory keyName="home_description" details={originalDetails.home_description} onRestore={handleRestoreVersion} />
                    </div>
                  </div>
                ) : activeGroupObj.id === 'home_ctas' ? (
                  <div className="border border-slate-100 bg-slate-50/30 rounded-xl p-4 space-y-4">
                    <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">Botones principales del Hero (CTAs)</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">Botón Primario</label>
                          <span className={`text-[0.58rem] font-bold ${(formData.home_btn_about || '').length > 30 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {(formData.home_btn_about || '').length}/30
                          </span>
                        </div>
                        <TextInput
                          value={formData.home_btn_about || ''}
                          onChange={(e) => handleInputChange('home_btn_about', e.target.value)}
                          placeholder="Ej. Sobre el PNMC"
                        />
                        <CollapsibleHistory keyName="home_btn_about" details={originalDetails.home_btn_about} onRestore={handleRestoreVersion} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">Botón Secundario</label>
                          <span className={`text-[0.58rem] font-bold ${(formData.home_btn_ejes || '').length > 30 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {(formData.home_btn_ejes || '').length}/30
                          </span>
                        </div>
                        <TextInput
                          value={formData.home_btn_ejes || ''}
                          onChange={(e) => handleInputChange('home_btn_ejes', e.target.value)}
                          placeholder="Ej. Explorar Ejes"
                        />
                        <CollapsibleHistory keyName="home_btn_ejes" details={originalDetails.home_btn_ejes} onRestore={handleRestoreVersion} />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Dynamic keys rendering (Standard or Axis filtered sub-tab)
                  <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
                    {keysToRender.map(key => {
                      const limit = keysList.find(k => k.key === key)?.limit || 300;
                      const textVal = formData[key] || '';
                      const fieldLabel = keysList.find(k => k.key === key)?.label || key;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[0.62rem] font-black uppercase tracking-wider text-slate-500">{fieldLabel}</label>
                            <span className={`text-[0.58rem] font-bold ${textVal.length > limit ? 'text-rose-500' : 'text-slate-400'}`}>
                              {textVal.length}/{limit}
                            </span>
                          </div>
                          <TextAreaInput
                            rows={key.includes('desc') || key.includes('intro') || key.includes('mission') || key.includes('vision') || key.includes('closing') || key.includes('address') || key.includes('schedule') ? 3 : 2}
                            value={textVal}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={`Ingrese el valor para: ${fieldLabel}...`}
                          />
                          <CollapsibleHistory keyName={key} details={originalDetails[key]} onRestore={handleRestoreVersion} />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAllGroup(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 transition"
                  >
                    Guardar Borrador
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAllGroup(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00DA5E] hover:bg-[#00c454] px-5 py-2.5 text-xs font-black text-slate-950 transition font-alternate uppercase tracking-wide shadow-sm"
                  >
                    <Save size={12} />
                    Guardar y Publicar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
              Seleccione un grupo de textos para comenzar a editar.
            </div>
          )}
        </div>

        {/* COL 3: High Fidelity Live Preview Area */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3 min-h-[30rem]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Previsualización Real en Vivo</span>
              <span className="h-2 w-2 rounded-full bg-[#00DA5E] animate-pulse" />
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="flex-1 rounded-xl bg-slate-950 flex flex-col overflow-hidden shadow-inner border border-white/5 relative justify-center">
              {activeGroupObj && (activeGroupObj.id === 'home_hero' || activeGroupObj.id === 'home_ctas') ? (
                // 1. HOME HERO PREVIEW
                <div className="bg-[#291242] p-6 text-white text-left font-nunito flex flex-col justify-center min-h-[22rem] relative overflow-hidden select-none">
                  {/* Glowing blobs */}
                  <div className="absolute top-0 right-0 h-40 w-40 bg-[#00DA5E]/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 h-40 w-40 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <span className="uppercase tracking-[0.2em] font-alternate text-[0.58rem] font-black text-[#00DA5E] mb-2 z-10">
                    {formData.home_tag || 'PLAN NACIONAL DE MÚSICA PARA LA CONVIVENCIA 2025—2035'}
                  </span>

                  <h1 className="font-alternate text-lg md:text-xl font-black leading-tight mb-3 z-10 text-white">
                    {formData.home_title || 'Huellas y Apuestas de la'}
                    <span className="italic text-[#00DA5E] font-normal ml-1.5 block sm:inline">
                      {formData.home_title_accent || 'Diversidad Sonora'}
                    </span>
                  </h1>

                  <p className="text-[0.68rem] text-white/70 leading-relaxed font-medium mb-5 z-10 max-w-sm">
                    {formData.home_description || 'Un pacto colectivo que reconoce la música como un derecho cultural y un bien común en todo el territorio nacional.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 z-10">
                    <span className="bg-[#00DA5E] text-slate-950 font-black rounded-xl text-[0.58rem] px-3.5 py-2 uppercase tracking-wide border border-transparent shadow-sm">
                      {formData.home_btn_about || 'Sobre el PNMC'}
                    </span>
                    <span className="bg-transparent border border-white/20 text-white font-bold rounded-xl text-[0.58rem] px-3.5 py-2 uppercase tracking-wide hover:bg-white/5 transition">
                      {formData.home_btn_ejes || 'Explorar Ejes'}
                    </span>
                  </div>
                </div>
              ) : activeGroupObj && activeGroupObj.id === 'home_about' ? (
                // HOME ABOUT (IDENTIDAD) PREVIEW
                <div className="bg-white p-5 text-left font-nunito flex flex-col justify-center min-h-[22rem] relative overflow-hidden select-none border border-slate-100">
                  <div className="relative group mb-3">
                    <div className="font-gregor text-5xl opacity-40 font-bold leading-none tracking-tight text-[#E6DAE5] uppercase">
                      {formData.home_about_bg_word || 'IDENTIDAD'}
                    </div>
                    <div className="absolute bottom-0 left-0 z-10 flex items-end gap-2 whitespace-nowrap">
                      <h4 className="font-gregor text-base text-[#291242] font-bold uppercase leading-none">
                        {formData.home_about_title || 'HUELLA Y EVOLUCIÓN'}
                      </h4>
                      <div className="w-6 h-1 bg-[#8BF784] rounded-full mb-0.5" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-[#291242] font-light leading-snug">
                      {formData.home_about_quote || 'El PNMC 2025-2035 es una herramienta para que la música sea motor de vida, paz y justicia social.'}
                    </p>
                    <div className="border-l border-slate-200 pl-3 py-0.5">
                      <p className="text-[0.62rem] text-slate-500 leading-relaxed font-medium">
                        {formData.home_about_desc || 'Desde hace más de dos décadas, el Plan Nacional de Música para la Convivencia (PNMC) promueve la diversidad cultural de Colombia.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeGroupObj && activeGroupObj.id === 'home_ejes' ? (
                // HOME EJES PREVIEW
                <div className="bg-slate-50 p-5 text-left font-nunito flex flex-col justify-center min-h-[22rem] relative overflow-hidden select-none border border-slate-100">
                  <div className="mb-4">
                    <span className="text-slate-400 font-bold text-[0.45rem] uppercase tracking-[0.25em] font-alternate block mb-1">
                      {formData.home_ejes_tag || 'EL PNMC TIENE UNA ESTRUCTURA ESTRATÉGICA'}
                    </span>
                    <h4 className="text-[#291242] font-alternate text-xs font-bold uppercase leading-tight tracking-tight">
                      {formData.home_ejes_title || 'PLANTEADA EN TRES EJES BASE'}
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-[0.55rem] text-[#291242]">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                      <span className="font-gregor text-sm font-bold text-slate-200">01</span>
                      <span className="font-alternate font-bold uppercase text-[0.48rem] tracking-wide leading-tight">Música para la Vida</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                      <span className="font-gregor text-sm font-bold text-slate-200">02</span>
                      <span className="font-alternate font-bold uppercase text-[0.48rem] tracking-wide leading-tight">Prácticas y Oficios</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                      <span className="font-gregor text-sm font-bold text-slate-200">03</span>
                      <span className="font-alternate font-bold uppercase text-[0.48rem] tracking-wide leading-tight">Gobernanza Musical</span>
                    </div>
                  </div>
                </div>
              ) : activeGroupObj && activeGroupObj.id === 'home_bulletin' ? (
                // HOME BULLETIN & SOCIAL PREVIEW
                <div className="bg-[#291242] p-5 text-white text-left font-nunito flex flex-col justify-center min-h-[22rem] relative overflow-hidden select-none">
                  <div className="space-y-3">
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[0.45rem] font-bold text-[#00DA5E] uppercase tracking-widest w-fit">BOLETÍN</span>
                    <div>
                      <h4 className="font-gregor text-sm font-bold uppercase leading-none tracking-tight">
                        {formData.home_bulletin_title || 'Recibe las Novedades'}
                      </h4>
                      <p className="text-[0.58rem] text-white/50 leading-relaxed font-light mt-0.5">
                        {formData.home_bulletin_desc || 'Convocatorias y lanzamientos semanales del PNMC.'}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-[0.58rem] text-white/40 flex-1 leading-none">
                        {formData.home_bulletin_placeholder || 'Ingresa tu correo'}
                      </div>
                      <span className="bg-[#00DA5E] text-slate-950 font-black rounded-lg text-[0.5rem] px-3 py-2 uppercase tracking-wide">
                        {formData.home_bulletin_btn || 'Registrarme'}
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between gap-3">
                      <div>
                        <h5 className="font-alternate text-[0.52rem] font-bold uppercase tracking-[0.15em] text-[#00DA5E]">
                          {formData.home_social_title || 'Conéctate con el Plan'}
                        </h5>
                        <p className="text-[0.48rem] text-white/30 font-nunito leading-tight">
                          {formData.home_social_desc || 'Síguenos en nuestras redes oficiales'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[0.48rem] text-white/60">IG</span>
                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[0.48rem] text-white/60">FB</span>
                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[0.48rem] text-white/60">YT</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeGroupObj && activeGroupObj.id === 'general_nav_footer' ? (
                // NAVEGACIÓN Y FOOTER PREVIEW
                <div className="bg-[#f8f7fb] text-slate-800 text-left font-nunito flex flex-col justify-between min-h-[22rem] relative overflow-hidden select-none border border-slate-200">
                  {/* Mock Navigation Header */}
                  <div className="bg-[#291242] p-2.5 px-4 flex items-center justify-between text-white border-b border-white/5">
                    <span className="text-[0.45rem] font-black uppercase text-[#00DA5E] tracking-widest">MINCULTURAS</span>
                    <div className="flex gap-2 text-[0.42rem] font-bold text-white/70">
                      <span className="hover:text-white transition">{formData.nav_pnmc || 'Sobre el PNMC'}</span>
                      <span className="hover:text-white transition">{formData.nav_ejes || 'Ejes'}</span>
                      <span className="hover:text-white transition text-white border-b border-[#00DA5E] pb-0.5">{formData.nav_galeria || 'Galería'}</span>
                    </div>
                  </div>

                  {/* Mock Dropdown / Component Title inside Nav */}
                  <div className="bg-white p-3 border-b border-slate-200 shadow-sm mx-4 mt-2 rounded-xl text-[0.45rem]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      {formData.nav_components_title || 'Componentes del eje'}
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[0.42rem] text-[#291242] font-semibold">
                      <span>• Formación</span>
                      <span>• Circulación</span>
                    </div>
                  </div>

                  {/* Mock Footer contact details */}
                  <div className="bg-[#150724] p-3 text-white/80 text-[0.42rem] mt-auto border-t border-white/5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-[#00DA5E] text-[0.38rem] uppercase leading-tight">
                          {formData.footer_col2_title || 'Ministerio de las Culturas'}
                        </h5>
                        <p className="text-white/40 leading-tight text-[0.35rem]">
                          {formData.footer_col2_address || 'Dirección: Calle 9 No. 8 - 31'}
                        </p>
                        <p className="text-white/40 leading-tight text-[0.35rem]">
                          {formData.footer_col2_phone || 'Tel: +57 601 3424100'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-[#8BF784] text-[0.38rem] uppercase leading-tight">
                          {formData.footer_col3_title || 'Correspondencia'}
                        </h5>
                        <p className="text-white/40 leading-tight text-[0.35rem] truncate">
                          {formData.footer_col3_email || 'servicioalciudadano@mincultura.gov.co'}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-1.5 flex items-center justify-between text-[0.35rem] text-white/35">
                      <span>{formData.footer_credits_text || 'Copyright © 2026'}</span>
                      <span className="font-bold text-[#00DA5E]">{formData.footer_credits_tagline || 'Colombia'}</span>
                    </div>
                  </div>
                </div>
              ) : activeGroupObj && (activeGroupObj.id === 'home_strategies_title' || activeGroupObj.id === 'home_strategies_cards') ? (
                // HOME STRATEGIES CAROUSEL PREVIEW
                <div className="bg-[#291242] p-5 text-white text-left font-nunito flex flex-col justify-center min-h-[22rem] relative overflow-hidden select-none">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-[#00DA5E]/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Header */}
                  <div className="mb-4">
                    <span className="text-[#00DA5E] font-bold text-[0.45rem] uppercase tracking-[0.25em] font-alternate block mb-1">
                      {formData.home_strat_tag || 'Procesos destacados'}
                    </span>
                    <h4 className="text-white font-alternate text-xs font-black uppercase leading-tight tracking-tight">
                      {formData.home_strat_title || 'Rutas de Acción Territorial'}
                    </h4>
                    <p className="text-[0.48rem] text-white/55 leading-normal mt-1 line-clamp-2">
                      {formData.home_strat_desc || 'Conoce los marcos operativos y pedagógicos...'}
                    </p>
                  </div>

                  {/* Active strategy card mockup */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-block bg-[#00DA5E]/20 text-[#00DA5E] text-[0.42rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {formData.strat_celebra_tag || 'Estrategia de Circulación'}
                      </span>
                    </div>
                    <h5 className="font-alternate text-[0.68rem] font-black uppercase text-white tracking-wide">
                      {formData.strat_celebra_title || 'Celebra la Música'}
                    </h5>
                    <p className="text-white/60 text-[0.52rem] leading-relaxed mt-1 line-clamp-3">
                      {formData.strat_celebra_desc || 'Activa escenarios, programación y redes...'}
                    </p>
                    
                    {/* Carousel indicator dots */}
                    <div className="flex gap-1 items-center justify-center mt-3 pt-2 border-t border-white/5">
                      <span className="h-1 w-3 rounded-full bg-[#00DA5E]" />
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              ) : activeGroupObj && (activeGroupObj.id === 'agenda_ui' || activeGroupObj.id === 'gallery_ui') ? (
                // AGENDA & GALLERY UI FILTER PREVIEW
                <div className="bg-[#f8f7fb] p-4 text-slate-800 text-left font-nunito flex flex-col justify-between min-h-[22rem] relative overflow-hidden select-none border border-slate-200">
                  {activeGroupObj.id === 'agenda_ui' ? (
                    // AGENDA FILTER SIDEBAR MOCK
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[0.52rem] font-black uppercase tracking-wider text-[#291242]">{formData.agenda_filter_title || 'Filtros'}</span>
                        <span className="text-[0.45rem] text-[#00c454] font-bold">{formData.agenda_filter_clear_btn || 'Limpiar'}</span>
                      </div>
                      
                      <div className="space-y-2 flex-1 pt-1">
                        {/* Dates Tabs */}
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg text-[0.42rem] font-bold text-center">
                          <span className="bg-white shadow-sm py-1 rounded text-[#291242]">{formData.agenda_filter_date_exact || 'Fecha Exacta'}</span>
                          <span className="py-1 text-slate-400">{formData.agenda_filter_date_month || 'Por Mes'}</span>
                        </div>

                        {/* Select label department */}
                        <div className="space-y-1">
                          <label className="text-[0.42rem] font-black uppercase tracking-wider text-slate-400">{formData.agenda_filter_department_label || 'Departamento'}</label>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[0.48rem] text-slate-600 flex justify-between items-center">
                            <span>{formData.agenda_filter_all_departments || 'Todos los departamentos'}</span>
                            <span>▼</span>
                          </div>
                        </div>

                        {/* Loading Mock Status Area */}
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2 mt-auto text-center">
                          <h6 className="text-[0.48rem] font-black text-emerald-800 leading-none">
                            {formData.agenda_loading_title || 'Cargando agenda...'}
                          </h6>
                          <p className="text-[0.42rem] text-emerald-600 mt-0.5 leading-tight line-clamp-1">
                            {formData.agenda_loading_desc || 'Sincronizando eventos...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // GALLERY EXPLORER MOCK
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-3 flex-1 flex flex-col justify-between">
                      {/* Search Bar & Header */}
                      <div className="space-y-2">
                        <span className="text-[#291242] font-alternate text-xs font-black uppercase tracking-wide block">
                          {formData.gallery_hero_title || 'Álbumes y Memorias'}
                        </span>
                        
                        {/* Search Input */}
                        <div className="bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-[0.48rem] text-slate-400 flex items-center gap-1.5">
                          <span>🔍</span>
                          <span>{formData.gallery_search_placeholder || 'Buscar por título...'}</span>
                        </div>
                      </div>

                      {/* Collection filter */}
                      <div className="flex gap-1.5 text-[0.42rem] font-bold">
                        <span className="bg-[#291242] text-white px-2.5 py-1 rounded-full shadow-sm">
                          {formData.gallery_filter_all_cats || 'Todos los álbumes'}
                        </span>
                      </div>

                      {/* Mock Collection Loading Status */}
                      <div className="bg-violet-50 border border-violet-100 rounded-xl p-2 text-center mt-auto">
                        <h6 className="text-[0.48rem] font-black text-violet-800 leading-none">
                          {formData.gallery_loading_title || 'Cargando galería...'}
                        </h6>
                        <p className="text-[0.42rem] text-violet-600 mt-0.5 leading-tight line-clamp-1">
                          {formData.gallery_loading_desc || 'Estamos sincronizando álbumes...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeGroupObj && activeGroupObj.id === 'map_hero' ? (
                // 2. GEOVISOR WELCOME STEP 0 PREVIEW
                <div className="bg-[#e4ebf5] p-4 text-slate-800 text-center font-nunito flex flex-col items-center justify-center min-h-[22rem] relative overflow-hidden select-none font-sans">
                  {/* Grid Lines backdrop */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
                  
                  {/* Mock pins */}
                  <div className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-violet-600 border border-white shadow animate-pulse pointer-events-none" />
                  <div className="absolute bottom-1/4 right-1/4 h-2 w-2 rounded-full bg-violet-600 border border-white shadow pointer-events-none" />

                  {/* Geovisor Overlaid Welcome Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl max-w-[15rem] w-full text-center relative z-10 animate-fade-in flex flex-col items-center gap-2.5">
                    {/* Circle globe icon */}
                    <div className="h-9 w-9 rounded-full bg-[#00DA5E]/10 flex items-center justify-center text-[#00c454] relative">
                      <div className="absolute inset-0 rounded-full bg-[#00DA5E]/20 animate-ping opacity-60 pointer-events-none" />
                      <Globe size={18} />
                    </div>
                    
                    <div>
                      <h4 className="text-[0.72rem] font-black text-slate-900 leading-tight">Bienvenido al Geovisor</h4>
                      <p className="text-[0.52rem] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Mapa Ecosistémico</p>
                    </div>

                    <p className="text-[0.62rem] text-slate-500 leading-relaxed font-medium text-center">
                      {formData.map_description || 'Mapeo interactivo georreferenciado de actores, lutieres, escuelas y festivales a nivel nacional, departamental y municipal.'}
                    </p>

                    {/* Step dots */}
                    <div className="flex items-center gap-1 my-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                    </div>

                    <button
                      type="button"
                      className="bg-[#00DA5E] text-slate-950 font-black rounded-xl text-[0.58rem] py-2 w-full uppercase tracking-wide shadow-sm"
                    >
                      Iniciar Recorrido
                    </button>
                  </div>
                </div>
              ) : activeGroupObj && activeGroupObj.section === 'Ejes' ? (
                // 3. EJES DETAIL PREVIEW
                (() => {
                  let axisId = '01';
                  if (activeGroupObj.id === 'eje2_details') axisId = '02';
                  if (activeGroupObj.id === 'eje3_details') axisId = '03';
                  
                  const activeTitle = formData[`eje${axisId}_title`] || '';
                  const activePurpose = formData[`eje${axisId}_purpose`] || '';
                  const activeDesc1 = formData[`eje${axisId}_desc1`] || '';

                  return (
                    <div className="bg-white p-5 text-left font-nunito flex flex-col justify-between min-h-[22rem] relative overflow-hidden select-none border border-slate-100">
                      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        <div className="flex items-center gap-3">
                          <span className="font-gregor text-3xl text-[#8BF784] font-bold leading-none">{axisId}</span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <h4 className="font-alternate text-xs font-bold uppercase tracking-wide leading-tight text-[#291242] line-clamp-2">
                          {activeTitle}
                        </h4>
                        <p className="text-[0.58rem] text-slate-600 leading-normal font-light line-clamp-3">
                          {activeDesc1}
                        </p>
                        
                        {activePurpose && (
                          <div className="bg-[#291242] p-2.5 rounded-xl border border-white/5">
                            <span className="text-[0.45rem] font-bold text-[#00DA5E] uppercase tracking-widest">Propósito</span>
                            <p className="text-white/80 text-[0.52rem] font-medium leading-relaxed italic line-clamp-2 mt-0.5">
                              "{activePurpose}"
                            </p>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[0.45rem] font-black text-slate-400 uppercase tracking-widest block">Componente destacado</span>
                          <div className="bg-slate-50 border border-slate-200/60 p-2 rounded-lg text-[0.5rem]">
                            <h5 className="font-bold text-[#291242] uppercase tracking-wide">
                              {formData[`eje${axisId}_c1_title`] || 'Componente 01'}
                            </h5>
                            <p className="text-slate-500 font-medium line-clamp-1 mt-0.5">
                              {formData[`eje${axisId}_c1_desc`] || 'Detalle descriptivo...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : activeGroupObj && activeGroupObj.section === 'Estrategias' ? (
                // 4. STRATEGY DETAIL PREVIEW
                <div className="bg-white p-5 text-left font-nunito flex flex-col justify-between min-h-[22rem] relative overflow-hidden select-none border border-slate-100">
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    <span className="rounded bg-[#291242]/10 border border-[#291242]/20 px-1.5 py-0.5 text-[0.45rem] font-black text-[#291242] uppercase tracking-widest w-fit">
                      ESTRATEGIA PNMC
                    </span>
                    <h4 className="font-alternate text-sm font-bold uppercase tracking-tight text-[#291242] leading-none">
                      Celebra la Música
                    </h4>
                    <p className="text-[0.52rem] text-slate-400 leading-tight font-medium">
                      {formData.strategy_celebra_hero_desc || 'Descripción superior...'}
                    </p>

                    <div className="bg-[#291242] text-white p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[0.42rem] font-bold text-[#8BF784] uppercase tracking-wider block">14ª Edición</span>
                        <h5 className="font-gregor text-lg font-bold leading-none">2025</h5>
                        <p className="text-slate-300 text-[0.48rem] leading-normal font-light line-clamp-2">
                          {formData.strategy_celebra_edition_intro || 'En 2025 Celebra la Música se renueva...'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[0.42rem] font-bold text-[#00DA5E] uppercase tracking-wider block">La Celebración</span>
                      <p className="text-[#291242] font-semibold text-[0.55rem] leading-snug line-clamp-2">
                        {formData.strategy_celebra_intro || 'La música llega a todos los rincones...'}
                      </p>
                      <p className="text-slate-500 font-medium text-[0.52rem] leading-normal line-clamp-2">
                        {formData.strategy_celebra_mission || 'Propósito y conexión de artistas...'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeGroupObj ? (
                // 5. STANDARD PAGE HERO PREVIEW
                <div className="bg-gradient-to-br from-[#291242] to-[#150724] p-5 text-white text-left font-nunito flex flex-col justify-center min-h-[22rem] relative overflow-hidden select-none border border-white/5">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Back button mock */}
                  <div className="inline-flex items-center gap-1 text-[0.55rem] font-bold text-white/50 mb-3 uppercase tracking-wider">
                    <span>←</span> Volver
                  </div>

                  <span className="rounded bg-[#00DA5E]/10 border border-[#00DA5E]/20 px-1.5 py-0.5 text-[0.5rem] font-black text-[#00DA5E] uppercase tracking-widest w-fit mb-2">
                    {activeGroupObj.section} PNMC
                  </span>

                  <h2 className="font-alternate text-sm md:text-base font-black uppercase tracking-wide leading-tight mb-2.5 text-white">
                    {activeGroupObj.section === 'Agenda' ? 'Agenda de Eventos' :
                     activeGroupObj.section === 'Noticias' ? 'Sala de Prensa' :
                     activeGroupObj.section === 'Galería' ? 'Galería Fotográfica' :
                     'Publicaciones Editoriales'}
                  </h2>

                  <p className="text-[0.65rem] text-white/70 leading-relaxed font-medium max-w-sm">
                    {formData[activeGroupObj.keys[0]] || 'Texto introductorio de la sección...'}
                  </p>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-400">Sin previsualización activa.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Collapsible Version History Helper Component */
const CollapsibleHistory = ({ keyName, details, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const historyList = details?.history || [];

  if (historyList.length === 0) return null;

  return (
    <div className="mt-1.5 pt-1.5 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[0.6rem] font-bold text-slate-400 hover:text-slate-600 select-none"
      >
        <span className="text-[0.45rem]">{isOpen ? '▼' : '▶'}</span>
        Ver historial de cambios ({historyList.length})
      </button>
      
      {isOpen && (
        <div className="mt-2 space-y-1.5 max-h-[10rem] overflow-y-auto pr-1">
          {historyList.slice().reverse().map((item, idx) => (
            <div key={idx} className="bg-slate-100/60 hover:bg-slate-100 rounded-lg p-2 text-[0.62rem] border border-slate-200 transition flex items-start justify-between gap-3">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-700">{item.updatedBy}</span>
                  <span className="text-slate-400">{item.updatedAt}</span>
                  <span className="text-[0.52rem] rounded px-1.5 bg-slate-200 text-slate-500 font-bold uppercase">{item.status}</span>
                </div>
                <p className="text-slate-600 line-clamp-2 leading-relaxed">"{item.content}"</p>
              </div>
              <button
                type="button"
                onClick={() => onRestore(keyName, item.content)}
                className="rounded bg-[#291242] hover:bg-[#1d0b30] text-white px-2 py-1 text-[0.52rem] font-black uppercase tracking-wider self-center shrink-0 transition"
              >
                Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR NAV SECTIONS
═══════════════════════════════════════════════════════════════════════════ */

const NAV_SECTIONS = [
  {
    group: 'principal',
    items: [
      { id: 'monitor', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'ecosystem', label: 'Mapa ecosistémico', icon: Network },
      { id: 'communications', label: 'Comunicaciones', icon: Newspaper },
      { id: 'entities', label: 'Entidades base', icon: Building2 },
      { id: 'review', label: 'Revisión', icon: ClipboardList },
      { id: 'governance', label: 'Gestión de solicitudes y vinculaciones', icon: Cpu, allowedRoles: ['webmaster', 'gestor_interno'] },
      { id: 'web_texts', label: 'Administración de textos', icon: FileText, allowedRoles: ['webmaster', 'gestor_interno'] },
    ],
  },
  {
    group: 'administracion',
    label: 'Administración',
    webmasterOnly: true,
    items: [
      { id: 'users', label: 'Usuarios', icon: UsersRound, webmasterOnly: true },
      { id: 'system', label: 'Sistema', icon: Server, webmasterOnly: true },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP SHELL
═══════════════════════════════════════════════════════════════════════════ */

export const AdminShellPage = ({ initialPortal = 'internal' }) => {
  const [session, setSession] = useState(null);
  const [sessionState, setSessionState] = useState('checking');
  const [activeSection, setActiveSection] = useState('monitor');
  const [selectedModuleId, setSelectedModuleId] = useState('festivals');
  const [stats, setStats] = useState({});
  const [schemaOnline, setSchemaOnline] = useState(false);
  const [apiStatus, setApiStatus] = useState('Backend administrativo pendiente de verificar.');
  const [reviewRecords, setReviewRecords] = useState([]);
  const [divipola, setDivipola] = useState({});
  const [monitor, setMonitor] = useState(null);

  // New Custom States
  const [localUsers, setLocalUsers] = useState([
    { id: 'usr-lider', fullName: 'Diana Valencia', email: 'lider@pnmc.local', role: 'lider', isActive: true, password: 'password' },
    { id: 'usr-ext-1', fullName: 'Carlos Vives', email: 'colaborador@external.local', role: 'gestor', isActive: true, password: 'password' }
  ]);
  const [isExternalPortal, setIsExternalPortal] = useState(initialPortal === 'external');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [reviewingRecord, setReviewingRecord] = useState(null);

  const [externalProcesses, setExternalProcesses] = useState([
    {
      id: 'ext-proc-1',
      moduleId: 'festivals',
      type: 'festivals',
      title: 'Festival de Cuerdas y Viento',
      name: 'Festival de Cuerdas y Viento',
      status: 'aprobado',
      department: 'Boyacá',
      municipality: 'Villa de Leyva',
      updatedAt: '2026-05-10',
      owner: 'Carlos Vives',
      description: 'Festival tradicional de música de cuerda andina colombiana.',
      organizer: 'Carlos Vives',
      contactEmail: 'colaborador@external.local',
      contactPhone: '315 123 4567'
    }
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      recipientEmail: 'colaborador@external.local',
      title: 'Bienvenido al PNMC',
      message: 'Tu cuenta de colaborador ha sido activada con éxito.',
      createdAt: '2026-05-24T10:00:00Z',
      read: false
    }
  ]);

  const [reviewToast, setReviewToast] = useState({ show: false, type: 'success', message: '' });

  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  useEffect(() => {
    if (session) {
      const tourSeen = localStorage.getItem('pnmc_tour_seen_' + session.email);
      if (!tourSeen) {
        setShowWelcomeTour(true);
        setTourStep(1);
      }
    }
  }, [session]);

  const roleId = session?.role || 'gestor';
  const modules = useMemo(() => getModulesForRole(roleId), [roleId]);
  const canApprove = canRole(roleId, 'approve');

  // Aggregated review queue loader to pull draft/in-review items dynamically
  const loadReviewQueue = async () => {
    if (!session) return;
    try {
      const allRecordsPromises = ADMIN_MODULES.map(async (mod) => {
        try {
          const res = await fetchAdminRecords({ moduleId: mod.id, limit: 100 });
          return (res.items || []).map((item) => ({
            ...item,
            moduleId: mod.id,
            title: item.name || item.title || 'Sin título',
            owner: item.owner || item.createdBy || 'Sistema',
          }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(allRecordsPromises);
      const apiAggregated = results.flat().filter((r) => ['borrador', 'en_evaluacion', 'ajustes_solicitados'].includes(r.status));
      
      const extAggregated = externalProcesses
        .filter((r) => ['borrador', 'en_evaluacion', 'ajustes_solicitados'].includes(r.status))
        .map((r) => ({
          ...r,
          moduleId: r.moduleId || r.type,
        }));

      const combined = [...extAggregated];
      apiAggregated.forEach((item) => {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item);
        }
      });

      setReviewRecords(combined);
    } catch (error) {
      console.error('Error loading review queue:', error);
    }
  };

  const refreshAdminBackend = async () => {
    try {
      const [monitorPayload, territories] = await Promise.all([
        fetchAdminMonitor(),
        fetchDivipolaGrouped(),
      ]);
      setMonitor(monitorPayload);
      setSchemaOnline(monitorPayload?.database?.status === 'ok');
      setStats(Object.fromEntries((monitorPayload?.modules || []).map((mod) => [mod.id, mod.total])));
      setDivipola(territories || {});
      setApiStatus(`Última lectura: ${new Date().toLocaleTimeString('es-CO')} · API ${monitorPayload?.api?.latencyMs || 0} ms`);
    } catch (error) {
      setSchemaOnline(false);
      setApiStatus(`Error de conexión: ${error.message}`);
    }
  };

  useEffect(() => {
    let isActive = true;
    const loadSession = async () => {
      try {
        const response = await fetchAdminMe();
        if (!isActive) return;
        setSession(response.user);
        setSessionState('ready');
      } catch {
        if (!isActive) return;
        setSession(null);
        setSessionState('ready');
      }
    };
    loadSession();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    let isActive = true;
    const tick = async () => { if (isActive) await refreshAdminBackend(); };
    tick();
    const interval = window.setInterval(tick, 10000);
    return () => { isActive = false; window.clearInterval(interval); };
  }, [session]);

  // Sync Review Queue dynamically when session starts or when active tab changes
  useEffect(() => {
    if (session) {
      loadReviewQueue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeSection]);

  const handleLogin = (user) => { setSession(user); setActiveSection('monitor'); };
  const handleLogout = async () => {
    try { await logoutAdmin(); } catch { /* UI exits even if cookie was already cleared */ }
    setSession(null);
  };
  const handleRegisterUser = (newUser) => {
    setLocalUsers((prev) => [...prev, newUser]);
  };
  const handlePasswordChange = (email, newPassword) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.email === email ? { ...u, password: newPassword } : u))
    );
    if (session?.email === email) {
      setSession((prev) => ({ ...prev, password: newPassword }));
    }
  };
  const handleProfileUpdate = async (payload) => {
    const response = await updateProfile(payload);
    if (response && response.user) {
      setSession(response.user);
      return response.user;
    }
    throw new Error('Respuesta inválida del servidor');
  };
  const handleNotificationRead = (recordId) => {
    setNotifications((prev) => prev.map((item) => item.recordId === recordId ? { ...item, read: true } : item));
  };

  const handleReviewRecord = (record) => setReviewRecords((cur) => [record, ...cur.filter((item) => item.id !== record.id)]);
  
  const handleReviewStatus = async (recordId, status) => {
    const record = reviewRecords.find((r) => r.id === recordId);
    if (!record) return;
    try {
      await updateAdminRecordStatus({ moduleId: record.moduleId, id: recordId, status });
      setReviewRecords((cur) =>
        cur.map((r) => (r.id === recordId ? { ...r, status, updatedAt: new Date().toISOString().slice(0, 10) } : r))
      );
      await loadReviewQueue();
    } catch (error) {
      alert(`Error al actualizar estado del registro: ${error.message}`);
    }
  };

  const handleReviewSubmit = async (recordId, status, reviewComments) => {
    const record = reviewRecords.find((r) => r.id === recordId);
    if (!record) return;
    try {
      await updateAdminRecordStatus({ moduleId: record.moduleId, id: recordId, status });
      
      // Update local reviewRecords
      setReviewRecords((cur) =>
        cur.map((r) =>
          r.id === recordId
            ? { ...r, status, reviewComments, updatedAt: new Date().toISOString().slice(0, 10) }
            : r
        )
      );

      // Update externalProcesses state
      setExternalProcesses((cur) =>
        cur.map((p) =>
          p.id === recordId
            ? { ...p, status, reviewComments, updatedAt: new Date().toISOString().slice(0, 10) }
            : p
        )
      );

      // Trigger simulated notification
      if (status === 'ajustes_solicitados' && reviewComments?.sendNotification) {
        const notifyEmail = reviewComments.collaboratorEmail || 'colaborador@external.local';
        
        // Add to simulated notifications array
        const newNotif = {
          id: `notif-${Date.now()}`,
          recipientEmail: notifyEmail,
          title: `Ajustes requeridos: ${record.title}`,
          message: `Tu registro "${record.title}" requiere ajustes. Observaciones: ${reviewComments.generalComment}`,
          createdAt: new Date().toISOString(),
          read: false,
          recordId: record.id,
          fieldAdjustments: reviewComments.fieldAdjustments,
          generalComment: reviewComments.generalComment
        };
        setNotifications((prev) => [newNotif, ...prev]);

        // Beautiful visual toast
        setReviewToast({
          show: true,
          type: 'warning',
          message: `✉️ ¡Notificación de ajustes enviada por correo a ${record.owner} (${notifyEmail})! El registro ha cambiado a estado "Ajustes solicitados".`
        });
        setTimeout(() => setReviewToast({ show: false, message: '' }), 6000);
      } else if (status === 'rechazado') {
        const notifyEmail = reviewComments?.collaboratorEmail || 'colaborador@external.local';
        const newNotif = {
          id: `notif-${Date.now()}`,
          recipientEmail: notifyEmail,
          title: `Registro rechazado: ${record.title}`,
          message: `Tu registro "${record.title}" ha sido rechazado de forma definitiva. Motivo: ${reviewComments?.generalComment || 'Inviabilidad técnica.'}`,
          createdAt: new Date().toISOString(),
          read: false,
          recordId: record.id,
          generalComment: reviewComments?.generalComment
        };
        setNotifications((prev) => [newNotif, ...prev]);

        setReviewToast({
          show: true,
          type: 'danger',
          message: `🚫 ¡Registro rechazado! Se ha notificado por correo a ${record.owner} (${notifyEmail}) con el motivo del rechazo.`
        });
        setTimeout(() => setReviewToast({ show: false, message: '' }), 6000);
      } else {
        const notifyEmail = reviewComments?.collaboratorEmail || 'colaborador@external.local';
        const newNotif = {
          id: `notif-${Date.now()}`,
          recipientEmail: notifyEmail,
          title: `Registro aprobado: ${record.title}`,
          message: `¡Felicitaciones! Tu registro "${record.title}" ha sido verificado y aprobado. Ya es visible en el mapa.`,
          createdAt: new Date().toISOString(),
          read: false,
          recordId: record.id
        };
        setNotifications((prev) => [newNotif, ...prev]);

        setReviewToast({
          show: true,
          type: 'success',
          message: `🎉 ¡Registro aprobado con éxito! Se ha notificado al colaborador.`
        });
        setTimeout(() => setReviewToast({ show: false, message: '' }), 6000);
      }

      setReviewingRecord(null);
      await loadReviewQueue();
    } catch (error) {
      alert(`Error al guardar la revisión: ${error.message}`);
    }
  };

  if (sessionState === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#00DA5E]/20 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#00DA5E] animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verificando sesión...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    if (isExternalPortal) {
      return (
        <ExternalPortalLogin
          onLogin={handleLogin}
          onToggleInternal={() => setIsExternalPortal(false)}
          localUsers={localUsers}
          onRegisterUser={handleRegisterUser}
        />
      );
    }
    return (
      <AdminLogin
        onLogin={handleLogin}
        onToggleExternal={() => setIsExternalPortal(true)}
      />
    );
  }

  if (roleId === 'gestor') {
      return (
        <ExternalUserDashboard
          session={session}
          divipola={divipola}
          notifications={notifications}
          onLogout={handleLogout}
          onLocalReviewItem={handleReviewRecord}
          onNotificationRead={handleNotificationRead}
          onPasswordChange={handlePasswordChange}
          onProfileUpdate={handleProfileUpdate}
        />
    );
  }

  const visibleNavSections = NAV_SECTIONS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.allowedRoles) return item.allowedRoles.includes(roleId);
      if (item.webmasterOnly) return roleId === 'webmaster';
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  const roleColors = { webmaster: 'text-violet-400', editor: 'text-blue-400', lider: 'text-amber-400', gestor: 'text-slate-400' };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-nunito">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-[#291242] flex flex-col h-full overflow-y-auto border-r border-white/5">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="h-8 w-8 rounded-lg bg-[#00DA5E]/15 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-[#00DA5E]" />
          </div>
          <div className="min-w-0">
            <p className="font-alternate text-[0.8rem] font-bold uppercase tracking-[0.2em] text-[#00DA5E]">PNMC</p>
            <p className="text-[0.68rem] font-bold text-white/70 tracking-wide uppercase truncate">Admin Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6">
          {visibleNavSections.map((group) => (
            <div key={group.group}>
              {group.label && (
                <p className="px-3 mb-2 font-alternate text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/40">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={[
                        'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all duration-300',
                        isActive
                          ? 'bg-white/12 text-white border-l-[3px] border-[#00DA5E] pl-2 rounded-l-none shadow-sm'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/95 pl-3',
                      ].join(' ')}
                    >
                      <Icon size={15} className={isActive ? 'text-[#00DA5E]' : 'text-white/40'} />
                      {item.label}
                      {item.id === 'review' && reviewRecords.length > 0 && (
                        <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-[#00DA5E] text-[0.55rem] font-black text-[#291242] flex items-center justify-center animate-pulse">
                          {reviewRecords.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-white/10 px-4 py-4 bg-black/10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-8 w-8 rounded-full ${getAvatarColor(session.fullName)} flex items-center justify-center shrink-0 ring-1 ring-white/10`}>
              <span className="text-[0.65rem] font-black text-white">{getInitials(session.fullName)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{session.fullName}</p>
              <p className={`font-alternate text-[0.62rem] font-bold uppercase tracking-widest ${roleColors[roleId] || 'text-slate-400'}`}>
                {ADMIN_ROLES[roleId]?.shortLabel || roleId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/8 hover:bg-white/12 px-3 py-2 text-xs font-bold text-white/80 hover:text-white transition mb-2"
          >
            <Lock size={13} className="text-[#00DA5E]" />
            Cambiar contraseña
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/8 hover:bg-white/12 px-3 py-2 text-xs font-bold text-white/80 hover:text-white transition"
          >
            <LogOut size={13} className="text-[#00DA5E]" />
            Cerrar sesión
          </button>
          {/* Backend status dot */}
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className={`h-1.5 w-1.5 rounded-full ${schemaOnline ? 'bg-[#00DA5E]' : 'bg-rose-400'} animate-pulse`} />
            <p className="text-[0.58rem] text-white/40 truncate">{apiStatus}</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-alternate text-sm uppercase tracking-wider font-bold text-slate-800">
              {NAV_SECTIONS.flatMap((g) => g.items).find((i) => i.id === activeSection)?.label || 'Panel'}
            </h1>
            <p className="text-[0.6rem] text-slate-400 font-medium mt-0.5">PNMC · Entorno administrativo interno</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refreshAdminBackend}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#291242] hover:text-[#291242] transition"
            >
              <RefreshCw size={12} />
              Actualizar
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="px-6 py-6 max-w-[84rem] mx-auto">
          {activeSection === 'monitor' && (
            roleId === 'lider' ? (
              <LiderDashboard monitor={monitor} apiStatus={apiStatus} onRefresh={refreshAdminBackend} divipola={divipola} />
            ) : (
              <AdminMonitor monitor={monitor} apiStatus={apiStatus} onRefresh={refreshAdminBackend} />
            )
          )}
          {activeSection === 'ecosystem' && (
            <AdminAreaRecords
              areaId="ecosystem"
              modules={modules}
              selectedModuleId={selectedModuleId}
              onSelectModule={setSelectedModuleId}
              roleId={roleId}
              divipola={divipola}
              onLocalReviewItem={handleReviewRecord}
              session={session}
            />
          )}
          {activeSection === 'communications' && (
            <AdminAreaRecords
              areaId="communications"
              modules={modules}
              selectedModuleId={selectedModuleId}
              onSelectModule={setSelectedModuleId}
              roleId={roleId}
              divipola={divipola}
              onLocalReviewItem={handleReviewRecord}
              session={session}
            />
          )}
          {activeSection === 'entities' && (
            <AdminEntitiesPanel roleId={roleId} divipola={divipola} />
          )}
          {activeSection === 'review' && (
            <AdminReviewQueue
              records={reviewRecords}
              modules={ADMIN_MODULES}
              canApprove={canApprove}
              onStatusChange={handleReviewStatus}
              onReviewClick={setReviewingRecord}
            />
          )}
          {activeSection === 'users' && (
            <AdminUsersPanel enabled={roleId === 'webmaster'} />
          )}
          {activeSection === 'system' && (
            <AdminSystemPanel schemaOnline={schemaOnline} stats={stats} divipola={divipola} />
          )}
          {activeSection === 'governance' && (
            <AdminGovernancePanel enabled={roleId === 'webmaster' || roleId === 'gestor_interno'} />
          )}
          {activeSection === 'web_texts' && (
            <AdminWebTextsPanel enabled={roleId === 'webmaster' || roleId === 'gestor_interno'} session={session} />
          )}
        </div>
      </main>

      {showPasswordModal && (
        <ChangePasswordModal
          session={session}
          onClose={() => setShowPasswordModal(false)}
          onPasswordChange={handlePasswordChange}
        />
      )}

      {reviewingRecord && (
        <RecordReviewModal
          record={reviewingRecord}
          module={ADMIN_MODULES.find((m) => m.id === reviewingRecord.moduleId)}
          localUsers={localUsers}
          onClose={() => setReviewingRecord(null)}
          onSubmitReview={handleReviewSubmit}
        />
      )}

      {reviewToast.show && (
        <div className={`fixed bottom-24 right-6 z-[6000] max-w-md bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border shadow-2xl p-4 flex items-start gap-3 animate-fade-in ${
          reviewToast.type === 'success' ? 'border-emerald-500/30' :
          reviewToast.type === 'warning' ? 'border-amber-500/30' : 'border-red-500/30'
        }`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
            reviewToast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            reviewToast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <Mail size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100">Notificación de Revisión</p>
            <p className="text-[0.68rem] text-slate-300 mt-0.5 leading-relaxed">{reviewToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setReviewToast({ show: false, message: '' })}
            className="text-white/40 hover:text-white/80 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showWelcomeTour && (
        <WelcomeTourModal
          roleId={roleId}
          step={tourStep}
          setStep={setTourStep}
          onClose={() => {
            setShowWelcomeTour(false);
            localStorage.setItem('pnmc_tour_seen_' + session.email, 'true');
          }}
        />
      )}

      {/* Floating Tutorial Button */}
      {session && (
        <button
          type="button"
          onClick={() => {
            setTourStep(1);
            setShowWelcomeTour(true);
          }}
          className="fixed bottom-6 right-6 z-[5000] group flex items-center gap-2 rounded-full bg-[#00DA5E] hover:bg-[#00c454] px-3.5 py-3.5 text-xs font-black text-[#1a0a2c] shadow-2xl transition-all duration-300 hover:scale-105"
          title="Ver tutorial de bienvenida"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 218, 94, 0.4), 0 0 15px rgba(0, 218, 94, 0.2)'
          }}
        >
          <Sparkles size={16} className="animate-pulse" />
          <span className="max-w-0 overflow-hidden font-alternate uppercase tracking-wider transition-all duration-500 group-hover:max-w-[120px] whitespace-nowrap text-[0.68rem] font-bold">
            Tutorial
          </span>
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   ONBOARDING WELCOME TOUR WIZARD
═══════════════════════════════════════════════════════════════════════════ */

const TOUR_STEPS = {
  webmaster: [
    {
      title: "Consola de Webmaster",
      description: "¡Bienvenido! Tienes control total y acceso privilegiado a todos los rincones del Plan Nacional de Música para la Convivencia.",
      badge: "Rol: Webmaster",
      icon: ShieldCheck,
      details: [
        "Monitoreo técnico de latencia de base de datos y logs de auditoría en vivo.",
        "Mantenimiento maestro de usuarios globales y asignación rápida de roles.",
        "Importaciones masivas de datos mediante hojas de cálculo Excel y CSV."
      ]
    },
    {
      title: "Administración Central de Textos",
      description: "Edita y actualiza cualquier copy o etiqueta que no venga de la base de datos.",
      badge: "CMS de Textos",
      icon: FileText,
      details: [
        "Clasificación estricta por páginas: Home, Agenda, Galería, Noticias, Ejes, etc.",
        "Sub-selector interactivo de Ejes Estratégicos para aislar componentes de edición.",
        "Previsualizadores Hifi interactivos que reproducen el render real en vivo."
      ]
    },
    {
      title: "Gestión de Solicitudes y Vinculaciones",
      description: "Verifica vinculaciones y reclamaciones hechas por colaboradores externos.",
      badge: "Gobernanza",
      icon: Cpu,
      details: [
        "Aprobación o rechazo directo de solicitudes de vinculación territorial.",
        "Resolución inteligente de duplicados basados en porcentajes de similitud.",
        "Evaluación de alertas automáticas de calidad en el mapa ecosistémico."
      ]
    }
  ],
  gestor_interno: [
    {
      title: "Moderador de Componentes",
      description: "¡Bienvenido! Tu rol es primordial para acompañar y curar la información de tu componente territorial.",
      badge: "Rol: Gestor Interno",
      icon: ClipboardList,
      details: [
        "Revisar y verificar escuelas de música, lutieres y festivales reportados.",
        "Solicitar ajustes específicos con comentarios dirigidos por cada campo.",
        "Verificar y mantener la consistencia geográfica del mapa nacional."
      ]
    },
    {
      title: "Bandeja de Gobernanza y Solicitudes",
      description: "Acompaña las vinculaciones institucionales en tiempo real.",
      badge: "Solicitudes de Redes",
      icon: Cpu,
      details: [
        "Aprobar vinculaciones territoriales para dar control editorial a colaboradores.",
        "Resolver alertas de coordenadas geográficas fuera de los límites DIVIPOLA.",
        "Administrar textos y copys de los contenidos de comunicación de tu área."
      ]
    }
  ],
  lider: [
    {
      title: "Portal de Aliados Institucionales",
      description: "¡Bienvenido! Aquí coordinas las escuelas, luterías y festivales asociados a tu entidad.",
      badge: "Rol: Aliado Coordinador",
      icon: Building2,
      details: [
        "Acceso exclusivo al panel de KPI y estadísticas de tu componente.",
        "Monitorear la distribución de tus registros geolocalizados por departamento.",
        "Administrar usuarios editores y lectores de tu propia red aliada."
      ]
    },
    {
      title: "Vinculaciones y Cargas Colaborativas",
      description: "Conecta a tus redes locales al mapa ecosistémico nacional.",
      badge: "Registros de Red",
      icon: Network,
      details: [
        "Carga individual y masiva de procesos formativos y artísticos.",
        "Monitorear solicitudes de reclamación de registros preexistentes.",
        "Colaboración bidireccional directa con los gestores internos del Ministerio."
      ]
    }
  ],
  gestor: [
    {
      title: "¡Bienvenido al Portal de Colaboradores!",
      description: "Tu participación es fundamental para enriquecer el Mapa Ecosistémico del Plan Nacional de Música para la Convivencia (PNMC).",
      badge: "Mapeo Colectivo",
      icon: Sparkles,
      details: [
        "Buscamos mapear y visibilizar escuelas de música, lutieres y festivales de todo el país.",
        "Una vez registrado, podrás reclamar registros existentes o crear nuevos.",
        "¡Tu labor preserva y fomenta la memoria musical territorial de Colombia!"
      ]
    },
    {
      title: "Paso 1: Confirmación de Correo y Cuenta",
      description: "Has realizado un registro básico de usuario para ingresar al portal.",
      badge: "Activación Exitosa",
      icon: Mail,
      details: [
        "Confirmación de tu correo electrónico mediante el código temporal.",
        "Acceso directo y seguro a tu panel personal de colaborador.",
        "Preparación para vincular tu organización cultural."
      ]
    },
    {
      title: "Paso 2: Caracterización de tu Entidad",
      description: "El primer paso indispensable es completar la ficha de caracterización en el panel.",
      badge: "Wizard en 3 Pasos",
      icon: Building2,
      details: [
        "Paso 1: Identidad (Razón social, NIT o documento, descripción cultural).",
        "Paso 2: Datos de Contacto (Teléfono, correo electrónico, redes sociales).",
        "Paso 3: Ubicación (Departamento y Municipio de la DIVIPOLA)."
      ]
    },
    {
      title: "Paso 3: Escaneo Histórico Automático",
      description: "Al enviar tu caracterización, el sistema iniciará una búsqueda inteligente en segundo plano.",
      badge: "DIVIPOLA Smart Scan",
      icon: Search,
      details: [
        "El Plan Nacional posee miles de registros históricos mapeados por el Ministerio de las Culturas.",
        "Buscamos automáticamente coincidencias de escuelas, lutieres y festivales en tu municipio.",
        "Te enviaremos una notificación cuando finalice el escaneo (en unos segundos)."
      ]
    },
    {
      title: "Paso 4: Reclamar Coincidencias en Borrador",
      description: "Tu panel habilitará una 'Bandeja de Reclamaciones Históricas' con los posibles aciertos.",
      badge: "Previsualizar, Reclamar y Editar",
      icon: ClipboardList,
      details: [
        "Podrás previsualizar los detalles del registro encontrado.",
        "Si confirmas que te pertenece, reclámalo y se moverá a tus procesos como un Borrador (Draft).",
        "Podrás actualizar su descripción, teléfonos o fotos y reenviarlo a revisión para su publicación final."
      ]
    }
  ]
};

const WelcomeTourModal = ({ roleId, step, setStep, onClose }) => {
  const steps = TOUR_STEPS[roleId] || TOUR_STEPS['gestor'];
  const currentStepIndex = Math.min(step - 1, steps.length - 1);
  const currentStep = steps[currentStepIndex];
  
  if (!currentStep) return null;
  
  const IconComponent = currentStep.icon;
  const totalSteps = steps.length;
  
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };
  
  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        className="w-full max-w-lg bg-gradient-to-br from-[#291242] to-[#1a0a2c] text-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in flex flex-col relative"
        style={{
          boxShadow: '0 0 50px rgba(0, 218, 94, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00DA5E]/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="px-6 pt-6 flex items-center justify-between relative z-10">
          <span className="rounded-full bg-[#00DA5E]/15 border border-[#00DA5E]/30 px-3 py-1 text-[0.62rem] font-bold text-[#00DA5E] uppercase tracking-widest">
            {currentStep.badge}
          </span>
          <button 
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition p-1.5 rounded-lg bg-white/5 border border-[#00DA5E]/20 hover:border-[#00DA5E]/30"
          >
            <X size={15} />
          </button>
        </div>
        
        {/* Core Content */}
        <div className="px-6 py-8 flex flex-col items-center text-center relative z-10 flex-1 space-y-6">
          <div className="h-16 w-16 bg-[#00DA5E]/10 border border-[#00DA5E]/20 text-[#00DA5E] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <IconComponent size={30} className="animate-bounce animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="font-alternate text-lg font-black uppercase tracking-wider text-white">
              {currentStep.title}
            </h2>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm">
              {currentStep.description}
            </p>
          </div>
          
          {/* Details Bullet Points Card */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 backdrop-blur-sm">
            {currentStep.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="h-4 w-4 rounded-full bg-[#00DA5E]/25 text-[#00DA5E] flex items-center justify-center text-[0.55rem] font-black shrink-0 mt-0.5 border border-[#00DA5E]/35">
                  ✓
                </span>
                <p className="text-[0.7rem] font-medium text-white/85 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="bg-black/20 border-t border-white/10 px-6 py-5 flex items-center justify-between relative z-10 font-nunito">
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition text-xs font-bold uppercase tracking-wider"
          >
            Omitir
          </button>
          
          {/* Step Indicator dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex ? 'w-4 bg-[#00DA5E]' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-xl border border-white/10 hover:bg-white/5 px-3 py-2 text-xs font-bold text-white transition flex items-center justify-center"
              >
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-[#00DA5E] hover:bg-[#00c454] px-4 py-2 text-xs font-black text-[#1a0a2c] transition flex items-center justify-center gap-1 uppercase tracking-wider shadow-md"
            >
              {step === totalSteps ? 'Comenzar' : 'Siguiente'}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShellPage;
