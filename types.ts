export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TERMINAL = 'TERMINAL',
  SYSTEM = 'SYSTEM',
  VISION = 'VISION',
}

export interface SystemMetric {
  name: string;
  value: number;
  history: number[];
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}
