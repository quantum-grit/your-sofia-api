export function buildXlsUrl(
  year: number,
  month: number,
  district: string,
  size: string,
  prefix = ''
): string {
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(2)
  return `https://inspectorat-so.org/images/${year}/${mm}/${district}/${prefix}bitovo_${size}_${mm}.${yy}.xls`
}
