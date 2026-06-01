/** BMI = 體重(kg) / 身高(m)² */
export function calcBMI(weightStr: string | null | undefined, heightCm: string): string | null {
  const w = parseFloat(weightStr ?? '');
  const hm = parseFloat(heightCm) / 100;
  if (isNaN(w) || isNaN(hm) || hm <= 0 || w <= 0) return null;
  return (w / (hm * hm)).toFixed(1);
}

/** BMI 對應文字說明 */
export function bmiLabel(bmi: string | null): string {
  if (!bmi) return '';
  const v = parseFloat(bmi);
  if (v < 18.5) return '過輕';
  if (v < 24)   return '正常';
  if (v < 27)   return '過重';
  if (v < 30)   return '輕度肥胖';
  return '肥胖';
}
