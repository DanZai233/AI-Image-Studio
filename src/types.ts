export interface AIModelSettings {
  apiKey: string;
  endpoint: string;
  chatModel: string;
  imageModel: string;
}

export interface ImageAsset {
  id: string; // e.g. "IMG_XYZ123"
  name: string; // User-facing name, typically same as id
  url: string; // Base64 data URL
  source: 'upload' | 'generation';
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string; // text
  mode: 'chat' | 'image'; // what mode this message was created in
  imageAssets?: string[]; // IDs of referenced images
  quotedMessageId?: string; // ID of message being replied to
  timestamp: number;
  isError?: boolean;
}

export type AppState = {
  settings: AIModelSettings;
  messages: Message[];
  assets: Record<string, ImageAsset>;
  quotedMessageId: string | null;
  inputMode: 'chat' | 'image';
};
