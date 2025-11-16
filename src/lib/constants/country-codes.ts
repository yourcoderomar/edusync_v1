/**
 * Country phone codes with flags and names
 * Common countries for phone number prefixes
 * Deduplicated by code - each code appears only once
 */
const rawCountryCodes = [
  { code: '+1', country: 'US', name: 'United States / Canada', flag: '🇺🇸' },
  { code: '+1', country: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+33', country: 'FR', name: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: '+46', country: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: '+358', country: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+353', country: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: '+30', country: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: '+48', country: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: '+420', country: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+36', country: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: '+40', country: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: '+81', country: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'CN', name: 'China', flag: '🇨🇳' },
  { code: '+82', country: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: '+91', country: 'IN', name: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: '+55', country: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+971', country: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+965', country: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', country: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: '+973', country: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', country: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: '+961', country: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+962', country: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: '+20', country: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: '+212', country: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: '+234', country: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+254', country: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: '+60', country: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: '+66', country: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+62', country: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: '+90', country: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: '+972', country: 'IL', name: 'Israel', flag: '🇮🇱' },
] as const

/**
 * Deduplicate country codes - keep only unique codes
 * For duplicate codes, keep the first occurrence
 */
export const countryCodes = Array.from(
  new Map(rawCountryCodes.map((country) => [country.code, country])).values()
)

/**
 * Get default country code (Egypt)
 */
export const defaultCountryCode = '+20'

