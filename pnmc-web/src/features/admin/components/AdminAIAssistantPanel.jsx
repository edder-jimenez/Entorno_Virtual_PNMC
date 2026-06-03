import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import {
  Sparkles,
  Upload,
  Download,
  Check,
  AlertCircle,
  ArrowRight,
  Bot,
  User,
  FileSpreadsheet,
  Info,
  Settings,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Send
} from 'lucide-react';
import { ADMIN_MODULES } from '../domain/adminConfig.js';

// Pre-defined header synonyms for advanced mapping matching
const SYNONYMS = {
  name: ['nombre', 'name', 'titulo', 'título', 'entidad', 'razon', 'razón', 'denominacion', 'denominación', 'nombre del festival', 'nombre de la escuela', 'nombre del mercado', 'escuela', 'festival', 'mercado'],
  versionsCount: ['versiones', 'ediciones', 'numero de versiones', 'numero de ediciones', 'cantidad versiones', 'cantidad ediciones', 'no versiones', 'no ediciones'],
  lastEditionDate: ['ultimo', 'último', 'ultima edicion', 'última edición', 'fecha ultima', 'fecha última', 'ultima fecha', 'fecha edicion'],
  description: ['descripcion', 'descripción', 'resumen', 'detalle', 'summary', 'about', 'sobre', 'info', 'resumen general'],
  organizer: ['organizador', 'responsable', 'entidad responsable', 'representante', 'entidad', 'organizadores'],
  organizerEmail: ['correo organizador', 'email organizador', 'mail organizador', 'contacto organizador', 'correo de organizacion', 'correo responsable'],
  organizerPhone: ['telefono organizador', 'teléfono organizador', 'celular organizador', 'telefono responsable', 'teléfono responsable'],
  organizerWebsiteUrl: ['web organizador', 'sitio web organizador', 'pagina organizador', 'url organizador', 'web del organizador'],
  contactEmail: ['correo', 'email', 'mail', 'correo contacto', 'email contacto', 'mail contacto', 'correo electronico', 'correo electrónico', 'correo general'],
  contactPhone: ['telefono', 'teléfono', 'celular', 'telefono contacto', 'telefono festival', 'contacto', 'tel', 'phone', 'mobile', 'teléfono contacto', 'celular contacto', 'teléfono general'],
  websiteUrl: ['sitio web', 'pagina web', 'pagina', 'página', 'url', 'web', 'website', 'sitio general'],
  instagramUrl: ['instagram', 'ig', 'insta', 'instagram url', 'perfil instagram'],
  facebookUrl: ['facebook', 'fb', 'facebook url', 'perfil facebook'],
  otherUrl: ['otro enlace', 'otro link', 'red social', 'enlace', 'link', 'otros links', 'enlaces'],
  department: ['departamento', 'depto', 'dpto', 'dept', 'departament', 'provincia', 'estado', 'dep', 'departamento pnmc'],
  municipality: ['municipio', 'muni', 'ciudad', 'pueblo', 'municipality', 'city', 'mun', 'localidad', 'municipio pnmc'],
  specificLocation: ['lugar', 'lugar especifico', 'lugar específico', 'ubicacion', 'ubicación', 'sede', 'lugar fisico', 'donde se realiza'],
  addressText: ['direccion', 'dirección', 'nomenclatura', 'address', 'calle', 'dirección física'],
  latitude: ['latitud', 'lat', 'latitude'],
  longitude: ['longitud', 'lon', 'lng', 'longitude'],
  schoolCategory: ['categoria escuela', 'categoría escuela', 'categoria', 'categoría', 'tipo escuela'],
  schoolType: ['tipo de escuela', 'tipo escuela', 'tipo de proceso', 'modalidad escuela'],
  responsibleEntity: ['entidad responsable', 'responsable', 'entidad', 'quien coordina'],
  directorName: ['director', 'nombre director', 'director escuela', 'coordinador', 'nombre coordinador'],
  trainingCapacity: ['capacidad formativa', 'capacidad', 'cupos', 'capacidad estudiantes'],
  students: ['estudiantes', 'cantidad estudiantes', 'alumnos', 'numero estudiantes', 'no estudiantes'],
  activeGroupsCount: ['grupos activos', 'cantidad grupos', 'grupos', 'agrupaciones', 'no grupos'],
  trainingProcesses: ['procesos formativos', 'procesos', 'formacion', 'formación'],
  musicalPractices: ['practicas musicales', 'prácticas', 'instrumentos enseñados'],
  isActiveSchool: ['activo', 'escuela activa', 'vigente'],
  observations: ['observaciones', 'notas', 'comentarios', 'comentario', 'anotacion'],
  editionsCount: ['ediciones', 'versiones', 'cantidad ediciones', 'no ediciones'],
  periodicity: ['periodicidad', 'frecuencia', 'cada cuanto'],
  associatedFestivalId: ['id festival', 'id festival asociado', 'festival id'],
  associatedFestivalDisplayName: ['nombre festival asociado', 'festival asociado'],
  scopeType: ['alcance', 'cobertura', 'tipo de alcance'],
  marketMode: ['modalidad', 'modalidad mercado', 'tipo mercado'],
  organizationType: ['tipo centro', 'tipo de organizacion', 'tipo organización'],
  territorialScope: ['zona', 'alcance territorial', 'cobertura territorial'],
  actorType: ['tipo lutier', 'lutier tipo', 'categoria lutier'],
  workshopName: ['nombre taller', 'taller', 'nombre del taller', 'taller de lutería'],
  primaryFunction: ['especialidad', 'funcion principal', 'función principal', 'oficio'],
  instruments: ['instrumentos', 'instrumentos que fabrica', 'fabricacion'],
  contactName: ['contacto', 'nombre de contacto', 'atendido por'],
  zone: ['zona', 'sector', 'comuna', 'barrio'],
  title: ['titulo', 'título', 'nombre', 'tema', 'encabezado'],
  shortDescription: ['descripcion corta', 'descripción corta', 'resumen', 'introduccion'],
  category: ['categoria', 'categoría', 'tipo', 'clasificacion'],
  endDate: ['fecha fin', 'fecha terminacion', 'fin', 'finalizacion'],
  timeLabel: ['hora', 'hora inicio', 'inicio hora'],
  endTimeLabel: ['hora fin', 'hora final', 'fin hora'],
  location: ['lugar', 'direccion', 'lugar del evento'],
  imageUrl: ['imagen', 'foto', 'url imagen', 'link imagen', 'url mas informacion', 'url más información'],
  sortOrder: ['orden', 'prioridad', 'secuencia'],
  summary: ['resumen', 'entradilla', 'copete', 'introduccion'],
  contentHtml: ['contenido', 'cuerpo', 'cuerpo noticia', 'texto completo', 'html'],
  quoteText: ['cita', 'frase destacada', 'cita destacada'],
  author: ['autor', 'escrito por', 'redactor'],
  year: ['año', 'anio', 'fecha publicacion', 'fecha'],
  section: ['seccion', 'sección', 'categoria'],
  sectionPath: ['ruta', 'slug', 'path'],
  publicationType: ['tipo publicacion', 'tipo de publicacion', 'recurso tipo'],
  keywords: ['palabras clave', 'keywords', 'tags', 'etiquetas'],
};

