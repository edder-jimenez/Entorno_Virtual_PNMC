import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Send } from 'lucide-react';
import {
  MAP_PARTICIPATION_WORKBOOK_FILE_NAME,
  persistMapParticipationWorkbook,
} from '../../../lib/mapParticipationWorkbookClient.js';
import {
  getSortedDepartmentNames,
  municipalityExistsInList,
  scrollToElementWithOffset,
} from '../../map/domain/mapDomain.js';
import {
  MAP_PARTICIPATION_ACTOR_OPTIONS,
  MAP_PARTICIPATION_DRAFT_STORAGE_KEY,
  MAP_PARTICIPATION_FIELDSETS,
  MAP_PARTICIPATION_IDENTITY_COPY,
  MAP_PARTICIPATION_IDENTIFICATION_TYPE_OPTIONS,
  MAP_PARTICIPATION_MARKET_CURRENT_YEAR_OPTIONS,
  MAP_PARTICIPATION_QUEUE_STORAGE_KEY,
  MAP_PARTICIPATION_ROLE_OPTIONS,
  MAP_PARTICIPATION_SCOPE_OPTIONS,
  buildMapParticipationReference,
  createMapParticipationFormState,
  getMapParticipationFieldErrorMessage,
  getMapParticipationMunicipalities,
  hasMapParticipationValue,
} from '../domain/participationFormConfig.js';
import {
  ContentWrapper,
  PageHero,
  SectionHeader,
  Tag,
} from '../../shared/components/PagePrimitives.jsx';
import { Button } from '../../../components/ui/index.js';
import { ParticipationSpecificSection } from '../components/ParticipationSpecificSection.jsx';

const OPTIONAL_URL_FIELDS = ['website', 'facebookUrl', 'instagramUrl'];

const normalizeTextValue = (value) => (
  typeof value === 'string'
    ? [...value]
        .filter((character) => {
          const code = character.charCodeAt(0);
          return code > 31 || character === '\n' || character === '\r' || character === '\t';
        })
        .filter((character) => character.charCodeAt(0) !== 127)
        .join('')
        .trim()
    : value
);

const normalizeParticipationPayload = (payload) => Object.fromEntries(
  Object.entries(payload).map(([key, value]) => [key, normalizeTextValue(value)])
);

