import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to format phone numbers for display.
 * Input: +77053811138 or 77053811138 or any format with spaces
 * Output: +7 705 381 1138 (Kazakhstan/Russia format)
 */
@Pipe({
  name: 'phoneFormat',
  standalone: true
})
export class PhoneFormatPipe implements PipeTransform {

  transform(phone: string | null | undefined): string {
    if (!phone) {
      return '';
    }

    // First normalize: remove all non-digit characters except +
    let normalized = '';
    let hasPlus = false;
    
    for (const char of phone) {
      if (char === '+' && !hasPlus && normalized.length === 0) {
        normalized += char;
        hasPlus = true;
      } else if (/\d/.test(char)) {
        normalized += char;
      }
    }

    // Remove leading + for processing
    const digits = normalized.startsWith('+') ? normalized.substring(1) : normalized;

    // If the number is too short, just return with + prefix
    if (digits.length < 10) {
      return normalized.startsWith('+') ? normalized : '+' + normalized;
    }

    // Format for Kazakhstan/Russia: +7 XXX XXX XXXX (11 digits total with country code)
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
      // Convert 8 to 7 for standard format
      const countryCode = '7';
      const rest = digits.substring(1);
      return `+${countryCode} ${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6)}`;
    }

    // For 10-digit numbers (without country code), assume +7
    if (digits.length === 10) {
      return `+7 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    }

    // For other formats, just add spaces every 3 digits after country code
    if (digits.length > 3) {
      let formatted = '+' + digits.charAt(0) + ' ';
      const remaining = digits.substring(1);
      
      for (let i = 0; i < remaining.length; i++) {
        if (i > 0 && i % 3 === 0 && i < remaining.length) {
          formatted += ' ';
        }
        formatted += remaining.charAt(i);
      }
      return formatted;
    }

    return normalized.startsWith('+') ? normalized : '+' + normalized;
  }
}
