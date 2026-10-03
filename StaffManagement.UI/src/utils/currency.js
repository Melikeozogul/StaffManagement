/**
 * Currency utilities for StaffManagement application
 * Supported currencies: TRY (₺), USD ($), EUR (€), GBP (£)
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'TRY', symbol: '₺', label: 'TRY (₺)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

export const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Returns the symbol for a given currency code.
 * Strict: Only returns '$' if currency is explicitly USD. Never defaults to '$'.
 */
export function getCurrencySymbol(currency) {
  if (!currency) return '';
  const code = currency.toString().toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] || code;
}

/**
 * Formats a monetary amount with the appropriate currency symbol.
 * Example: formatCurrency(1000, 'TRY') => "₺1,000"
 *          formatCurrency(5000, 'TRY') => "₺5,000"
 *          formatCurrency(56.5, 'USD') => "$56.50"
 *          formatCurrency(250, 'USD')  => "$250"
 *          formatCurrency(45, 'EUR')   => "€45"
 */
export function formatCurrency(amount, currency) {
  const val = Number(amount) || 0;
  const symbol = getCurrencySymbol(currency);
  const isWhole = Math.abs(val - Math.round(val)) < 0.0001;
  const formattedNumber = val.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${symbol}${formattedNumber}` : formattedNumber;
}

/**
 * Formats an hourly wage rate.
 * Example: formatHourlyWage(1000, 'TRY') => "₺1,000/hour"
 *          formatHourlyWage(50, 'USD')   => "$50/hour"
 *          formatHourlyWage(45, 'EUR')   => "€45/hour"
 */
export function formatHourlyWage(amount, currency) {
  return `${formatCurrency(amount, currency)}/hour`;
}

export const formatHourlyRate = formatHourlyWage;

/**
 * Formats staff payment rate according to payment type.
 * Examples:
 * - Hourly:  formatPaymentRate(500, 'TRY', 'Hourly')  => "₺500/hour"
 * - Daily:   formatPaymentRate(2000, 'TRY', 'Daily')  => "₺2,000/day"
 * - Monthly: formatPaymentRate(50000, 'TRY', 'Monthly') => "₺50,000/month"
 */
export function formatPaymentRate(amount, currency, paymentType = 'Hourly') {
  const formatted = formatCurrency(amount, currency);
  const type = (paymentType || 'Hourly').toString().toLowerCase().trim();
  switch (type) {
    case 'daily':
      return `${formatted}/day`;
    case 'monthly':
      return `${formatted}/month`;
    case 'hourly':
    default:
      return `${formatted}/hour`;
  }
}

export const DEFAULT_WORK_SETTINGS = {
  standardWorkingDaysPerMonth: 22,
  standardWorkingHoursPerDay: 8,
};

/**
 * Calculates equivalent hourly rate for a staff member based on their payment type.
 */
export function getHourlyEquivalent(staff, workSettings = DEFAULT_WORK_SETTINGS) {
  if (!staff) return 0;
  const paymentType = (staff.paymentType || 'Hourly').toString().toLowerCase().trim();
  const paymentAmount = Number(
    staff.paymentAmount != null
      ? staff.paymentAmount
      : (staff.hourlyRate ?? staff.hourlyWage ?? 0)
  ) || 0;

  const daysPerMonth = Number(workSettings?.standardWorkingDaysPerMonth) || 22;
  const hoursPerDay = Number(workSettings?.standardWorkingHoursPerDay) || 8;

  if (paymentType === 'daily') {
    return hoursPerDay > 0 ? paymentAmount / hoursPerDay : 0;
  }
  if (paymentType === 'monthly') {
    const totalHours = daysPerMonth * hoursPerDay;
    return totalHours > 0 ? paymentAmount / totalHours : 0;
  }
  return paymentAmount;
}

/**
 * Worklog / earnings calculation:
 * Hourly:  Earnings = WorkedHours × PaymentAmount
 * Daily:   Earnings = WorkedDays × PaymentAmount (where WorkedDays = WorkedHours / StandardWorkingHoursPerDay)
 * Monthly: Earnings = WorkedHours × HourlyEquivalent
 *          where HourlyEquivalent = MonthlyAmount / (StandardWorkingDaysPerMonth × StandardWorkingHoursPerDay)
 */
export function calculateStaffEarnings(hoursWorked, staff, workSettings = DEFAULT_WORK_SETTINGS) {
  if (!staff) return 0;
  const hours = Number(hoursWorked) || 0;
  if (hours <= 0) return 0;

  const paymentType = (staff.paymentType || 'Hourly').toString().toLowerCase().trim();
  const paymentAmount = Number(
    staff.paymentAmount != null
      ? staff.paymentAmount
      : (staff.hourlyRate ?? staff.hourlyWage ?? 0)
  ) || 0;

  const daysPerMonth = Number(workSettings?.standardWorkingDaysPerMonth) || 22;
  const hoursPerDay = Number(workSettings?.standardWorkingHoursPerDay) || 8;

  if (paymentType === 'daily') {
    const workedDays = hoursPerDay > 0 ? hours / hoursPerDay : 0;
    return workedDays * paymentAmount;
  }
  if (paymentType === 'monthly') {
    const totalWorkingHours = daysPerMonth * hoursPerDay;
    const hourlyEquivalent = totalWorkingHours > 0 ? paymentAmount / totalWorkingHours : 0;
    return hours * hourlyEquivalent;
  }
  // Default: Hourly
  return hours * paymentAmount;
}

/**
 * Calculates and formats total earnings grouped by currency without automatic conversion.
 * Example: "₺5,000 + $250"
 */
export function formatTotalEarnings(taskList, workSettings = DEFAULT_WORK_SETTINGS) {
  if (!taskList || taskList.length === 0) return '0';
  const totalsByCurrency = {};
  for (const t of taskList) {
    const curr = (t.taskCurrency || t.appointedStaff?.currency || t.currency || '').toString().toUpperCase().trim();
    if (!curr) continue;
    let earnings = 0;
    if (t.taskEarnings != null) {
      earnings = Number(t.taskEarnings);
    } else if (t.earnings != null) {
      earnings = Number(t.earnings);
    } else {
      earnings = calculateStaffEarnings(t.hoursSpent, t.appointedStaff, workSettings);
    }
    totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + earnings;
  }
  const keys = Object.keys(totalsByCurrency);
  if (keys.length === 0) return '0';
  return keys
    .map((k) => formatCurrency(totalsByCurrency[k], k))
    .join(' + ');
}
