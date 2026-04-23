import React from 'react';
import { Card } from './Card.jsx';

export const MetricCard = ({ label, value, helper, className = '' }) => (
  <Card className={`space-y-3 ${className}`.trim()}>
    <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="font-gregor text-4xl leading-none text-[#291242]">{value}</p>
    {helper && <p className="text-[0.75rem] text-slate-500">{helper}</p>}
  </Card>
);

export default MetricCard;