const isValidHttpUrl = (value = '') => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return true;

  try {
    const url = new URL(trimmedValue);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const isValidPhone = (value = '') => /^[0-9+()\-\s]{7,25}$/.test(value.trim());

const MapaParticipaPage = ({ onBack }) => {
  const participationSectionRef = useRef(null);
  const [participationForm, setParticipationForm] = useState(() => {
    if (typeof window === 'undefined') return createMapParticipationFormState();

    try {
      const storedDraft = window.localStorage.getItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY);

      if (!storedDraft) return createMapParticipationFormState();

      const parsedDraft = JSON.parse(storedDraft);
      const normalizedDraft = parsedDraft?.actorType === 'school'
        ? {
            ...parsedDraft,
            actorType: 'individual',
          }
        : parsedDraft;
      const migratedIndividualDraft = normalizedDraft?.actorType === 'individual' && normalizedDraft.actorName && !normalizedDraft.individualFirstName && !normalizedDraft.individualLastName
        ? {
            ...normalizedDraft,
            individualFirstName: normalizedDraft.actorName,
          }
        : normalizedDraft;
      const migratedDraft = migratedIndividualDraft?.actorType === 'market' && Array.isArray(migratedIndividualDraft.marketHabitualMonths) === false
        ? {
            ...migratedIndividualDraft,
            marketHabitualMonths: migratedIndividualDraft.marketHabitualMonth
              ? [migratedIndividualDraft.marketHabitualMonth]
              : [],
          }
        : migratedIndividualDraft;
      const migratedFestivalDraft = migratedDraft?.actorType === 'festival' && Array.isArray(migratedDraft.festivalHabitualMonths) === false
        ? {
            ...migratedDraft,
            festivalHabitualMonths: migratedDraft.festivalMonth
              ? [migratedDraft.festivalMonth]
              : [],
          }
        : migratedDraft;

      return {
        ...createMapParticipationFormState(),
        ...migratedFestivalDraft,
      };
    } catch (error) {
      console.warn('No se pudo recuperar el borrador del formulario de participación:', error);
      return createMapParticipationFormState();
    }
  });
  const [participationErrors, setParticipationErrors] = useState({});
  const [lastParticipationSubmission, setLastParticipationSubmission] = useState(null);
  const [participationWorkbookFeedback, setParticipationWorkbookFeedback] = useState(null);
  const [isPersistingParticipation, setIsPersistingParticipation] = useState(false);

  const participationMunicipalities = useMemo(
    () => getMapParticipationMunicipalities(participationForm.department),
    [participationForm.department]
  );
  const activeParticipationActor = useMemo(
    () => MAP_PARTICIPATION_ACTOR_OPTIONS.find((option) => option.key === participationForm.actorType) || MAP_PARTICIPATION_ACTOR_OPTIONS[0],
    [participationForm.actorType]
  );
  const activeParticipationFields = useMemo(
    () => MAP_PARTICIPATION_FIELDSETS[participationForm.actorType] || [],
    [participationForm.actorType]
  );
  const activeParticipationIdentity = useMemo(
    () => MAP_PARTICIPATION_IDENTITY_COPY[participationForm.actorType] || MAP_PARTICIPATION_IDENTITY_COPY.organization,
    [participationForm.actorType]
  );
  const activeParticipationRoleOptions = useMemo(
    () => MAP_PARTICIPATION_ROLE_OPTIONS[participationForm.actorType] || MAP_PARTICIPATION_ROLE_OPTIONS.default,
    [participationForm.actorType]
  );
  const isIndividualParticipation = participationForm.actorType === 'individual';
  const isFestivalParticipation = participationForm.actorType === 'festival';
  const isMarketParticipation = participationForm.actorType === 'market';
  const resolvedParticipationActorName = useMemo(() => {
    if (!isIndividualParticipation) return participationForm.actorName.trim();
    return [participationForm.individualFirstName, participationForm.individualLastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');
  }, [isIndividualParticipation, participationForm.actorName, participationForm.individualFirstName, participationForm.individualLastName]);
  const festivalUsesMultiMonthSelection = ['Semestral', 'Trimestral'].includes(participationForm.festivalFrequency);
  const festivalUsesDateRange = Number(participationForm.festivalDurationDays) > 1;
  const marketUsesMultiMonthSelection = ['Semestral', 'Trimestral'].includes(participationForm.marketFrequency);

  const handleParticipationFieldChange = useCallback((field, value) => {
    setParticipationForm((current) => {
      const nextValue = typeof value === 'function' ? value(current[field]) : value;
      const nextForm = {
        ...current,
        [field]: nextValue,
      };

      if (field === 'actorType') {
        nextForm.roles = [];
      }

      if (field === 'department') {
        const nextMunicipalities = getMapParticipationMunicipalities(nextValue);

        if (!municipalityExistsInList(current.municipality, nextMunicipalities)) {
          nextForm.municipality = '';
        }
      }

      if (field === 'hasArtisticName' && !nextValue) {
        nextForm.artisticName = '';
      }

      if (field === 'linkedFestival' && nextValue !== 'Sí') {
        nextForm.linkedFestivalName = '';
      }

      if (field === 'festivalFrequency') {
        if (!['Semestral', 'Trimestral'].includes(nextValue)) {
          nextForm.festivalHabitualMonths = current.festivalHabitualMonths?.[0] ? [current.festivalHabitualMonths[0]] : [];
        }
      }

      if (field === 'festivalVenueMode') {
        if (nextValue === 'Varias ciudades o municipios') {
          nextForm.festivalAdditionalLocations = current.festivalAdditionalLocations?.length
            ? current.festivalAdditionalLocations
            : [{ department: '', municipality: '' }];
        } else {
          nextForm.festivalAdditionalLocations = [];
        }
      }

      if (field === 'festivalDurationDays') {
        if (Number(nextValue) > 1) {
          nextForm.festivalThisYearDate = '';
        } else {
          nextForm.festivalThisYearStartDate = '';
          nextForm.festivalThisYearEndDate = '';
        }
      }

      if (field === 'festivalThisYearStatus') {
        if (!['Ya se realizó', 'Se va a realizar'].includes(nextValue)) {
          nextForm.festivalThisYearDate = '';
          nextForm.festivalThisYearStartDate = '';
          nextForm.festivalThisYearEndDate = '';
        }

        if (nextValue !== 'Se va a realizar') {
          nextForm.festivalCurrentOpenCall = '';
          nextForm.festivalOpenCallDeadline = '';
        }
      }

      if (field === 'openCall' && nextValue !== 'Sí') {
        nextForm.festivalCurrentOpenCall = '';
        nextForm.festivalOpenCallDeadline = '';
      }

      if (field === 'festivalCurrentOpenCall' && nextValue !== 'Sí') {
        nextForm.festivalOpenCallDeadline = '';
      }

      if (field === 'marketThisYearStatus') {
        if (nextValue !== 'Se va a realizar') {
          nextForm.marketThisYearMonth = '';
        }

        if (nextValue !== 'Ya se realizó') {
          nextForm.marketThisYearDate = '';
        }
      }

      if (field === 'marketFrequency') {
        if (!['Semestral', 'Trimestral'].includes(nextValue)) {
          nextForm.marketHabitualMonths = current.marketHabitualMonths?.[0] ? [current.marketHabitualMonths[0]] : [];
        }
      }

      if (field === 'marketThisYearStatus' && nextValue === 'Está por confirmar') {
        nextForm.marketThisYearMonth = '';
      }

      return nextForm;
    });

    setParticipationErrors((current) => {
      const hasDependentErrorHandling = [
        'actorType',
        'department',
        'hasArtisticName',
        'linkedFestival',
        'festivalFrequency',
        'festivalDurationDays',
        'festivalVenueMode',
        'festivalThisYearStatus',
        'openCall',
        'festivalCurrentOpenCall',
        'marketThisYearStatus',
        'marketFrequency',
      ].includes(field);

      if (!current[field] && !hasDependentErrorHandling) return current;

      const nextErrors = { ...current };
      delete nextErrors[field];

      if (field === 'department') {
        delete nextErrors.municipality;
      }

      if (field === 'actorType') {
        delete nextErrors.actorName;
        delete nextErrors.individualFirstName;
        delete nextErrors.individualLastName;
        delete nextErrors.identificationType;
        delete nextErrors.identificationNumber;
        delete nextErrors.contactName;
        delete nextErrors.contactRole;
        delete nextErrors.responsibleEntity;
        delete nextErrors.territoryScope;
        delete nextErrors.roles;
        delete nextErrors.artisticName;
        delete nextErrors.festivalHabitualMonths;
        delete nextErrors.festivalDurationDays;
        delete nextErrors.festivalThisYearDate;
        delete nextErrors.festivalThisYearStartDate;
        delete nextErrors.festivalThisYearEndDate;
        delete nextErrors.festivalAdditionalLocations;
        delete nextErrors.festivalCurrentOpenCall;
        delete nextErrors.festivalOpenCallDeadline;
        delete nextErrors.linkedFestivalName;
        delete nextErrors.marketHabitualMonths;
        delete nextErrors.marketThisYearMonth;
        delete nextErrors.marketThisYearDate;
      }

      if (field === 'hasArtisticName' && !value) {
        delete nextErrors.artisticName;
      }

      if (field === 'linkedFestival' && value !== 'Sí') {
        delete nextErrors.linkedFestivalName;
      }

      if (field === 'festivalFrequency') {
        delete nextErrors.festivalHabitualMonths;
      }

      if (field === 'festivalDurationDays') {
        delete nextErrors.festivalThisYearDate;
        delete nextErrors.festivalThisYearStartDate;
        delete nextErrors.festivalThisYearEndDate;
      }

      if (field === 'festivalVenueMode') {
        delete nextErrors.festivalAdditionalLocations;
      }

      if (field === 'festivalThisYearStatus') {
        delete nextErrors.festivalThisYearDate;
        delete nextErrors.festivalThisYearStartDate;
        delete nextErrors.festivalThisYearEndDate;
        delete nextErrors.festivalCurrentOpenCall;
        delete nextErrors.festivalOpenCallDeadline;
      }

      if (field === 'openCall') {
        delete nextErrors.festivalCurrentOpenCall;
        delete nextErrors.festivalOpenCallDeadline;
      }

      if (field === 'festivalCurrentOpenCall') {
        delete nextErrors.festivalOpenCallDeadline;
      }

      if (field === 'marketThisYearStatus') {
        delete nextErrors.marketThisYearMonth;
        delete nextErrors.marketThisYearDate;
      }

      if (field === 'marketFrequency') {
        delete nextErrors.marketHabitualMonths;
      }

      return nextErrors;
    });
  }, []);

  const addFestivalLocation = useCallback(() => {
    setParticipationForm((current) => ({
      ...current,
      festivalAdditionalLocations: [
        ...(current.festivalAdditionalLocations || []),
        { department: '', municipality: '' },
      ],
    }));

    setParticipationErrors((current) => {
      if (!current.festivalAdditionalLocations) return current;
      const nextErrors = { ...current };
      delete nextErrors.festivalAdditionalLocations;
      return nextErrors;
    });
  }, []);

  const updateFestivalLocation = useCallback((index, field, value) => {
    setParticipationForm((current) => {
      const nextLocations = [...(current.festivalAdditionalLocations || [])];
      const currentLocation = nextLocations[index] || { department: '', municipality: '' };
      const nextLocation = {
        ...currentLocation,
        [field]: value,
      };

      if (field === 'department') {
        const municipalities = getMapParticipationMunicipalities(value);

        if (!municipalityExistsInList(currentLocation.municipality, municipalities)) {
          nextLocation.municipality = '';
        }
      }

      nextLocations[index] = nextLocation;

      return {
        ...current,
        festivalAdditionalLocations: nextLocations,
      };
    });

    setParticipationErrors((current) => {
      if (!current.festivalAdditionalLocations) return current;
      const nextErrors = { ...current };
      delete nextErrors.festivalAdditionalLocations;
      return nextErrors;
    });
  }, []);

  const removeFestivalLocation = useCallback((index) => {
    setParticipationForm((current) => ({
      ...current,
      festivalAdditionalLocations: (current.festivalAdditionalLocations || []).filter((_, itemIndex) => itemIndex !== index),
    }));

    setParticipationErrors((current) => {
      if (!current.festivalAdditionalLocations) return current;
      const nextErrors = { ...current };
      delete nextErrors.festivalAdditionalLocations;
      return nextErrors;
    });
  }, []);

  const toggleParticipationRole = useCallback((role) => {
    setParticipationForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));

    setParticipationErrors((current) => {
      if (!current.roles) return current;
      const nextErrors = { ...current };
      delete nextErrors.roles;
      return nextErrors;
    });
  }, []);

  const resetParticipationForm = useCallback(() => {
    setParticipationForm(createMapParticipationFormState());
    setParticipationErrors({});
    setParticipationWorkbookFeedback(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY, JSON.stringify(participationForm));
    } catch (error) {
      console.warn('No se pudo guardar el borrador del formulario de participación:', error);
    }
  }, [participationForm]);

  const handleParticipationSubmit = useCallback(async (event) => {
    event.preventDefault();
    setParticipationWorkbookFeedback(null);

    const nextErrors = {};
    const activeRequiredFields = activeParticipationFields.filter((field) => hasMapParticipationValue(participationForm[field.key]) === false);

    activeRequiredFields.forEach((field) => {
      nextErrors[field.key] = getMapParticipationFieldErrorMessage(field);
    });

    if (isIndividualParticipation) {
      if (!participationForm.individualFirstName.trim()) nextErrors.individualFirstName = 'Escribe los nombres.';
      if (!participationForm.individualLastName.trim()) nextErrors.individualLastName = 'Escribe los apellidos.';
    } else if (!participationForm.actorName.trim()) {
      nextErrors.actorName = activeParticipationIdentity.actorNameError;
    }
    if (activeParticipationIdentity.showIdentificationFields && !participationForm.identificationType) {
      nextErrors.identificationType = 'Selecciona el tipo de identificación.';
    }
    if (activeParticipationIdentity.showIdentificationFields && !participationForm.identificationNumber.trim()) {
      nextErrors.identificationNumber = 'Escribe el número de identificación.';
    }
    if (isIndividualParticipation && participationForm.hasArtisticName && !participationForm.artisticName.trim()) {
      nextErrors.artisticName = 'Escribe el nombre artístico.';
    }
    if (activeParticipationIdentity.showResponsibleEntity && !participationForm.responsibleEntity.trim()) {
      nextErrors.responsibleEntity = 'Completa este campo.';
    }
    if (activeParticipationIdentity.showContactFields && !participationForm.contactName.trim()) {
      nextErrors.contactName = 'Indica una persona de contacto.';
    }
    if (activeParticipationIdentity.showContactFields && !participationForm.contactRole.trim()) {
      nextErrors.contactRole = 'Completa este campo.';
    }
    if (!participationForm.email.trim()) {
      nextErrors.email = 'Escribe un correo de contacto.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participationForm.email.trim())) {
      nextErrors.email = 'Escribe un correo válido.';
    }
    if (!participationForm.phone.trim()) {
      nextErrors.phone = 'Escribe un teléfono o celular.';
    } else if (!isValidPhone(participationForm.phone)) {
      nextErrors.phone = 'Usa solo números, espacios, +, paréntesis o guiones.';
    }
    OPTIONAL_URL_FIELDS.forEach((fieldKey) => {
      if (!isValidHttpUrl(participationForm[fieldKey] || '')) {
        nextErrors[fieldKey] = 'Escribe una URL válida que inicie con http:// o https://.';
      }
    });
    if (!participationForm.department) nextErrors.department = 'Selecciona un departamento.';
    if (!participationForm.municipality) nextErrors.municipality = 'Selecciona un municipio o ciudad.';
    if (activeParticipationIdentity.showTerritoryScope && !participationForm.territoryScope) {
      nextErrors.territoryScope = 'Selecciona el alcance territorial.';
    }
    if (activeParticipationIdentity.showRoleSection !== false && participationForm.roles.length === 0) {
      nextErrors.roles = 'Selecciona al menos una función dentro del ecosistema.';
    }
    if (isFestivalParticipation && !participationForm.festivalDurationDays) {
      nextErrors.festivalDurationDays = 'Indica cuántos días dura el festival.';
    }
    if (isFestivalParticipation && participationForm.festivalFrequency && participationForm.festivalHabitualMonths.length === 0) {
      nextErrors.festivalHabitualMonths = festivalUsesMultiMonthSelection
        ? 'Selecciona los meses en los que habitualmente se realiza.'
        : 'Selecciona el mes en el que habitualmente se realiza.';
    }
    if (isFestivalParticipation && participationForm.festivalVenueMode === 'Varias ciudades o municipios') {
      const additionalLocations = participationForm.festivalAdditionalLocations || [];
      const hasCompleteAdditionalLocation = additionalLocations.some((location) => location.department && location.municipality);
      const hasIncompleteAdditionalLocation = additionalLocations.some((location) => (location.department && !location.municipality) || (!location.department && location.municipality));

      if (!hasCompleteAdditionalLocation || hasIncompleteAdditionalLocation) {
        nextErrors.festivalAdditionalLocations = 'Agrega al menos una sede adicional completa con departamento y municipio.';
      }
    }
    if (isFestivalParticipation && ['Ya se realizó', 'Se va a realizar'].includes(participationForm.festivalThisYearStatus)) {
      if (festivalUsesDateRange) {
        if (!participationForm.festivalThisYearStartDate) nextErrors.festivalThisYearStartDate = 'Selecciona la fecha de inicio.';
        if (!participationForm.festivalThisYearEndDate) nextErrors.festivalThisYearEndDate = 'Selecciona la fecha de finalización.';
      } else if (!participationForm.festivalThisYearDate) {
        nextErrors.festivalThisYearDate = 'Selecciona la fecha.';
      }
    }
    if (isFestivalParticipation && participationForm.openCall === 'Sí' && participationForm.festivalThisYearStatus === 'Se va a realizar' && !participationForm.festivalCurrentOpenCall) {
      nextErrors.festivalCurrentOpenCall = 'Indica si actualmente tienen convocatoria abierta.';
    }
    if (isFestivalParticipation && participationForm.openCall === 'Sí' && participationForm.festivalThisYearStatus === 'Se va a realizar' && participationForm.festivalCurrentOpenCall === 'Sí' && !participationForm.festivalOpenCallDeadline) {
      nextErrors.festivalOpenCallDeadline = 'Selecciona la fecha exacta de cierre.';
    }
    if (isMarketParticipation && participationForm.marketFrequency && participationForm.marketHabitualMonths.length === 0) {
      nextErrors.marketHabitualMonths = marketUsesMultiMonthSelection
        ? 'Selecciona los meses en los que habitualmente se realiza.'
        : 'Selecciona el mes en el que habitualmente se realiza.';
    }
    if (isMarketParticipation && participationForm.linkedFestival === 'Sí' && !participationForm.linkedFestivalName.trim()) {
      nextErrors.linkedFestivalName = 'Escribe el festival con el que se articula.';
    }
    if (isMarketParticipation && participationForm.marketThisYearStatus === 'Se va a realizar' && !participationForm.marketThisYearMonth) {
      nextErrors.marketThisYearMonth = 'Selecciona el mes.';
    }
    if (isMarketParticipation && participationForm.marketThisYearStatus === 'Ya se realizó' && !participationForm.marketThisYearDate) {
      nextErrors.marketThisYearDate = 'Selecciona la fecha exacta.';
    }
    if (!participationForm.musicalFields.trim()) nextErrors.musicalFields = 'Completa este campo.';
    if (!participationForm.description.trim()) nextErrors.description = 'Describe brevemente el proceso o iniciativa.';
    if (!participationForm.contribution.trim()) nextErrors.contribution = 'Cuéntanos qué aporta tu proceso al ecosistema musical.';
    if (!isMarketParticipation && !participationForm.needs.trim()) nextErrors.needs = 'Completa este campo.';
    if (!participationForm.consent) nextErrors.consent = 'Debes autorizar el tratamiento de la información para continuar.';

    if (Object.keys(nextErrors).length > 0) {
      setParticipationErrors(nextErrors);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToElementWithOffset(participationSectionRef.current);
        });
      });
      return;
    }

    const reference = buildMapParticipationReference();
    const submissionPayload = normalizeParticipationPayload({
      ...participationForm,
      actorName: resolvedParticipationActorName,
      reference,
      submittedAt: new Date().toISOString(),
      actorTypeLabel: activeParticipationActor.label,
    });
    let nextQueue = [submissionPayload];

    if (typeof window !== 'undefined') {
      try {
        const storedQueue = JSON.parse(window.localStorage.getItem(MAP_PARTICIPATION_QUEUE_STORAGE_KEY) || '[]');
        nextQueue = [submissionPayload, ...storedQueue].slice(0, 500);
      } catch (error) {
        console.warn('No se pudo leer la cola local de participación:', error);
      }
    }

    setIsPersistingParticipation(true);

    try {
      const workbookResult = await persistMapParticipationWorkbook({
        submissionPayload,
        queuedRecords: nextQueue,
      });

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(MAP_PARTICIPATION_QUEUE_STORAGE_KEY, JSON.stringify(nextQueue));
          window.localStorage.removeItem(MAP_PARTICIPATION_DRAFT_STORAGE_KEY);
        } catch (error) {
          console.warn('No se pudo guardar la ficha de participación:', error);
        }
      }

      setLastParticipationSubmission({
        reference,
        actorName: resolvedParticipationActorName,
        actorTypeLabel: activeParticipationActor.label,
        department: participationForm.department,
        municipality: participationForm.municipality,
        workbookMessage: workbookResult.message,
        workbookFileName: workbookResult.fileName,
      });
      setParticipationWorkbookFeedback({
        type: 'success',
        message: workbookResult.message,
      });
      setParticipationErrors({});
      setParticipationForm(createMapParticipationFormState());

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollToElementWithOffset(participationSectionRef.current);
        });
      });
    } catch (error) {
      setParticipationWorkbookFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo guardar la ficha en el archivo Excel.',
      });
    } finally {
      setIsPersistingParticipation(false);
    }
  }, [activeParticipationActor.label, activeParticipationFields, activeParticipationIdentity, festivalUsesDateRange, festivalUsesMultiMonthSelection, isFestivalParticipation, isIndividualParticipation, isMarketParticipation, marketUsesMultiMonthSelection, participationForm, resolvedParticipationActorName]);

  const participationInputClassName = 'mt-3 w-full rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-[0.78rem] text-[#291242] outline-none transition-all focus:border-[#00DA5E]';
  const participationTextAreaClassName = `${participationInputClassName} min-h-[128px] resize-y`;
  const participationErrorClassName = 'mt-2 text-[0.68rem] text-rose-500';
  const ActiveParticipationIcon = activeParticipationActor.icon;
  const renderParticipationField = (field) => {
    const fieldId = `map-participation-${field.key}`;
    const fieldValue = participationForm[field.key] ?? '';

    return (
      <label key={field.key} htmlFor={fieldId} className={field.type === 'textarea' ? 'xl:col-span-2' : ''}>
        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{field.label}</span>
        {field.type === 'select' ? (
          <select
            id={fieldId}
            value={fieldValue}
            onChange={(event) => handleParticipationFieldChange(field.key, event.target.value)}
            className={participationInputClassName}
          >
            <option value="">Selecciona una opción</option>
            {field.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            id={fieldId}
            rows={field.rows || 4}
            value={fieldValue}
            onChange={(event) => handleParticipationFieldChange(field.key, event.target.value)}
            className={participationTextAreaClassName}
          />
        ) : (
          <input
            id={fieldId}
            type={field.type || 'text'}
            min={field.min}
            max={field.max}
            value={fieldValue}
            onChange={(event) => handleParticipationFieldChange(field.key, event.target.value)}
            className={participationInputClassName}
          />
        )}
        {participationErrors[field.key] && <p className={participationErrorClassName}>{participationErrors[field.key]}</p>}
      </label>
    );
  };
  const renderParticipationSpecificSection = () => (
    <ParticipationSpecificSection
      isIndividualParticipation={isIndividualParticipation}
      isFestivalParticipation={isFestivalParticipation}
      isMarketParticipation={isMarketParticipation}
      activeParticipationFields={activeParticipationFields}
      renderParticipationField={renderParticipationField}
      handleParticipationFieldChange={handleParticipationFieldChange}
      participationForm={participationForm}
      participationErrors={participationErrors}
      participationInputClassName={participationInputClassName}
      participationTextAreaClassName={participationTextAreaClassName}
      participationErrorClassName={participationErrorClassName}
      addFestivalLocation={addFestivalLocation}
      updateFestivalLocation={updateFestivalLocation}
      removeFestivalLocation={removeFestivalLocation}
      festivalUsesMultiMonthSelection={festivalUsesMultiMonthSelection}
      festivalUsesDateRange={festivalUsesDateRange}
      marketUsesMultiMonthSelection={marketUsesMultiMonthSelection}
    />
  );
  const renderParticipationRolesSection = () => {
    if (activeParticipationIdentity.showRoleSection === false) return null;

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          {isIndividualParticipation ? '4. Seleccione sus principales funciones dentro del ecosistema musical' : '3. Función dentro del ecosistema musical'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {activeParticipationRoleOptions.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleParticipationRole(role)}
              className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${participationForm.roles.includes(role) ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-white text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
            >
              {role}
            </button>
          ))}
        </div>
        {participationErrors.roles && <p className={participationErrorClassName}>{participationErrors.roles}</p>}
      </div>
    );
  };
  const renderParticipationNarrativeSection = () => {
    if (isMarketParticipation) {
      return (
        <div>
          <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">4. Descripción y aporte del mercado</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <label htmlFor="map-participation-description">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Descripción breve del mercado</span>
              <textarea
                id="map-participation-description"
                rows={4}
                value={participationForm.description}
                onChange={(event) => handleParticipationFieldChange('description', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.description && <p className={participationErrorClassName}>{participationErrors.description}</p>}
            </label>

            <label htmlFor="map-participation-contribution">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Qué aporta este mercado al ecosistema musical?</span>
              <textarea
                id="map-participation-contribution"
                rows={4}
                value={participationForm.contribution}
                onChange={(event) => handleParticipationFieldChange('contribution', event.target.value)}
                className={participationTextAreaClassName}
              />
              {participationErrors.contribution && <p className={participationErrorClassName}>{participationErrors.contribution}</p>}
            </label>
          </div>
        </div>
      );
    }

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
          {isIndividualParticipation ? '5. Trayectoria, aportes y proyección' : '5. Aportes y necesidades'}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <label htmlFor="map-participation-description">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isIndividualParticipation ? 'Cuéntenos brevemente sobre su trayectoria o recorrido en la música' : 'Descripción breve del proceso'}
            </span>
            <textarea
              id="map-participation-description"
              rows={4}
              value={participationForm.description}
              onChange={(event) => handleParticipationFieldChange('description', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.description && <p className={participationErrorClassName}>{participationErrors.description}</p>}
          </label>

          <label htmlFor="map-participation-contribution">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isIndividualParticipation ? '¿Cómo aporta su trabajo al ecosistema musical de su territorio o sector?' : 'Aporte al ecosistema musical del territorio'}
            </span>
            <textarea
              id="map-participation-contribution"
              rows={4}
              value={participationForm.contribution}
              onChange={(event) => handleParticipationFieldChange('contribution', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.contribution && <p className={participationErrorClassName}>{participationErrors.contribution}</p>}
          </label>

          <label htmlFor="map-participation-needs">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              {isIndividualParticipation ? '¿Qué apoyos, redes, oportunidades o conexiones le interesaría fortalecer?' : 'Necesidades, alianzas o expectativas frente al mapeo'}
            </span>
            <textarea
              id="map-participation-needs"
              rows={4}
              value={participationForm.needs}
              onChange={(event) => handleParticipationFieldChange('needs', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.needs && <p className={participationErrorClassName}>{participationErrors.needs}</p>}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen text-left relative overflow-x-hidden">
      <PageHero
        tag="Participación Abierta"
        title="Haz Parte del"
        titleAccent="Mapeo"
        description="Registra tu proceso dentro del ecosistema musical colombiano y comparte la información básica que ayudará a fortalecer la lectura territorial, la caracterización y la visibilidad del sector."
        bgImage="https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop"
        onBack={onBack}
      />

      <ContentWrapper className="!py-8" id="mapa-dashboard">
        <div ref={participationSectionRef} className="overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-[0.68fr_1.72fr]">
            <div className="relative overflow-hidden bg-[#291242] px-7 py-8 text-white xl:px-8 xl:py-9">
              <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-[#00DA5E]/15 blur-3xl" />
              <div className="relative">
                <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[0.55rem] font-bold uppercase tracking-[0.24em] text-[#8BF784]">Participación abierta</span>
                <h3 className="mt-6 font-alternate text-3xl font-bold uppercase leading-none">Haz parte del mapeo del ecosistema musical colombiano</h3>
                <p className="mt-5 max-w-md text-[0.84rem] leading-relaxed text-slate-300">Comparte la información básica de tu proceso para fortalecer la lectura territorial del sector musical. La ficha recoge tipología, función, territorio, capacidades y aportes, siguiendo la lógica de caracterización que ya usa el mapa ecosistémico.</p>

                <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/8 px-5 py-5">
                  <p className="text-[0.54rem] font-bold uppercase tracking-[0.2em] text-[#8BF784]">Antes de empezar</p>
                  <div className="mt-4 space-y-4">
                    {[
                      'Ten a mano los datos básicos de contacto y ubicación del registro.',
                      'Selecciona el actor principal desde el que quieres aparecer dentro del mapeo.',
                      'Al completar el formulario, la información queda lista para revisión y consolidación.',
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 px-2 text-[0.46rem] font-bold uppercase tracking-[0.16em] text-[#8BF784]">
                          0{index + 1}
                        </span>
                        <p className="text-[0.76rem] leading-relaxed text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {lastParticipationSubmission && (
                  <div className="mt-8 rounded-[2rem] border border-[#8BF784]/30 bg-[#00DA5E]/10 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="mt-0.5 text-[#8BF784] shrink-0" />
                      <div>
                        <p className="text-[0.54rem] font-bold uppercase tracking-[0.2em] text-[#8BF784]">Última ficha registrada</p>
                        <p className="mt-3 text-[0.9rem] font-bold text-white">{lastParticipationSubmission.actorName}</p>
                        <p className="mt-1 text-[0.75rem] text-slate-300">{lastParticipationSubmission.actorTypeLabel} · {lastParticipationSubmission.municipality}, {lastParticipationSubmission.department}</p>
                        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.18em] text-white/70">Referencia {lastParticipationSubmission.reference}</p>
                        {lastParticipationSubmission.workbookMessage && (
                          <p className="mt-3 text-[0.72rem] leading-relaxed text-slate-200">{lastParticipationSubmission.workbookMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50/80 px-6 py-8 xl:px-10 xl:py-10">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <p className="text-[0.54rem] font-bold uppercase tracking-[0.22em] text-slate-400">Subapartado del mapa ecosistémico</p>
                  <h4 className="mt-3 font-alternate text-2xl font-bold uppercase text-[#291242]">Formulario de participación</h4>
                  <p className="mt-3 max-w-2xl text-[0.78rem] leading-relaxed text-slate-500">Selecciona el tipo de actor y diligencia la ficha con la información mínima para visibilizar tu proceso dentro del mapeo y caracterización del ecosistema musical colombiano.</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-[#291242]">
                  <FileText size={18} />
                </div>
              </div>

              <form onSubmit={handleParticipationSubmit} className="mt-8 space-y-8">
                <div>
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">1. Selecciona el tipo de actor</p>
                  <div className="mt-4 space-y-4">
                    <div className="relative overflow-hidden rounded-[2.3rem] border border-[#291242]/10 bg-[#291242] px-6 py-6 text-white shadow-sm">
                      <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#8BF784]/18 blur-3xl" />
                      <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/8 blur-3xl" />
                      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/10 text-[#8BF784]">
                            <ActiveParticipationIcon size={22} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-[0.52rem] font-bold uppercase tracking-[0.22em] text-[#8BF784]">Selección activa</p>
                              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[0.48rem] font-bold uppercase tracking-[0.18em] text-white/80">
                                {activeParticipationActor.shortLabel}
                              </span>
                            </div>
                            <h5 className="mt-3 font-alternate text-[1.4rem] font-bold uppercase leading-tight text-white">{activeParticipationActor.label}</h5>
                            <p className="mt-4 max-w-[19rem] text-[0.78rem] leading-relaxed text-slate-300">{activeParticipationActor.description}</p>
                          </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-white/10 bg-white/8 px-5 py-5">
                          <p className="text-[0.5rem] font-bold uppercase tracking-[0.18em] text-[#8BF784]">Cómo usar esta selección</p>
                          <p className="mt-3 text-[0.74rem] leading-relaxed text-slate-300">Elige la opción que mejor represente el registro principal. Si una misma iniciativa cumple varios roles, prioriza la figura desde la que quieres aparecer dentro del mapeo.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {MAP_PARTICIPATION_ACTOR_OPTIONS.map((option, index) => {
                        const Icon = option.icon;
                        const isActive = participationForm.actorType === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleParticipationFieldChange('actorType', option.key)}
                            className={`group relative overflow-hidden rounded-[1.9rem] border px-4 py-4 text-left transition-all duration-300 ${isActive ? 'border-[#8BF784] bg-[#f8fff9] shadow-[0_16px_40px_rgba(0,0,0,0.06)]' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <div className={`absolute inset-x-0 top-0 h-1 transition-all ${isActive ? 'bg-[#00DA5E]' : 'bg-transparent group-hover:bg-slate-200'}`} />
                            <div className="relative">
                              <div className="flex items-start justify-between gap-3">
                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] transition-all ${isActive ? 'bg-[#291242] text-[#8BF784]' : 'bg-slate-100 text-[#291242] group-hover:bg-slate-200'}`}>
                                  <Icon size={18} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[0.46rem] font-bold uppercase tracking-[0.16em] ${isActive ? 'bg-[#291242] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {isActive ? 'Activo' : `0${index + 1}`}
                                  </span>
                                  {isActive && <CheckCircle2 size={16} className="text-[#00DA5E]" />}
                                </div>
                              </div>

                              <div className="mt-4">
                                <p className="font-alternate text-[0.95rem] font-bold uppercase tracking-[0.08em] text-[#291242]">{option.label}</p>
                                <p className="mt-2 text-[0.72rem] leading-relaxed text-slate-500">{option.description}</p>
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-[0.48rem] font-bold uppercase tracking-[0.18em] text-slate-400">{option.shortLabel}</span>
                                <span className={`text-[0.52rem] font-bold uppercase tracking-[0.16em] transition-colors ${isActive ? 'text-[#00DA5E]' : 'text-[#291242] group-hover:text-[#00DA5E]'}`}>
                                  {isActive ? 'Seleccionado' : 'Seleccionar'}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">2. Identificación y territorio</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {isIndividualParticipation ? (
                      <>
                        <label htmlFor="map-participation-first-name">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.firstNameLabel}</span>
                          <input
                            id="map-participation-first-name"
                            type="text"
                            value={participationForm.individualFirstName}
                            onChange={(event) => handleParticipationFieldChange('individualFirstName', event.target.value)}
                            className={participationInputClassName}
                            placeholder="Escribe los nombres"
                          />
                          {participationErrors.individualFirstName && <p className={participationErrorClassName}>{participationErrors.individualFirstName}</p>}
                        </label>

                        <label htmlFor="map-participation-last-name">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.lastNameLabel}</span>
                          <input
                            id="map-participation-last-name"
                            type="text"
                            value={participationForm.individualLastName}
                            onChange={(event) => handleParticipationFieldChange('individualLastName', event.target.value)}
                            className={participationInputClassName}
                            placeholder="Escribe los apellidos"
                          />
                          {participationErrors.individualLastName && <p className={participationErrorClassName}>{participationErrors.individualLastName}</p>}
                        </label>
                      </>
                    ) : (
                      <label htmlFor="map-participation-actor-name" className="xl:col-span-2">
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.actorNameLabel}</span>
                        <input
                          id="map-participation-actor-name"
                          type="text"
                          value={participationForm.actorName}
                          onChange={(event) => handleParticipationFieldChange('actorName', event.target.value)}
                          className={participationInputClassName}
                          placeholder={activeParticipationIdentity.actorNamePlaceholder}
                        />
                        {participationErrors.actorName && <p className={participationErrorClassName}>{participationErrors.actorName}</p>}
                      </label>
                    )}

                    {activeParticipationIdentity.showIdentificationFields && (
                      <>
                        <label htmlFor="map-participation-identification-type">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.identificationTypeLabel}</span>
                          <select
                            id="map-participation-identification-type"
                            value={participationForm.identificationType}
                            onChange={(event) => handleParticipationFieldChange('identificationType', event.target.value)}
                            className={participationInputClassName}
                          >
                            <option value="">Selecciona una opción</option>
                            {MAP_PARTICIPATION_IDENTIFICATION_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          {participationErrors.identificationType && <p className={participationErrorClassName}>{participationErrors.identificationType}</p>}
                        </label>

                        <label htmlFor="map-participation-identification-number">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.identificationNumberLabel}</span>
                          <input
                            id="map-participation-identification-number"
                            type="text"
                            value={participationForm.identificationNumber}
                            onChange={(event) => handleParticipationFieldChange('identificationNumber', event.target.value)}
                            className={participationInputClassName}
                            placeholder="Escribe el número de identificación"
                          />
                          {participationErrors.identificationNumber && <p className={participationErrorClassName}>{participationErrors.identificationNumber}</p>}
                        </label>
                      </>
                    )}

                    {activeParticipationIdentity.showResponsibleEntity && (
                      <label htmlFor="map-participation-responsible-entity">
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.responsibleEntityLabel}</span>
                        <input
                          id="map-participation-responsible-entity"
                          type="text"
                          value={participationForm.responsibleEntity}
                          onChange={(event) => handleParticipationFieldChange('responsibleEntity', event.target.value)}
                          className={participationInputClassName}
                          placeholder={activeParticipationIdentity.responsibleEntityPlaceholder}
                        />
                        {participationErrors.responsibleEntity && <p className={participationErrorClassName}>{participationErrors.responsibleEntity}</p>}
                      </label>
                    )}

                    {activeParticipationIdentity.showContactFields && (
                      <>
                        <label htmlFor="map-participation-contact-name">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.contactNameLabel}</span>
                          <input
                            id="map-participation-contact-name"
                            type="text"
                            value={participationForm.contactName}
                            onChange={(event) => handleParticipationFieldChange('contactName', event.target.value)}
                            className={participationInputClassName}
                          />
                          {participationErrors.contactName && <p className={participationErrorClassName}>{participationErrors.contactName}</p>}
                        </label>

                        <label htmlFor="map-participation-contact-role">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.contactRoleLabel}</span>
                          <input
                            id="map-participation-contact-role"
                            type="text"
                            value={participationForm.contactRole}
                            onChange={(event) => handleParticipationFieldChange('contactRole', event.target.value)}
                            className={participationInputClassName}
                          />
                          {participationErrors.contactRole && <p className={participationErrorClassName}>{participationErrors.contactRole}</p>}
                        </label>
                      </>
                    )}

                    <label htmlFor="map-participation-email">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Correo electrónico</span>
                      <input
                        id="map-participation-email"
                        type="email"
                        value={participationForm.email}
                        onChange={(event) => handleParticipationFieldChange('email', event.target.value)}
                        className={participationInputClassName}
                      />
                      {participationErrors.email && <p className={participationErrorClassName}>{participationErrors.email}</p>}
                    </label>

                    <label htmlFor="map-participation-phone">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Teléfono o celular</span>
                      <input
                        id="map-participation-phone"
                        type="text"
                        value={participationForm.phone}
                        onChange={(event) => handleParticipationFieldChange('phone', event.target.value)}
                        className={participationInputClassName}
                      />
                      {participationErrors.phone && <p className={participationErrorClassName}>{participationErrors.phone}</p>}
                    </label>

                    <label htmlFor="map-participation-department">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Departamento</span>
                      <select
                        id="map-participation-department"
                        value={participationForm.department}
                        onChange={(event) => handleParticipationFieldChange('department', event.target.value)}
                        className={participationInputClassName}
                      >
                        <option value="">Selecciona un departamento</option>
                        {getSortedDepartmentNames().map((department) => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                      {participationErrors.department && <p className={participationErrorClassName}>{participationErrors.department}</p>}
                    </label>

                    <label htmlFor="map-participation-municipality">
                      <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Municipio o ciudad</span>
                      <select
                        id="map-participation-municipality"
                        value={participationForm.municipality}
                        onChange={(event) => handleParticipationFieldChange('municipality', event.target.value)}
                        disabled={!participationForm.department}
                        className={`${participationInputClassName} disabled:cursor-not-allowed disabled:bg-slate-100`}
                      >
                        <option value="">{participationForm.department ? 'Selecciona un municipio' : 'Selecciona primero el departamento'}</option>
                        {participationMunicipalities.map((municipality) => (
                          <option key={municipality} value={municipality}>{municipality}</option>
                        ))}
                      </select>
                      {participationErrors.municipality && <p className={participationErrorClassName}>{participationErrors.municipality}</p>}
                    </label>

                    {activeParticipationIdentity.showTerritoryScope && (
                      <label htmlFor="map-participation-scope">
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Alcance territorial</span>
                        <select
                          id="map-participation-scope"
                          value={participationForm.territoryScope}
                          onChange={(event) => handleParticipationFieldChange('territoryScope', event.target.value)}
                          className={participationInputClassName}
                        >
                          <option value="">Selecciona una escala</option>
                          {MAP_PARTICIPATION_SCOPE_OPTIONS.map((scope) => (
                            <option key={scope} value={scope}>{scope}</option>
                          ))}
                        </select>
                        {participationErrors.territoryScope && <p className={participationErrorClassName}>{participationErrors.territoryScope}</p>}
                      </label>
                    )}

                    {activeParticipationIdentity.showWebsite && (
                      <>
                        <label htmlFor="map-participation-website">
                          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{activeParticipationIdentity.websiteLabel || 'Sitio web o red principal'}</span>
                          <input
                            id="map-participation-website"
                            type="url"
                            value={participationForm.website}
                            onChange={(event) => handleParticipationFieldChange('website', event.target.value)}
                            className={participationInputClassName}
                          />
                        </label>

                        {activeParticipationIdentity.showSocialFields && (
                          <>
                            <label htmlFor="map-participation-facebook">
                              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Facebook (opcional)</span>
                              <input
                                id="map-participation-facebook"
                                type="url"
                                value={participationForm.facebookUrl}
                                onChange={(event) => handleParticipationFieldChange('facebookUrl', event.target.value)}
                                className={participationInputClassName}
                              />
                            </label>

                            <label htmlFor="map-participation-instagram">
                              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Instagram (opcional)</span>
                              <input
                                id="map-participation-instagram"
                                type="url"
                                value={participationForm.instagramUrl}
                                onChange={(event) => handleParticipationFieldChange('instagramUrl', event.target.value)}
                                className={participationInputClassName}
                              />
                            </label>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isIndividualParticipation ? (
                  <>
                    {renderParticipationSpecificSection()}
                    {renderParticipationRolesSection()}
                    {renderParticipationNarrativeSection()}
                  </>
                ) : (
                  <>
                    {renderParticipationRolesSection()}
                    {renderParticipationSpecificSection()}
                    {renderParticipationNarrativeSection()}
                  </>
                )}

                <div className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5">
                  <label htmlFor="map-participation-consent" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id="map-participation-consent"
                      type="checkbox"
                      checked={participationForm.consent}
                      onChange={(event) => handleParticipationFieldChange('consent', event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#291242] focus:ring-[#00DA5E]"
                    />
                    <span className="text-[0.78rem] leading-relaxed text-slate-500">Autorizo el tratamiento de esta información para fines de caracterización, análisis territorial y contacto relacionado con el mapa ecosistémico del PNMC.</span>
                  </label>
                  {participationErrors.consent && <p className={participationErrorClassName}>{participationErrors.consent}</p>}
                </div>

                {participationWorkbookFeedback && (
                  <div
                    role={participationWorkbookFeedback.type === 'success' ? 'status' : 'alert'}
                    aria-live={participationWorkbookFeedback.type === 'success' ? 'polite' : 'assertive'}
                    className={`rounded-[1.6rem] border px-5 py-4 ${participationWorkbookFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
                  >
                    <p className={`text-[0.74rem] leading-relaxed ${participationWorkbookFeedback.type === 'success' ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {participationWorkbookFeedback.message}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 lg:flex-row lg:items-center lg:justify-between">
                  <p className="max-w-2xl text-[0.72rem] leading-relaxed text-slate-500">Mientras diligencias la ficha, el formulario guarda un borrador local en este navegador. Al registrar, la información se envía automáticamente a la base <span className="font-bold text-[#291242]">{MAP_PARTICIPATION_WORKBOOK_FILE_NAME}</span> del proyecto cuando la web está corriendo en el servidor local.</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" onClick={resetParticipationForm} variant="outlineDark" className="px-6 py-3 text-[0.66rem]">Limpiar ficha</Button>
                    <Button type="submit" variant="secondary" className="px-7 py-3 text-[0.66rem]" icon={isPersistingParticipation ? Loader2 : Send} disabled={isPersistingParticipation}>
                      {isPersistingParticipation ? 'Guardando...' : 'Registrar información'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};


export { MapaParticipaPage };
