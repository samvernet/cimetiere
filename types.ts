
export type SteleCondition = 'Très bon' | 'Bon' | 'Moyen' | 'Mauvais' | 'Très mauvais';

export interface Person {
  name: string;
  birthDate: string;
  birthPlace: string;
  deathDate: string;
  deathPlace: string;
  epitaph: string;
}

export interface GraveRecord {
  id: string;
  steleNumber: number;
  aisleNumber: string;
  condition: SteleCondition;
  photoUrl: string;
  people: Person[];
  timestamp: number;
  isSynced: boolean;
  lat?: number;
  lng?: number;
}

export enum ViewMode {
  CAPTURE = 'CAPTURE',
  LIST = 'LIST',
  MAP = 'MAP'
}

export interface TranscriptionResult {
  people: Person[];
}
