export function validateStringLength(value: string, fieldName: string, maxLength: number): string | null {
  if (typeof value !== 'string') return `${fieldName} must be a string`;
  if (value.length > maxLength) return `${fieldName} must be ${maxLength} characters or less`;
  return null;
}

export function validateEmail(email: string): string | null {
  if (typeof email !== 'string') return 'Email must be a string';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email address';
  return null;
}

export function validateFileUpload(file: File, maxSizeMB: number, allowedTypes: string[]): string | null {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) return `File must be ${maxSizeMB}MB or less`;
  const typeMatch = allowedTypes.some(pattern => {
    if (pattern.endsWith('/*')) {
      return file.type.startsWith(pattern.replace('/*', '/'));
    }
    return file.type === pattern;
  });
  if (!typeMatch) return `File type ${file.type} is not allowed`;
  return null;
}
