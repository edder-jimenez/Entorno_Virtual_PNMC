import { useEffect, useState } from 'react';
import { fetchDivipolaGrouped } from '../../services/data/index.js';
import {
  getRuntimeDivipolaByDepartment,
  setRuntimeDivipolaByDepartment,
} from '../../features/map/domain/mapDomain.js';

const useDivipolaSync = () => {
  const [, setDivipolaSnapshot] = useState(() => getRuntimeDivipolaByDepartment());

  useEffect(() => {
    let active = true;

    const syncDivipola = async () => {
      try {
        const grouped = await fetchDivipolaGrouped();
        if (!active) return;
        setRuntimeDivipolaByDepartment(grouped);
        setDivipolaSnapshot(grouped);
      } catch (error) {
        console.warn('No se pudo sincronizar DIVIPOLA desde backend:', error);
      }
    };

    syncDivipola();

    return () => {
      active = false;
    };
  }, []);
};

export { useDivipolaSync };