// Normalize header text for comparison
const cleanText = (str = '') => {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Title Case helper
const titleCase = (str = '') => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
};

export const AdminAIAssistantPanel = ({ divipola = {} }) => {
  // Wizard steps: 1 = Files Upload, 2 = Columns Mapping, 3 = Cleansing & Preview
  const [step, setStep] = useState(1);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  
  // Files states
  const [templateFile, setTemplateFile] = useState(null);
  const [templateHeaders, setTemplateHeaders] = useState([]);
  
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceHeaders, setSourceHeaders] = useState([]);
  const [sourceRows, setSourceRows] = useState([]);
  
  // Mappings state: maps field.name -> sourceHeader index (or -1 if not mapped)
  const [mappings, setMappings] = useState({});
  const [mappingSuggestions, setMappingSuggestions] = useState({});

  // Processed Results
  const [processing, setProcessing] = useState(false);
  const [processedRows, setProcessedRows] = useState([]);
  const [observations, setObservations] = useState([]);
  const [stats, setStats] = useState({ total: 0, warnings: 0, corrections: 0, clean: 0 });

  // Chatbot Sidebar States
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu Asistente de Importación IA. Estoy listo para ayudarte a formatear y depurar tus bases de datos externas para que encajen perfectamente en la plataforma PNMC. \n\nSube la plantilla de Excel del sistema y tu base de datos externa para comenzar.'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // File Inputs references
  const templateInputRef = useRef(null);
  const sourceInputRef = useRef(null);

  // Active module definition
  const activeModule = useMemo(() => {
    return ADMIN_MODULES.find(m => m.id === selectedModuleId) || null;
  }, [selectedModuleId]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-trigger chatbot responses during step transitions
  const addAiMessage = (text) => {
    setChatMessages(prev => [...prev, { sender: 'ai', text }]);
  };

  // Chat message submission
  const handleSendMessage = (textToSend = '') => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    const userMsg = { sender: 'user', text: msg };
    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    // Generate smart local bot response based on context
    setTimeout(() => {
      let response = '';
      const normMsg = cleanText(msg);

      if (normMsg.includes('map') || normMsg.includes('columna') || normMsg.includes('no coinciden')) {
        response = 'Intento emparejar tus columnas por similitud de nombres. Si una columna no se asignó correctamente en el Paso 2, puedes cambiarla usando el selector correspondiente. ¡Asegúrate de mapear los campos obligatorios marcados en rojo!';
      } else if (normMsg.includes('divipola') || normMsg.includes('municipio') || normMsg.includes('departamento')) {
        response = 'Valido los departamentos y municipios contra el catálogo oficial DIVIPOLA de Colombia. Si el bot encuentra diferencias ortográficas (como "Bogota" o "Narino"), las corregirá automáticamente. Si el municipio no corresponde al departamento, te mostrará una advertencia.';
      } else if (normMsg.includes('correo') || normMsg.includes('email') || normMsg.includes('telefono') || normMsg.includes('celular')) {
        response = 'Sí, limpio los correos eliminando espacios invisibles y pasándolos a minúsculas. Para los teléfonos, remuevo guiones, puntos o espacios para que queden listos para la importación. Si detecto un correo sin "@", te daré una observación de advertencia.';
      } else if (normMsg.includes('descargar') || normMsg.includes('excel') || normMsg.includes('plantilla')) {
        response = 'Al finalizar en el Paso 3, generaré un archivo Excel con la estructura de cabeceras oficial y el estilo visual de la plataforma. Este archivo descargado lo podrás subir directamente al importador bulk de la sección correspondiente en la administración.';
      } else if (normMsg.includes('hola') || normMsg.includes('buenos') || normMsg.includes('tardes')) {
        response = '¡Hola! ¿En qué puedo ayudarte hoy en tu proceso de conversión de archivos? Puedes subir una plantilla oficial y tu base de datos externa para guiarte.';
      } else {
        response = 'Entiendo. Recuerda que este asistente lee tus Excels de manera 100% local en tu navegador para proteger la privacidad de los datos. Si tienes dudas sobre los campos de ' + (activeModule?.label || 'los módulos') + ', házmelo saber y te daré detalles de su formato.';
      }

      addAiMessage(response);
    }, 800);
  };

  // FAQ Quick Clicks
  const handleFaqClick = (question, answer) => {
    setChatMessages(prev => [...prev, { sender: 'user', text: question }]);
    setTimeout(() => {
      addAiMessage(answer);
    }, 500);
  };

  // Read template Excel file
  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTemplateFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawLines = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (rawLines.length === 0) {
          alert('El archivo de plantilla está vacío.');
          return;
        }

        const headers = rawLines[0].map(h => String(h || '').trim());
        setTemplateHeaders(headers);

        // Detect module based on headers
        let detected = null;
        let maxScore = 0;
        
        ADMIN_MODULES.forEach(mod => {
          const modFields = mod.fields.filter(f => !f.system && !['id', 'status'].includes(f.name));
          let matches = 0;
          modFields.forEach(field => {
            const cleanLabel = cleanText(field.label);
            const cleanFieldName = cleanText(field.name);
            headers.forEach(h => {
              const cleanH = cleanText(h);
              if (cleanH === cleanLabel || cleanH === cleanFieldName) {
                matches++;
              }
            });
          });
          
          if (matches > maxScore) {
            maxScore = matches;
            detected = mod.id;
          }
        });

        if (detected) {
          setSelectedModuleId(detected);
          addAiMessage(`¡Excelente! He analizado la plantilla "${file.name}" y detecté automáticamente que corresponde al módulo de **${ADMIN_MODULES.find(m => m.id === detected).label}**. He cargado ${headers.length} campos destino.`);
        } else {
          addAiMessage(`He cargado la plantilla "${file.name}" con ${headers.length} columnas, pero no pude determinar con certeza el módulo. Por favor, selecciona el módulo destino manualmente en la lista desplegable.`);
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer la plantilla de Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Read Source Database File
  const handleSourceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSourceFile(file);
    const isCsv = file.name.endsWith('.csv');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let rawLines = [];
        if (isCsv) {
          const text = evt.target.result || '';
          rawLines = parseCSV(text);
        } else {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rawLines = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        }

        if (rawLines.length === 0) {
          alert('El archivo origen de base de datos está vacío.');
          return;
        }

        const headers = rawLines[0].map(h => String(h || '').trim());
        const rows = rawLines.slice(1);

        setSourceHeaders(headers);
        setSourceRows(rows);

        addAiMessage(`Se ha cargado tu base de datos "${file.name}" con éxito. Contiene **${rows.length} registros** y **${headers.length} columnas**. Avancemos al Paso 2 para configurar el mapeo.`);
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo origen: ' + err.message);
      }
    };

    if (isCsv) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // CSV Simple Parser helper
  const parseCSV = (text) => {
    const lines = [];
    let row = [""];
    let insideQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
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

  // Perform auto fuzzy column mapping when selected module or source file changes
  useEffect(() => {
    if (!activeModule || sourceHeaders.length === 0) return;

    const newMappings = {};
    const suggestions = {};
    const fields = activeModule.fields.filter(f => !f.system && !['id', 'status'].includes(f.name));

    fields.forEach(field => {
      const fName = field.name;
      const fLabel = field.label;
      const cleanFName = cleanText(fName);
      const cleanFLabel = cleanText(fLabel);
      
      let bestIndex = -1;
      let highestScore = 0;
      let matchType = 'Sin asignar';

      sourceHeaders.forEach((header, index) => {
        const cleanHeader = cleanText(header);

        // Score system:
        let score = 0;

        // 1. Exact clean match of label or technical name
        if (cleanHeader === cleanFName || cleanHeader === cleanFLabel) {
          score = 100;
        }
        // 2. Synonyms mapping match
        else if (SYNONYMS[fName]?.some(syn => cleanText(syn) === cleanHeader)) {
          score = 90;
        }
        // 3. Substring inclusion
        else if (cleanHeader.includes(cleanFName) || cleanFName.includes(cleanHeader) ||
                 cleanHeader.includes(cleanFLabel) || cleanFLabel.includes(cleanHeader)) {
          score = 60;
        }
        // 4. Synonym substring inclusion
        else if (SYNONYMS[fName]?.some(syn => cleanHeader.includes(cleanText(syn)) || cleanText(syn).includes(cleanHeader))) {
          score = 50;
        }

        if (score > highestScore) {
          highestScore = score;
          bestIndex = index;
        }
      });

      if (highestScore >= 90) {
        matchType = 'Coincidencia exacta';
      } else if (highestScore >= 50) {
        matchType = 'Sugerencia';
      }

      newMappings[fName] = bestIndex; // index in sourceHeaders or -1
      suggestions[fName] = { score: highestScore, label: bestIndex !== -1 ? sourceHeaders[bestIndex] : '', type: matchType };
    });

    setMappings(newMappings);
    setMappingSuggestions(suggestions);
  }, [selectedModuleId, sourceHeaders]);

  const handleMappingChange = (fieldName, headerIndex) => {
    setMappings(prev => ({
      ...prev,
      [fieldName]: headerIndex
    }));
  };

  const handleReset = () => {
    setStep(1);
    setTemplateFile(null);
    setTemplateHeaders([]);
    setSourceFile(null);
    setSourceHeaders([]);
    setSourceRows([]);
    setMappings({});
    setSelectedModuleId('');
    setProcessedRows([]);
    setObservations([]);
    addAiMessage('Se han restablecido los archivos y la configuración. Sube de nuevo tus archivos para iniciar.');
  };

  // Transition from Step 1 to Step 2
  const handleGoToStep2 = () => {
    if (!selectedModuleId) {
      alert('Por favor selecciona un módulo de destino.');
      return;
    }
    if (sourceHeaders.length === 0) {
      alert('Por favor carga un archivo de base de datos origen.');
      return;
    }
    setStep(2);
    addAiMessage(`Bienvenido al Paso 2: Mapeo de Columnas. He realizado un análisis inicial de similitud y emparejé las columnas de tu Excel con el formato de **${activeModule.label}**. Puedes revisar los campos abajo y ajustar cualquier dropdown si es necesario.`);
  };

  // Perform cleaning and mapping of data rows (Step 3 processing)
  const handleProcessData = () => {
    setProcessing(true);
    setStep(3);

    setTimeout(() => {
      const fields = activeModule.fields.filter(f => !f.system && !['id', 'status'].includes(f.name));
      const results = [];
      const newObs = [];
      let totalWarnings = 0;
      let totalCorrections = 0;

      // Prepare DIVIPOLA canonical maps for fast search
      const canonicalDepts = {};
      const canonicalMunis = {}; // dept_key -> Set of normalized munis
      const cleanDeptToOriginal = {}; // clean_key -> original name
      const cleanMuniToOriginal = {}; // dept_key::clean_muni_key -> original name

      Object.entries(divipola || {}).forEach(([dept, munis]) => {
        const cleanDept = cleanText(dept);
        canonicalDepts[cleanDept] = dept;
        cleanDeptToOriginal[cleanDept] = dept;

        canonicalMunis[cleanDept] = new Set((munis || []).map(cleanText));
        (munis || []).forEach(muni => {
          const cleanM = cleanText(muni);
          cleanMuniToOriginal[`${cleanDept}::${cleanM}`] = muni;
        });
      });

      sourceRows.forEach((row, rowIndex) => {
        const recordIndex = rowIndex + 2; // Row number in original excel (usually header is row 1)
        const mappedRow = {};
        const rowObs = [];

        // Apply column mappings
        fields.forEach(field => {
          const sourceIdx = mappings[field.name];
          let value = sourceIdx !== undefined && sourceIdx !== -1 ? row[sourceIdx] : '';
          
          if (value === undefined || value === null) {
            value = '';
          }
          
          mappedRow[field.name] = String(value).trim();
        });

        // 1. Cleansing emails
        fields.forEach(field => {
          if (field.type === 'email' && mappedRow[field.name]) {
            const rawVal = mappedRow[field.name];
            let cleanVal = rawVal.toLowerCase().replace(/\s+/g, '');
            if (rawVal !== cleanVal) {
              mappedRow[field.name] = cleanVal;
              totalCorrections++;
              rowObs.push({
                type: 'correction',
                message: `Fila ${recordIndex}: Se depuraron espacios/mayúsculas del correo en "${field.label}" ("${rawVal}" ➔ "${cleanVal}").`
              });
            }
            // Syntax validation check
            if (!cleanVal.includes('@') || !cleanVal.includes('.')) {
              totalWarnings++;
              rowObs.push({
                type: 'warning',
                message: `Fila ${recordIndex}: El correo en "${field.label}" ("${cleanVal}") no tiene un formato válido.`
              });
            }
          }
        });

        // 2. Cleansing phones
        fields.forEach(field => {
          const isPhone = field.name.toLowerCase().includes('phone') || field.name.toLowerCase().includes('tel');
          if (isPhone && mappedRow[field.name]) {
            const rawVal = mappedRow[field.name];
            // Strip spaces, dashes, periods
            let cleanVal = rawVal.replace(/[\s\-\.\(\)]/g, '');
            if (rawVal !== cleanVal) {
              mappedRow[field.name] = cleanVal;
              totalCorrections++;
              rowObs.push({
                type: 'correction',
                message: `Fila ${recordIndex}: Se limpiaron caracteres especiales del teléfono "${field.label}" ("${rawVal}" ➔ "${cleanVal}").`
              });
            }
          }
        });

        // 3. DIVIPOLA Department & Municipality validation
        let hasDept = 'department' in mappedRow;
        let hasMuni = 'municipality' in mappedRow;

        if (hasDept && mappedRow.department) {
          const rawDept = mappedRow.department;
          const normDept = cleanText(rawDept);
          const matchedDept = canonicalDepts[normDept];

          if (matchedDept) {
            if (rawDept !== matchedDept) {
              mappedRow.department = matchedDept;
              totalCorrections++;
              rowObs.push({
                type: 'correction',
                message: `Fila ${recordIndex}: Se normalizó el departamento a DIVIPOLA ("${rawDept}" ➔ "${matchedDept}").`
              });
            }

            // Now check municipality if present
            if (hasMuni && mappedRow.municipality) {
              const rawMuni = mappedRow.municipality;
              const normMuni = cleanText(rawMuni);
              const deptMunis = canonicalMunis[normDept];

              if (deptMunis && deptMunis.has(normMuni)) {
                const matchedMuni = cleanMuniToOriginal[`${normDept}::${normMuni}`];
                if (rawMuni !== matchedMuni) {
                  mappedRow.municipality = matchedMuni;
                  totalCorrections++;
                  rowObs.push({
                    type: 'correction',
                    message: `Fila ${recordIndex}: Se normalizó el municipio a DIVIPOLA ("${rawMuni}" ➔ "${matchedMuni}").`
                  });
                }
              } else {
                totalWarnings++;
                rowObs.push({
                  type: 'warning',
                  message: `Fila ${recordIndex}: El municipio "${rawMuni}" no se encontró en DIVIPOLA para el departamento "${matchedDept}".`
                });
              }
            }
          } else {
            totalWarnings++;
            rowObs.push({
              type: 'warning',
              message: `Fila ${recordIndex}: El departamento "${rawDept}" no coincide con ningún departamento de DIVIPOLA Colombia.`
            });
          }
        }

        // 4. Missing required fields check
        fields.forEach(field => {
          if (field.required && !mappedRow[field.name]) {
            totalWarnings++;
            rowObs.push({
              type: 'warning',
              message: `Fila ${recordIndex}: El campo requerido "${field.label}" está vacío.`
            });
          }
        });

        // 5. Checkboxes conversion (Sí / No to boolean/checkbox values)
        fields.forEach(field => {
          if (field.type === 'checkbox') {
            const rawVal = cleanText(mappedRow[field.name]);
            if (['si', 's', 'yes', 'y', '1', 'true', 'activo'].includes(rawVal)) {
              mappedRow[field.name] = 'Sí';
            } else if (rawVal) {
              mappedRow[field.name] = 'No';
            } else {
              mappedRow[field.name] = field.defaultValue === true ? 'Sí' : 'No';
            }
          }
        });

        // Add defaults for empty fields
        fields.forEach(field => {
          if (!mappedRow[field.name] && field.defaultValue !== undefined) {
            mappedRow[field.name] = String(field.defaultValue);
          }
        });

        results.push(mappedRow);
        if (rowObs.length > 0) {
          newObs.push(...rowObs);
        }
      });

      const cleanCount = sourceRows.length - (totalWarnings > 0 ? 1 : 0); // rough estimation
      setProcessedRows(results);
      setObservations(newObs);
      setStats({
        total: sourceRows.length,
        warnings: newObs.filter(o => o.type === 'warning').length,
        corrections: newObs.filter(o => o.type === 'correction').length,
        clean: results.length
      });
      setProcessing(false);

      addAiMessage(`¡Limpieza y mapeo completados! He procesado **${sourceRows.length} registros**. Encontré **${newObs.filter(o => o.type === 'correction').length} correcciones automáticas** (DIVIPOLA, correos) y **${newObs.filter(o => o.type === 'warning').length} advertencias** sobre campos incompletos o erróneos. Ya puedes descargar el archivo final estructurado.`);
    }, 1200);
  };

  // Generate Excel file with ExcelJS and download
  const handleDownloadExcel = async () => {
    if (processedRows.length === 0) return;

    try {
      const fields = activeModule.fields.filter(f => f.name !== 'id' && f.name !== 'status');
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Entorno Virtual PNMC - Asistente IA';
      workbook.created = new Date();

      const templateSheet = workbook.addWorksheet('Plantilla', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      // Add Headers Row (Technical labels)
      templateSheet.addRow(fields.map(f => f.label));

      // Add Processed Rows
      processedRows.forEach(row => {
        const rowData = fields.map(field => row[field.name] || '');
        templateSheet.addRow(rowData);
      });

      // Style Header
      templateSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      templateSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF291242' } };
      templateSheet.getRow(1).alignment = { vertical: 'middle', wrapText: true };
      templateSheet.getRow(1).height = 30;

      // Auto-fit Columns width
      templateSheet.columns = fields.map((f, idx) => {
        const labelLen = String(f.label || '').length;
        let maxValLen = 0;
        processedRows.forEach(row => {
          const valLen = String(row[f.name] || '').length;
          if (valLen > maxValLen) maxValLen = valLen;
        });
        return { width: Math.min(45, Math.max(16, Math.max(labelLen, maxValLen) + 3)) };
      });

      // Trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pnmc_importado_${activeModule.id}_ia.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      addAiMessage(`¡El archivo "pnmc_importado_${activeModule.id}_ia.xlsx" ha sido generado y descargado! Ahora puedes dirigirte al módulo de **${activeModule.label}** e importarlo usando el botón estándar.`);
    } catch (err) {
      console.error(err);
      alert('Error al generar el archivo Excel: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row outfit-font">
      
      {/* Main Panel Area (Left/Center) */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all">
        
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#291242]">
                <Sparkles size={18} className="animate-pulse" />
              </span>
              <h2 className="text-xl font-black text-[#291242]">Asistente de Importación IA</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Mapea, depura y formatea tus bases de datos de forma local y segura.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <RotateCcw size={12} />
                Reiniciar
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-[#291242]">
              Paso {step} de 3
            </span>
          </div>
        </div>

        {/* Wizard Steps Indicators */}
        <div className="mb-8 flex items-center justify-between gap-2 overflow-x-auto border-b border-slate-100 pb-4">
          <div className={`flex items-center gap-2 pb-2 text-sm font-semibold transition ${step === 1 ? 'border-b-2 border-[#00DA5E] text-slate-900' : 'text-slate-400'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs ${step > 1 ? 'bg-[#00DA5E] text-white' : step === 1 ? 'bg-[#291242] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 1 ? <Check size={10} /> : '1'}
            </span>
            Archivos
          </div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className={`flex items-center gap-2 pb-2 text-sm font-semibold transition ${step === 2 ? 'border-b-2 border-[#00DA5E] text-slate-900' : 'text-slate-400'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs ${step > 2 ? 'bg-[#00DA5E] text-white' : step === 2 ? 'bg-[#291242] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 2 ? <Check size={10} /> : '2'}
            </span>
            Mapeo
          </div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className={`flex items-center gap-2 pb-2 text-sm font-semibold transition ${step === 3 ? 'border-b-2 border-[#00DA5E] text-slate-900' : 'text-slate-400'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs ${step === 3 ? 'bg-[#291242] text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </span>
            Resultados
          </div>
        </div>

        {/* STEP 1: UPLOAD FILES */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            
            {/* Step Explanation Card */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 text-xs text-purple-900">
              <div className="flex items-start gap-2">
                <Info size={16} className="mt-0.5 flex-shrink-0 text-[#291242]" />
                <div>
                  <span className="font-bold">¿Cómo funciona?</span>
                  <ul className="mt-1 list-disc pl-4 space-y-1">
                    <li>Sube la plantilla oficial (.xlsx) descargada del Entorno Virtual (el bot detectará qué módulo corresponde automáticamente).</li>
                    <li>Sube tu Excel o CSV de base de datos externa (el bot analizará las columnas).</li>
                    <li>Si no tienes una plantilla descargada, simplemente selecciona el módulo de destino manualmente en el selector inferior.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Drop Zones */}
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Target Template Box */}
              <div className="flex flex-col">
                <label className="mb-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  1. Plantilla Destino (.xlsx)
                </label>
                <div
                  onClick={() => templateInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${templateFile ? 'border-[#00DA5E] bg-green-50/20' : 'border-slate-300 hover:border-[#291242] bg-slate-50/50 hover:bg-slate-50'}`}
                >
                  <input
                    ref={templateInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleTemplateUpload}
                    className="hidden"
                  />
                  {templateFile ? (
                    <>
                      <FileSpreadsheet size={28} className="text-[#00DA5E]" />
                      <span className="mt-2 block text-xs font-black text-slate-900 truncate max-w-[200px]">{templateFile.name}</span>
                      <span className="mt-1 block text-2xs text-[#00DA5E] font-bold">Plantilla cargada correctamente</span>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-slate-400" />
                      <span className="mt-2 block text-xs font-bold text-slate-800">Cargar Plantilla Oficial</span>
                      <span className="mt-1 block text-2xs text-slate-400">Arrastra o haz clic para subir</span>
                    </>
                  )}
                </div>
              </div>

              {/* Source Database Box */}
              <div className="flex flex-col">
                <label className="mb-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  2. Base de Datos Origen (.xlsx, .csv)
                </label>
                <div
                  onClick={() => sourceInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${sourceFile ? 'border-[#00DA5E] bg-green-50/20' : 'border-slate-300 hover:border-[#291242] bg-slate-50/50 hover:bg-slate-50'}`}
                >
                  <input
                    ref={sourceInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleSourceUpload}
                    className="hidden"
                  />
                  {sourceFile ? (
                    <>
                      <FileSpreadsheet size={28} className="text-[#00DA5E]" />
                      <span className="mt-2 block text-xs font-black text-slate-900 truncate max-w-[200px]">{sourceFile.name}</span>
                      <span className="mt-1 block text-2xs text-[#00DA5E] font-bold">
                        {sourceRows.length} registros cargados
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-slate-400" />
                      <span className="mt-2 block text-xs font-bold text-slate-800">Cargar Datos Externos</span>
                      <span className="mt-1 block text-2xs text-slate-400">Arrastra o haz clic para subir</span>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Manual Selector */}
            <div className="mt-2 flex flex-col gap-2">
              <label htmlFor="moduleSelector" className="text-xs font-black uppercase tracking-wider text-slate-600">
                Selección de Módulo Destino Manual (Opcional)
              </label>
              <select
                id="moduleSelector"
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  if (e.target.value) {
                    const matched = ADMIN_MODULES.find(m => m.id === e.target.value);
                    addAiMessage(`Has seleccionado manualmente el módulo **${matched.label}**. Mapearemos los datos a este formato.`);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-[#291242] focus:ring-1 focus:ring-[#291242] outline-none"
              >
                <option value="">-- Seleccionar Módulo Destino --</option>
                {ADMIN_MODULES.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.label} ({mod.description})
                  </option>
                ))}
              </select>
            </div>

            {/* Confirm / Continue Button */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleGoToStep2}
                disabled={!selectedModuleId || sourceHeaders.length === 0}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black tracking-wider uppercase text-white transition shadow-sm ${(!selectedModuleId || sourceHeaders.length === 0) ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#291242] hover:bg-[#1a0b2c]'}`}
              >
                Avanzar a Mapeo
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 2 && activeModule && (
          <div className="flex flex-col gap-6">
            
            {/* Guide message */}
            <div className="rounded-xl border border-[#00DA5E]/30 bg-[#00DA5E]/5 p-4 text-xs text-slate-800">
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-[#00DA5E]" />
                <div>
                  <span className="font-black text-[#291242]">Mapeador fuzzy activo:</span> he emparejado automáticamente las columnas que se asemejan en nombre. Revisa la lista y completa los mapeos vacíos para campos requeridos.
                </div>
              </div>
            </div>

            {/* Table Mappings */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3 w-1/3">Campo Destino (Sistema)</th>
                    <th className="p-3 w-1/3">Confianza IA</th>
                    <th className="p-3 w-1/3">Columna Origen (Tu Excel)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeModule.fields
                    .filter(f => !f.system && !['id', 'status'].includes(f.name))
                    .map((field) => {
                      const mappingVal = mappings[field.name] ?? -1;
                      const suggestion = mappingSuggestions[field.name] || { score: 0, type: 'Sin asignar' };

                      return (
                        <tr key={field.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              {field.label}
                              {field.required && (
                                <span className="rounded bg-red-100 px-1 py-0.5 text-3xs font-black text-red-600 tracking-wide uppercase">
                                  Requerido
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-3xs text-slate-500 font-medium">
                              Ref: <code className="bg-slate-100 px-1 rounded">{field.name}</code> | Tipo: {field.type}
                            </div>
                          </td>
                          <td className="p-3">
                            {suggestion.score >= 90 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-3xs font-black text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                {suggestion.type} ({suggestion.score}%)
                              </span>
                            ) : suggestion.score >= 50 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-3xs font-black text-purple-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                                {suggestion.type} ({suggestion.score}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-3xs font-black text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                Sin Asignar
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <select
                              value={mappingVal}
                              onChange={(e) => handleMappingChange(field.name, parseInt(e.target.value))}
                              className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-800 focus:border-[#291242] outline-none"
                            >
                              <option value="-1">-- No asignar --</option>
                              {sourceHeaders.map((header, idx) => (
                                <option key={idx} value={idx}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black tracking-wider uppercase text-slate-600 transition hover:bg-slate-100"
              >
                Volver
              </button>
              
              <button
                type="button"
                onClick={handleProcessData}
                className="flex items-center gap-2 rounded-xl bg-[#291242] px-5 py-2.5 text-xs font-black tracking-wider uppercase text-white transition hover:bg-[#1a0b2c]"
              >
                Procesar y Limpiar con IA
                <Sparkles size={14} className="text-[#00DA5E]" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 3: RESULTS AND DOWNLOAD */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            {processing ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#291242] border-t-transparent"></div>
                <h3 className="mt-4 text-sm font-black text-slate-800">El Bot Local está formateando los registros...</h3>
                <p className="mt-1 text-xs text-slate-500">Ejecutando normalizaciones DIVIPOLA y depurando correos/teléfonos</p>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
                    <span className="block text-2xl font-black text-slate-900">{stats.total}</span>
                    <span className="text-3xs font-black uppercase tracking-wider text-slate-400">Total Filas</span>
                  </div>
                  <div className="rounded-xl border border-green-100 bg-green-50/20 p-3 text-center">
                    <span className="block text-2xl font-black text-green-700">{stats.clean}</span>
                    <span className="text-3xs font-black uppercase tracking-wider text-green-500">Mapeadas</span>
                  </div>
                  <div className="rounded-xl border border-purple-100 bg-purple-50/20 p-3 text-center">
                    <span className="block text-2xl font-black text-[#291242]">{stats.corrections}</span>
                    <span className="text-3xs font-black uppercase tracking-wider text-[#291242]/70">Corregidas IA</span>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-3 text-center">
                    <span className="block text-2xl font-black text-amber-600">{stats.warnings}</span>
                    <span className="text-3xs font-black uppercase tracking-wider text-amber-500">Advertencias</span>
                  </div>
                </div>

                {/* Main Download Call To Action */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50/50 via-white to-slate-50 p-6 text-center shadow-xs">
                  <h3 className="text-base font-black text-[#291242]">¡Tu archivo formateado está listo!</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    El bot completó las conversiones al esquema oficial de <b>{activeModule?.label}</b>. Presiona el botón para descargar el Excel listo para importar.
                  </p>
                  
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      className="group relative flex items-center gap-2 rounded-xl bg-[#291242] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#1a0b2c] shadow-lg shadow-purple-900/10 active:scale-95"
                    >
                      <Download size={14} className="text-[#00DA5E]" />
                      Descargar Archivo Formateado (.xlsx)
                      <span className="absolute inset-0 rounded-xl border-2 border-[#00DA5E] animate-ping opacity-0 group-hover:opacity-20 transition"></span>
                    </button>
                  </div>
                </div>

                {/* Observations list */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Observaciones y Depuración IA ({observations.length})
                  </h3>
                  
                  {observations.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                      ¡Excelente! No se requirió ninguna corrección ni se encontraron campos incompletos.
                    </div>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 p-3 bg-slate-50/50 flex flex-col gap-2 text-2xs">
                      {observations.map((obs, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded-lg border bg-white ${obs.type === 'warning' ? 'border-amber-100 text-amber-800' : 'border-purple-100 text-[#291242]'}`}
                        >
                          {obs.type === 'warning' ? (
                            <AlertTriangle size={13} className="flex-shrink-0 text-amber-500 mt-0.5" />
                          ) : (
                            <Sparkles size={13} className="flex-shrink-0 text-[#291242] mt-0.5" />
                          )}
                          <span className="font-semibold">{obs.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview Table */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Previsualización de Muestras (Primeros 3 registros)
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-2xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          {activeModule.fields
                            .filter(f => !f.system && !['id', 'status'].includes(f.name))
                            .slice(0, 5) // Preview first 5 columns to keep layout clean
                            .map(field => (
                              <th key={field.name} className="p-2 border-r border-slate-200 last:border-r-0">
                                {field.label}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody>
                        {processedRows.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            {activeModule.fields
                              .filter(f => !f.system && !['id', 'status'].includes(f.name))
                              .slice(0, 5)
                              .map(field => (
                                <td key={field.name} className="p-2 border-r border-slate-200 last:border-r-0 truncate max-w-[120px] font-medium text-slate-700">
                                  {row[field.name] || <span className="text-slate-300 italic">vacío</span>}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black tracking-wider uppercase text-slate-600 transition hover:bg-slate-100"
                  >
                    Volver a Mapeo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Local AI Assistant Chat & FAQ Sidebar (Right) */}
      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm lg:w-[320px] flex flex-col gap-4">
        
        {/* Sidebar Bot Title */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#291242] text-white">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase">Consultas IA Local</h3>
            <span className="inline-flex items-center gap-1 text-3xs font-black text-green-600 uppercase">
              <span className="h-1 w-1 rounded-full bg-green-500"></span>
              En Línea
            </span>
          </div>
        </div>

        {/* Chat Messages Box */}
        <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2.5">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2 max-w-[85%] rounded-lg p-2.5 text-2xs leading-relaxed ${msg.sender === 'ai' ? 'bg-slate-100 text-slate-800 self-start' : 'bg-[#291242] text-white self-end'}`}
            >
              {msg.sender === 'ai' && (
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#291242] text-white text-3xs mt-0.5">
                  B
                </div>
              )}
              <div className="whitespace-pre-line font-medium">{msg.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick FAQs section */}
        <div className="flex flex-col gap-1">
          <span className="text-3xs font-black uppercase text-slate-400 tracking-wider">Preguntas Rápidas</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => handleFaqClick(
                '¿Cómo funciona el mapeo?',
                'Leo las cabeceras de ambos Excels y comparo por palabras clave. Puedes cambiar cualquier campo con los dropdowns del Paso 2.'
              )}
              className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-3xs font-bold text-slate-600 hover:border-[#291242] text-left transition"
            >
              📊 Mapeo automático
            </button>
            <button
              onClick={() => handleFaqClick(
                '¿Qué valida DIVIPOLA?',
                'DIVIPOLA es la base de datos de municipios de Colombia. Normalizo tildes y nombres de municipios y departamentos correspondientes.'
              )}
              className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-3xs font-bold text-slate-600 hover:border-[#291242] text-left transition"
            >
              🇨🇴 DIVIPOLA Colombia
            </button>
            <button
              onClick={() => handleFaqClick(
                '¿Qué hace con los correos y teléfonos?',
                'Limpio espacios en blanco, paso correos a minúsculas y quito caracteres especiales de teléfonos para estandarizar el formato.'
              )}
              className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-3xs font-bold text-slate-600 hover:border-[#291242] text-left transition"
            >
              ✉️ Correo / Teléfono
            </button>
          </div>
        </div>

        {/* Input Chat */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Pregúntale al bot..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-2xs font-semibold text-slate-800 outline-none focus:border-[#291242]"
          />
          <button
            type="submit"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#291242] text-white hover:bg-[#1a0b2c] transition"
          >
            <Send size={12} />
          </button>
        </form>

      </div>

    </div>
  );
};

export default AdminAIAssistantPanel;
