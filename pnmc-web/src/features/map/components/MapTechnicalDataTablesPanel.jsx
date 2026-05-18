import React from 'react';
import { ArrowUp, Search, SortAsc } from 'lucide-react';

const MapTechnicalDataTablesPanel = ({
  selectedDept,
  formatMetricValue,
  filteredTechnicalDepartmentRows,
  technicalDepartmentQuery,
  setTechnicalDepartmentQuery,
  technicalMatrixSortKey,
  setTechnicalMatrixSortKey,
  technicalMatrixSortOptions,
  technicalMatrixSortDirection,
  setTechnicalMatrixSortDirection,
  technicalDepartmentColumns,
  handleDepartmentDrilldown,
  activeCategory,
  formatDataCellValue,
  isGeneralLayer,
  technicalRecordsTitle,
  filteredTechnicalRecordRows,
  technicalRecordRows,
  technicalRecordQuery,
  setTechnicalRecordQuery,
  technicalRecordSortKey,
  setTechnicalRecordSortKey,
  technicalRecordSortOptions,
  technicalRecordSortDirection,
  setTechnicalRecordSortDirection,
  technicalRecordFocusOptions,
  technicalRecordFocus,
  setTechnicalRecordFocus,
  technicalRecordColumns,
}) => {
  return (
    <>
      <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Matriz territorial</p>
            <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">Lectura por departamento</h4>
          </div>
          <span className="px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            {selectedDept === 'Nacional' ? `${formatMetricValue(filteredTechnicalDepartmentRows.length)} filas` : 'Territorio filtrado'}
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] gap-3 mb-6">
          <label className="relative block">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={technicalDepartmentQuery}
              onChange={(event) => setTechnicalDepartmentQuery(event.target.value)}
              placeholder="Buscar departamento"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
            />
          </label>
          <div className="relative">
            <SortAsc size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <select
              value={technicalMatrixSortKey}
              onChange={(event) => setTechnicalMatrixSortKey(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
            >
              {technicalMatrixSortOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setTechnicalMatrixSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[#291242] text-[0.58rem] font-bold uppercase tracking-[0.16em] hover:border-[#8BF784] transition-all"
          >
            <ArrowUp size={14} className={technicalMatrixSortDirection === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            {technicalMatrixSortDirection === 'desc' ? 'Desc' : 'Asc'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                {technicalDepartmentColumns.map((column) => (
                  <th key={column.key} className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTechnicalDepartmentRows.map((row) => (
                <tr key={row.departmentKey} className="border-b border-slate-100 last:border-b-0">
                  {technicalDepartmentColumns.map((column, index) => (
                    <td key={column.key} className={`px-4 py-3.5 text-[0.74rem] text-slate-500 whitespace-nowrap ${index === 0 ? 'font-bold text-[#291242]' : ''}`}>
                      {index === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDepartmentDrilldown(row.departmentKey, activeCategory)}
                          className="font-alternate text-[0.84rem] font-bold uppercase tracking-[0.06em] text-[#291242] hover:text-[#00DA5E] transition-colors"
                        >
                          {row.departmentLabel}
                        </button>
                      ) : (
                        formatDataCellValue(row[column.key])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTechnicalDepartmentRows.length === 0 && (
          <div className="mt-4 rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
            <p className="text-[0.78rem] text-slate-500 leading-relaxed">No hay departamentos que coincidan con la búsqueda actual.</p>
          </div>
        )}
      </div>

      {!isGeneralLayer && (
        <div className="bg-white rounded-[2.5rem] p-7 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[0.5rem] font-bold uppercase tracking-[0.28em] text-slate-400">Registros visibles</p>
              <h4 className="font-alternate text-xl font-bold uppercase text-[#291242] mt-3">{technicalRecordsTitle}</h4>
            </div>
            <span className="px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-slate-500">
              {formatMetricValue(filteredTechnicalRecordRows.length)} / {formatMetricValue(technicalRecordRows.length)} registros
            </span>
          </div>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_auto] gap-3">
              <label className="relative block">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  value={technicalRecordQuery}
                  onChange={(event) => setTechnicalRecordQuery(event.target.value)}
                  placeholder="Buscar por nombre, territorio o dato visible"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
                />
              </label>
              <div className="relative">
                <SortAsc size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <select
                  value={technicalRecordSortKey}
                  onChange={(event) => setTechnicalRecordSortKey(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-3 text-[0.72rem] text-[#291242] outline-none focus:border-[#8BF784]"
                >
                  {technicalRecordSortOptions.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setTechnicalRecordSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[#291242] text-[0.58rem] font-bold uppercase tracking-[0.16em] hover:border-[#8BF784] transition-all"
              >
                <ArrowUp size={14} className={technicalRecordSortDirection === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                {technicalRecordSortDirection === 'desc' ? 'Desc' : 'Asc'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {technicalRecordFocusOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTechnicalRecordFocus(option.key)}
                  className={`px-3 py-2 rounded-full text-[0.5rem] font-bold uppercase tracking-[0.14em] transition-all ${
                    technicalRecordFocus === option.key
                      ? 'bg-[#291242] text-white border border-[#291242]'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-[#8BF784] hover:text-[#291242]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  {technicalRecordColumns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTechnicalRecordRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    {technicalRecordColumns.map((column, index) => (
                      <td key={column.key} className={`px-4 py-3.5 text-[0.74rem] text-slate-500 whitespace-nowrap ${index === 0 ? 'font-medium text-[#291242]' : ''}`}>
                        {formatDataCellValue(row[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTechnicalRecordRows.length === 0 && (
            <div className="mt-4 rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
              <p className="text-[0.78rem] text-slate-500 leading-relaxed">No hay registros visibles que coincidan con los filtros aplicados.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export { MapTechnicalDataTablesPanel };
