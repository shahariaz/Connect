export const serialize = (data: unknown): string => {
  if (data == null) return "";
  return JSON.stringify(data);
};

export const deserialize = <T>(data: string): T | null => {
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};
