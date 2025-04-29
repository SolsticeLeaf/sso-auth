export function getDefaultTextColor(theme: string): string {
  return theme === 'dark' ? '#ffffff' : '#3d3a48';
}

export default { getDefaultTextColor };
