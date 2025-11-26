// Currency conversion utilities
// Uses exchangerate-api.com free tier (1500 requests/month)

const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

let ratesCache: ExchangeRates | null = null;

export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  // Check cache first
  if (ratesCache && 
      ratesCache.base === baseCurrency && 
      Date.now() - ratesCache.timestamp < CACHE_DURATION) {
    return ratesCache.rates;
  }

  try {
    const response = await fetch(`${EXCHANGE_API_URL}/${baseCurrency}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    ratesCache = {
      base: baseCurrency,
      rates: data.rates,
      timestamp: Date.now(),
    };

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    return getFallbackRates(baseCurrency);
  }
}

export function getFallbackRates(baseCurrency: string): Record<string, number> {
  // Fallback static rates (updated Nov 2024)
  const fallbackRates: Record<string, Record<string, number>> = {
    USD: {
      IDR: 15750,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      SGD: 1.34,
      MYR: 4.72,
      CNY: 7.24,
      THB: 35.50,
      USD: 1,
    },
    IDR: {
      USD: 0.000063,
      EUR: 0.000058,
      GBP: 0.000050,
      JPY: 0.0095,
      SGD: 0.000085,
      MYR: 0.0003,
      CNY: 0.00046,
      THB: 0.00225,
      IDR: 1,
    },
  };

  return fallbackRates[baseCurrency] || fallbackRates['USD'];
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  // Handle null/undefined amounts
  const validAmount = amount ?? 0;
  
  if (fromCurrency === toCurrency) return validAmount;
  
  // Convert to base currency first, then to target
  const amountInBase = fromCurrency === 'USD' 
    ? validAmount 
    : validAmount / (rates[fromCurrency] || 1);
  
  const result = toCurrency === 'USD' 
    ? amountInBase 
    : amountInBase * (rates[toCurrency] || 1);

  return result;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    IDR: 'Rp',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    SGD: 'S$',
    MYR: 'RM',
    CNY: '¥',
    THB: '฿',
  };

  const symbol = currencySymbols[currency] || currency;
  
  // Handle null/undefined amounts
  const validAmount = amount ?? 0;
  
  // Format based on currency
  if (currency === 'IDR' || currency === 'JPY') {
    // No decimals for IDR and JPY
    return `${symbol}${Math.round(validAmount).toLocaleString(locale)}`;
  }
  
  return `${symbol}${validAmount.toLocaleString(locale, { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];
