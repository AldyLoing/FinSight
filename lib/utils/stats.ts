export function calculateStats(numbers: number[]) {
  if (numbers.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, sum: 0, stdDev: 0 };
  }

  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const mean = sum / numbers.length;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const median = numbers.length % 2 === 0
    ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
    : sorted[Math.floor(numbers.length / 2)];
  
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  return { mean, median, min, max, sum, stdDev, variance };
}

export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
