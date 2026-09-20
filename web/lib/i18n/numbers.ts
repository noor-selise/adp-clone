export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value)
}
