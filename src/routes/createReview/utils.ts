export const pickString = (value?: unknown) =>
  typeof value === "string" && value.trim().length ? value.trim() : undefined;
