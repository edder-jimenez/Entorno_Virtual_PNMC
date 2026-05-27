import React from 'react';
import { FileInput, FileText, Keyboard, Sparkles } from 'lucide-react';
import { RECORD_CREATION_OPTIONS } from '../domain/moduleActions.js';

const OPTION_META = {
  [RECORD_CREATION_OPTIONS.manual]: {
    label: 'Crear manualmente',
    description: 'Completar el formulario desde cero.',
    icon: Keyboard,
  },
  [RECORD_CREATION_OPTIONS.guided]: {
    label: 'Crear con asistente',
    description: 'Construir un borrador guiado para revisar antes de guardar.',
    icon: Sparkles,
  },
  [RECORD_CREATION_OPTIONS.importTemplate]: {
    label: 'Importar plantilla',
    description: 'Cargar una plantilla estructurada del módulo.',
    icon: FileInput,
  },
  [RECORD_CREATION_OPTIONS.extractDocument]: {
    label: 'Extraer desde documento',
    description: 'Sugerir campos iniciales desde un archivo permitido.',
    icon: FileText,
  },
};

export const CreateRecordLauncher = ({
  options = [RECORD_CREATION_OPTIONS.manual],
  onSelect,
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {options.map((option) => {
      const meta = OPTION_META[option] || OPTION_META[RECORD_CREATION_OPTIONS.manual];
      const Icon = meta.icon;
      return (
        <button
          key={option}
          type="button"
          onClick={() => onSelect?.(option)}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#291242] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00DA5E]"
        >
          <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#291242]">
            <Icon size={15} />
          </span>
          <span className="block text-sm font-black text-slate-900">{meta.label}</span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-500">{meta.description}</span>
        </button>
      );
    })}
  </div>
);

export default CreateRecordLauncher;
