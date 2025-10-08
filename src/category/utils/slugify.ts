export function slugify(input: string) {
  // 1) TR özel küçük harf dönüştürme
  const lower = input
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // 2) Aksan/işaret temizliği + alfasayısal dışını tire yap
  const ascii = lower
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  return ascii || 'n-a';
}
