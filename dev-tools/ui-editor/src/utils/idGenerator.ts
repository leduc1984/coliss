import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const generateShortId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateComponentName = (type: string, index?: number): string => {
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  return index !== undefined ? `${capitalizedType}_${index}` : capitalizedType;
};