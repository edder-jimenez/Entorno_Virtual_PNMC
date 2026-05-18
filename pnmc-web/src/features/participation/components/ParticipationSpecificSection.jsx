import React from 'react';
import { getSortedDepartmentNames } from '../../map/domain/mapDomain.js';
import {
  MAP_PARTICIPATION_MONTH_OPTIONS,
  getMapParticipationMunicipalities,
} from '../domain/participationFormConfig.js';

const ParticipationSpecificSection = ({
  isIndividualParticipation,
  isFestivalParticipation,
  isMarketParticipation,
  activeParticipationFields,
  renderParticipationField,
  handleParticipationFieldChange,
  participationForm,
  participationErrors,
  participationInputClassName,
  participationTextAreaClassName,
  participationErrorClassName,
  addFestivalLocation,
  updateFestivalLocation,
  removeFestivalLocation,
  festivalUsesMultiMonthSelection,
  festivalUsesDateRange,
  marketUsesMultiMonthSelection,
}) => {
  if (isIndividualParticipation) {
    const profileField = activeParticipationFields.find((field) => field.key === 'individualProfile');
    const trajectoryField = activeParticipationFields.find((field) => field.key === 'trajectoryYears');
    const linkedProcessesField = activeParticipationFields.find((field) => field.key === 'linkedProcesses');

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">3. Información específica del registro individual</p>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {profileField && renderParticipationField(profileField)}

          <div className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4 xl:col-span-2">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Tiene un nombre artístico diferente a su nombre real?</span>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'Sí', value: true },
                { label: 'No', value: false },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleParticipationFieldChange('hasArtisticName', option.value)}
                  className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${participationForm.hasArtisticName === option.value ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {participationForm.hasArtisticName && (
            <label htmlFor="map-participation-artistic-name" className="xl:col-span-2">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Nombre artístico</span>
              <input
                id="map-participation-artistic-name"
                type="text"
                value={participationForm.artisticName}
                onChange={(event) => handleParticipationFieldChange('artisticName', event.target.value)}
                className={participationInputClassName}
                placeholder="Escribe el nombre artístico"
              />
              {participationErrors.artisticName && <p className={participationErrorClassName}>{participationErrors.artisticName}</p>}
            </label>
          )}

          {trajectoryField && renderParticipationField(trajectoryField)}
          {linkedProcessesField && renderParticipationField(linkedProcessesField)}

          <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Áreas, prácticas o énfasis de trabajo musical</span>
            <textarea
              id="map-participation-musical-fields"
              rows={4}
              value={participationForm.musicalFields}
              onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
          </label>
        </div>
      </div>
    );
  }

  if (isFestivalParticipation) {
    const festivalDurationField = activeParticipationFields.find((field) => field.key === 'festivalDurationDays');
    const festivalSettingField = activeParticipationFields.find((field) => field.key === 'festivalSetting');
    const festivalVenueModeField = activeParticipationFields.find((field) => field.key === 'festivalVenueMode');
    const festivalFrequencyField = activeParticipationFields.find((field) => field.key === 'festivalFrequency');
    const festivalVersionsField = activeParticipationFields.find((field) => field.key === 'festivalVersions');
    const festivalTicketingField = activeParticipationFields.find((field) => field.key === 'festivalTicketing');
    const openCallField = activeParticipationFields.find((field) => field.key === 'openCall');
    const festivalThisYearStatusField = activeParticipationFields.find((field) => field.key === 'festivalThisYearStatus');
    const festivalDateLabel = participationForm.festivalThisYearStatus === 'Ya se realizó'
      ? 'Fecha exacta en la que se realizó'
      : 'Fecha exacta en la que se realizará';
    const festivalStartDateLabel = participationForm.festivalThisYearStatus === 'Ya se realizó'
      ? 'Fecha de inicio en la que se realizó'
      : 'Fecha de inicio programada';
    const festivalEndDateLabel = participationForm.festivalThisYearStatus === 'Ya se realizó'
      ? 'Fecha de finalización en la que se realizó'
      : 'Fecha de finalización programada';

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">4. Información específica del festival</p>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {festivalDurationField && renderParticipationField(festivalDurationField)}
          {festivalSettingField && renderParticipationField(festivalSettingField)}
          {festivalVenueModeField && renderParticipationField(festivalVenueModeField)}
          {festivalFrequencyField && renderParticipationField(festivalFrequencyField)}
          {festivalVersionsField && renderParticipationField(festivalVersionsField)}
          {festivalTicketingField && renderParticipationField(festivalTicketingField)}

          {participationForm.festivalVenueMode === 'Varias ciudades o municipios' && (
            <div className="xl:col-span-2 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Sedes adicionales del festival</span>
                  <p className="mt-2 max-w-2xl text-[0.72rem] leading-relaxed text-slate-500">La ubicación principal ya quedó registrada arriba. Agrega aquí las otras ciudades o municipios donde también se realiza el festival.</p>
                </div>
                <button
                  type="button"
                  onClick={addFestivalLocation}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[0.52rem] font-bold uppercase tracking-[0.16em] text-[#291242] transition-all hover:border-[#8BF784] hover:text-[#00DA5E]"
                >
                  Agregar sede
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {(participationForm.festivalAdditionalLocations || []).map((location, index) => {
                  const locationMunicipalities = getMapParticipationMunicipalities(location.department);

                  return (
                    <div key={`festival-location-${index}`} className="grid grid-cols-1 gap-4 rounded-[1.2rem] border border-slate-200 bg-slate-50/70 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                      <label htmlFor={`map-participation-festival-location-department-${index}`}>
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Departamento</span>
                        <select
                          id={`map-participation-festival-location-department-${index}`}
                          value={location.department}
                          onChange={(event) => updateFestivalLocation(index, 'department', event.target.value)}
                          className={participationInputClassName}
                        >
                          <option value="">Selecciona un departamento</option>
                          {getSortedDepartmentNames().map((department) => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      </label>

                      <label htmlFor={`map-participation-festival-location-municipality-${index}`}>
                        <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Municipio o ciudad</span>
                        <select
                          id={`map-participation-festival-location-municipality-${index}`}
                          value={location.municipality}
                          onChange={(event) => updateFestivalLocation(index, 'municipality', event.target.value)}
                          disabled={!location.department}
                          className={`${participationInputClassName} disabled:cursor-not-allowed disabled:bg-slate-100`}
                        >
                          <option value="">{location.department ? 'Selecciona un municipio' : 'Selecciona primero el departamento'}</option>
                          {locationMunicipalities.map((municipality) => (
                            <option key={municipality} value={municipality}>{municipality}</option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeFestivalLocation(index)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-[0.5rem] font-bold uppercase tracking-[0.16em] text-slate-500 transition-all hover:border-rose-200 hover:text-rose-500"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                })}
              </div>

              {participationErrors.festivalAdditionalLocations && <p className={participationErrorClassName}>{participationErrors.festivalAdditionalLocations}</p>}
            </div>
          )}

          {participationForm.festivalFrequency && (
            festivalUsesMultiMonthSelection ? (
              <div className="xl:col-span-2 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Meses en los que habitualmente se realiza</span>
                <div className="mt-4 flex flex-wrap gap-2">
                  {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => {
                    const isSelected = participationForm.festivalHabitualMonths.includes(month);

                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleParticipationFieldChange('festivalHabitualMonths', (current = []) => (
                          current.includes(month)
                            ? current.filter((item) => item !== month)
                            : [...current, month]
                        ))}
                        className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${isSelected ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
                {participationErrors.festivalHabitualMonths && <p className={participationErrorClassName}>{participationErrors.festivalHabitualMonths}</p>}
              </div>
            ) : (
              <label htmlFor="map-participation-festival-habitual-month">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Mes en el que habitualmente se realiza</span>
                <select
                  id="map-participation-festival-habitual-month"
                  value={participationForm.festivalHabitualMonths[0] || ''}
                  onChange={(event) => handleParticipationFieldChange('festivalHabitualMonths', event.target.value ? [event.target.value] : [])}
                  className={participationInputClassName}
                >
                  <option value="">Selecciona un mes</option>
                  {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                {participationErrors.festivalHabitualMonths && <p className={participationErrorClassName}>{participationErrors.festivalHabitualMonths}</p>}
              </label>
            )
          )}

          {openCallField && renderParticipationField(openCallField)}
          {festivalThisYearStatusField && renderParticipationField(festivalThisYearStatusField)}

          {participationForm.openCall === 'Sí' && participationForm.festivalThisYearStatus === 'Se va a realizar' && (
            <>
              <label htmlFor="map-participation-festival-current-open-call">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Actualmente tienen convocatoria abierta?</span>
                <select
                  id="map-participation-festival-current-open-call"
                  value={participationForm.festivalCurrentOpenCall}
                  onChange={(event) => handleParticipationFieldChange('festivalCurrentOpenCall', event.target.value)}
                  className={participationInputClassName}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
                {participationErrors.festivalCurrentOpenCall && <p className={participationErrorClassName}>{participationErrors.festivalCurrentOpenCall}</p>}
              </label>

              {participationForm.festivalCurrentOpenCall === 'Sí' && (
                <label htmlFor="map-participation-festival-open-call-deadline">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">¿Hasta qué fecha estará abierta?</span>
                  <input
                    id="map-participation-festival-open-call-deadline"
                    type="date"
                    value={participationForm.festivalOpenCallDeadline}
                    onChange={(event) => handleParticipationFieldChange('festivalOpenCallDeadline', event.target.value)}
                    className={participationInputClassName}
                  />
                  {participationErrors.festivalOpenCallDeadline && <p className={participationErrorClassName}>{participationErrors.festivalOpenCallDeadline}</p>}
                </label>
              )}
            </>
          )}

          {['Ya se realizó', 'Se va a realizar'].includes(participationForm.festivalThisYearStatus) && (
            festivalUsesDateRange ? (
              <>
                <label htmlFor="map-participation-festival-this-year-start-date">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{festivalStartDateLabel}</span>
                  <input
                    id="map-participation-festival-this-year-start-date"
                    type="date"
                    value={participationForm.festivalThisYearStartDate}
                    onChange={(event) => handleParticipationFieldChange('festivalThisYearStartDate', event.target.value)}
                    className={participationInputClassName}
                  />
                  {participationErrors.festivalThisYearStartDate && <p className={participationErrorClassName}>{participationErrors.festivalThisYearStartDate}</p>}
                </label>

                <label htmlFor="map-participation-festival-this-year-end-date">
                  <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{festivalEndDateLabel}</span>
                  <input
                    id="map-participation-festival-this-year-end-date"
                    type="date"
                    value={participationForm.festivalThisYearEndDate}
                    onChange={(event) => handleParticipationFieldChange('festivalThisYearEndDate', event.target.value)}
                    className={participationInputClassName}
                  />
                  {participationErrors.festivalThisYearEndDate && <p className={participationErrorClassName}>{participationErrors.festivalThisYearEndDate}</p>}
                </label>
              </>
            ) : (
              <label htmlFor="map-participation-festival-this-year-date">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">{festivalDateLabel}</span>
                <input
                  id="map-participation-festival-this-year-date"
                  type="date"
                  value={participationForm.festivalThisYearDate}
                  onChange={(event) => handleParticipationFieldChange('festivalThisYearDate', event.target.value)}
                  className={participationInputClassName}
                />
                {participationErrors.festivalThisYearDate && <p className={participationErrorClassName}>{participationErrors.festivalThisYearDate}</p>}
              </label>
            )
          )}

          <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Enfoques, géneros o líneas curatoriales del festival</span>
            <textarea
              id="map-participation-musical-fields"
              rows={4}
              value={participationForm.musicalFields}
              onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
          </label>
        </div>
      </div>
    );
  }

  if (isMarketParticipation) {
    const marketFrequencyField = activeParticipationFields.find((field) => field.key === 'marketFrequency');
    const marketEditionsCountField = activeParticipationFields.find((field) => field.key === 'marketEditionsCount');
    const averageBuyersField = activeParticipationFields.find((field) => field.key === 'averageBuyers');
    const linkedFestivalField = activeParticipationFields.find((field) => field.key === 'linkedFestival');
    const marketThisYearStatusField = activeParticipationFields.find((field) => field.key === 'marketThisYearStatus');

    return (
      <div>
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">3. Información específica del mercado</p>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {marketFrequencyField && renderParticipationField(marketFrequencyField)}
          {marketEditionsCountField && renderParticipationField(marketEditionsCountField)}
          {averageBuyersField && renderParticipationField(averageBuyersField)}

          {participationForm.marketFrequency && (
            marketUsesMultiMonthSelection ? (
              <div className="xl:col-span-2 rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Meses en los que habitualmente se realiza</span>
                <div className="mt-4 flex flex-wrap gap-2">
                  {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => {
                    const isSelected = participationForm.marketHabitualMonths.includes(month);

                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleParticipationFieldChange('marketHabitualMonths', (current = []) => (
                          current.includes(month)
                            ? current.filter((item) => item !== month)
                            : [...current, month]
                        ))}
                        className={`rounded-full px-4 py-2 text-[0.56rem] font-bold uppercase tracking-[0.14em] transition-all ${isSelected ? 'border border-[#291242] bg-[#291242] text-white' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#8BF784] hover:text-[#291242]'}`}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
                {participationErrors.marketHabitualMonths && <p className={participationErrorClassName}>{participationErrors.marketHabitualMonths}</p>}
              </div>
            ) : (
              <label htmlFor="map-participation-market-habitual-month">
                <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Mes en el que habitualmente se realiza</span>
                <select
                  id="map-participation-market-habitual-month"
                  value={participationForm.marketHabitualMonths[0] || ''}
                  onChange={(event) => handleParticipationFieldChange('marketHabitualMonths', event.target.value ? [event.target.value] : [])}
                  className={participationInputClassName}
                >
                  <option value="">Selecciona un mes</option>
                  {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                {participationErrors.marketHabitualMonths && <p className={participationErrorClassName}>{participationErrors.marketHabitualMonths}</p>}
              </label>
            )
          )}

          {linkedFestivalField && renderParticipationField(linkedFestivalField)}

          {participationForm.linkedFestival === 'Sí' && (
            <label htmlFor="map-participation-linked-festival-name">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">En caso de haber respondido sí, ¿con cuál festival se articula?</span>
              <input
                id="map-participation-linked-festival-name"
                type="text"
                value={participationForm.linkedFestivalName}
                onChange={(event) => handleParticipationFieldChange('linkedFestivalName', event.target.value)}
                className={participationInputClassName}
                placeholder="Escribe el nombre del festival"
              />
              {participationErrors.linkedFestivalName && <p className={participationErrorClassName}>{participationErrors.linkedFestivalName}</p>}
            </label>
          )}

          {marketThisYearStatusField && renderParticipationField(marketThisYearStatusField)}

          {participationForm.marketThisYearStatus === 'Se va a realizar' && (
            <label htmlFor="map-participation-market-this-year-month">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">En que mes se va a realizar?</span>
              <select
                id="map-participation-market-this-year-month"
                value={participationForm.marketThisYearMonth}
                onChange={(event) => handleParticipationFieldChange('marketThisYearMonth', event.target.value)}
                className={participationInputClassName}
              >
                <option value="">Selecciona un mes</option>
                {MAP_PARTICIPATION_MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              {participationErrors.marketThisYearMonth && <p className={participationErrorClassName}>{participationErrors.marketThisYearMonth}</p>}
            </label>
          )}

          {participationForm.marketThisYearStatus === 'Ya se realizó' && (
            <label htmlFor="map-participation-market-this-year-date">
              <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Fecha exacta en la que se realizó</span>
              <input
                id="map-participation-market-this-year-date"
                type="date"
                value={participationForm.marketThisYearDate}
                onChange={(event) => handleParticipationFieldChange('marketThisYearDate', event.target.value)}
                className={participationInputClassName}
              />
              {participationErrors.marketThisYearDate && <p className={participationErrorClassName}>{participationErrors.marketThisYearDate}</p>}
            </label>
          )}

          <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
            <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Enfoques, géneros o líneas del mercado</span>
            <textarea
              id="map-participation-musical-fields"
              rows={4}
              value={participationForm.musicalFields}
              onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
              className={participationTextAreaClassName}
            />
            {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
          </label>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">4. Información específica del tipo de actor</p>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {activeParticipationFields.map((field) => renderParticipationField(field))}
        <label htmlFor="map-participation-musical-fields" className="xl:col-span-2">
          <span className="text-[0.56rem] font-bold uppercase tracking-[0.18em] text-slate-400">Prácticas, géneros o líneas de trabajo</span>
          <input
            id="map-participation-musical-fields"
            type="text"
            value={participationForm.musicalFields}
            onChange={(event) => handleParticipationFieldChange('musicalFields', event.target.value)}
            className={participationInputClassName}
          />
          {participationErrors.musicalFields && <p className={participationErrorClassName}>{participationErrors.musicalFields}</p>}
        </label>
      </div>
    </div>
  );
};

export { ParticipationSpecificSection };
