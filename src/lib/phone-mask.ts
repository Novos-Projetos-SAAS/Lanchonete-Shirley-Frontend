/**
 * Máscara de celular brasileiro: (DD) 99999-9999.
 * Limita a 11 dígitos (DDD + número) sem modificar a aparência dos campos.
 * Aceita colagem de números completos com código do país (+55).
 */
export function mobilePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  const national = digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits;
  return national.slice(0, 11);
}

export function maskBrazilianMobile(value: string): string {
  const digits = mobilePhoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidBrazilianMobile(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || (digits.length === 13 && digits.startsWith("55"));
}
