export type OrderFeature = {
  id: string;
  label: string;
  price: number;
  necessary: boolean;
};

export const ORDER_BASE_PRICE = 700;

export const ORDER_FEATURES: OrderFeature[] = [
  { id: 'nps', label: 'NPS', price: 50, necessary: false },
  { id: 'npse', label: 'NPSE', price: 50, necessary: false },
  { id: 'recording', label: 'Recording', price: 50, necessary: false },
  { id: 'reca', label: 'Recording Analysis', price: 50, necessary: false },
  { id: 'statea', label: 'State Analysis', price: 50, necessary: true },
  { id: 'aisp', label: 'AISP', price: 50, necessary: false },
  { id: 'badl', label: 'Bad List', price: 50, necessary: false },
  { id: 'wevents', label: 'Weekly Events', price: 50, necessary: true },
  { id: 'wave', label: 'Wave International', price: 50, necessary: false },
  { id: 'hwsmp', label: 'HW Basic', price: 50, necessary: true },
  { id: 'hwdlx', label: 'HW Deluxe', price: 700, necessary: false },
  { id: 'alcc', label: 'Alcc', price: 50, necessary: true },
];

export function getLotPrice(lotSize: number): number {
  // Base plan includes up to 1.0 lot. Extra lot starts charging from 1.1+.
  if (!lotSize || lotSize <= 1) return 0;
  return Math.round((lotSize - 1) * 250);
}

export function computeCustomOrderAmount(_selectedOptionIds: string[], lotSize: number): number {
  return ORDER_BASE_PRICE + getLotPrice(lotSize);
}
