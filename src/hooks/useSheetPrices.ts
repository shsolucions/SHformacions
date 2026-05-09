import { useState, useEffect } from 'react';
import { getSheetPrices, type SheetPrice } from '../services/sheetsService';

let globalPrices: SheetPrice[] = [];
let globalLoaded = false;
const listeners: Array<() => void> = [];

getSheetPrices().then(prices => {
  globalPrices = prices;
  globalLoaded = true;
  listeners.forEach(fn => fn());
}).catch(() => { globalLoaded = true; });

// Normalitza per al matching (igual que a sheetsService)
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function score(sheetName: string, dbName: string): number {
  const sn = norm(sheetName);
  const dn = norm(dbName);
  if (sn === dn) return 100;
  if (sn.includes(dn) || dn.includes(sn)) return 80;
  const stop = new Set(['a','de','del','la','les','el','els','i','per','al','als','un','una','en','amb']);
  const sw = sn.split(' ').filter(w => w.length > 1 && !stop.has(w));
  const dw = dn.split(' ').filter(w => w.length > 1 && !stop.has(w));
  if (!sw.length || !dw.length) return 0;
  const common = sw.filter(w => dw.includes(w)).length;
  return Math.round((common / Math.max(sw.length, dw.length)) * 60);
}

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
    let bestScore = 0;
    let bestPrice = fallback;
    for (const p of prices) {
      const s = score(p.name, courseName);
      if (s > bestScore && s >= 50) { bestScore = s; bestPrice = p.price; }
    }
    return bestPrice;
  };

  return { prices, getPrice, loaded: globalLoaded };
}
