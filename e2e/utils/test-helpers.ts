// Test helper functions for improved selectors

export function getExposureCounterSelector(current: number, total: number) {
  return `${current}/${total} - ${total - current} left`;
}

export function getExposureProgressSelector(current: number, total: number) {
  return `${current}/${total}`;
}

export function getMakeModelSelector(make: string, model: string) {
  return `${make} ${model}`;
}