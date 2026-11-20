export function sentenceCaseStart(value: string): string {
  return value.replace(/^(\s*)(\p{L})/u, (_match, leading: string, first: string) => leading + first.toLocaleUpperCase())
}