export interface Property {
  id: number;
  name: string;
  location: string;
  address: string;
  type: string;
  image: string;
  price: string;
  amenities: string[];
}

export interface ConciergeRequest {
  query: string;
}

export interface ConciergeResponse {
  answer: string;
  suggestedLocations: string[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}