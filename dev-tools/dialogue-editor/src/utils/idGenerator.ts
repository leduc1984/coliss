import { v4 as uuidv4 } from 'uuid';

export const generateId = (): string => {
  return uuidv4();
};

export const generateShortId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateNodeId = (type: string): string => {
  return `${type}-${generateShortId()}`;
};