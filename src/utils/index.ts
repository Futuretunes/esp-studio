export function assertNever(value: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${String(value)}`);
}

export function formatChipFamily(family: string): string {
  return family.toUpperCase();
}
