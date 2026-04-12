import { useState, useEffect } from 'react';
import { getSheetPrices, type SheetPrice } from '../services/sheetsService';

// Hook global per preus del Sheets - llegit una sola vegada per tota l'app
let globalPrices: SheetPrice[] = [];
let globalLoaded = false;
const listeners: Array<() => void> = [];

getSheetPrices().then(prices => {
  globalPrices = prices;
  globalLoaded = true;
  listeners.forEach(fn => fn());
}).catch(() => { globalLoaded = true; });

export function useSheetPrices() {
  const [prices, setPrices] = useState<SheetPrice[]>(globalPrices);

  useEffect(() => {
    if (globalLoaded) { setPrices(globalPrices); return; }
    const update = () => setPrices(globalPrices);
    listeners.push(update);
    return () => { const i = listeners.indexOf(update); if (i >= 0) listeners.splice(i, 1); };
  }, []);

  const getPrice = (courseName: string, fallback: number): number => {
    if (!prices.length) return fallback;
    const name = courseName.toLowerCase().trim();
    const match = prices.find(p => {
      const pn = p.name.toLowerCase().trim();
      return pn === name || pn.includes(name) || name.includes(pn);
    });
    return match ? match.price : fallback;
  };

  return { prices, getPrice, loaded: globalLoaded };
}
