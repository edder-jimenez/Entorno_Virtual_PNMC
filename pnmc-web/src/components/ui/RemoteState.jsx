import React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export const LoadingState = ({ title = 'Cargando información…', description = 'Estamos preparando los datos.' }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
    <Loader2 className="mx-auto mb-3 animate-spin text-[#291242]" size={22} />
    <h3 className="font-alternate text-[0.8rem] font-bold uppercase tracking-[0.12em] text-[#291242]">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
  </div>
);

export const ErrorState = ({
  title = 'No pudimos cargar esta sección',
  description = 'Intenta nuevamente en unos segundos.',
  code = '',
  details = '',
  onRetry,
}) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
    <AlertCircle className="mx-auto mb-3 text-rose-700" size={22} />
    {code && (
      <p className="mb-2 inline-flex rounded-full border border-rose-200 bg-white px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-rose-800">
        {code}
      </p>
    )}
    <h3 className="font-alternate text-[0.8rem] font-bold uppercase tracking-[0.12em] text-rose-900">{title}</h3>
    <p className="mt-2 whitespace-pre-line text-sm text-rose-700">{description}</p>
    {details && (
      <p className="mt-3 rounded-xl border border-rose-100 bg-white px-3 py-2 text-left font-mono text-xs leading-relaxed text-rose-800">
        {details}
      </p>
    )}
    {onRetry && (
      <Button variant="soft" className="mt-4" onClick={onRetry} icon={RefreshCw}>
        Reintentar
      </Button>
    )}
  </div>
);

export const EmptyState = ({
  title = 'No hay resultados todavía',
  description = 'Prueba otro filtro o vuelve más tarde.',
}) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-center">
    <h3 className="font-alternate text-[0.8rem] font-bold uppercase tracking-[0.12em] text-slate-600">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{description}</p>
  </div>
);
