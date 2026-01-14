
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
  groundingLinks?: GroundingChunk[];
  isKnowledge?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  timestamp: number;
}

export interface UserLog {
  id: string;
  name: string;
  employeeId: string;
  timestamp: number;
}

// 마스터 관리자가 보는 전사 활동 로그
export interface MasterActivity {
  id: string;
  userName: string;
  employeeId: string;
  userQuery: string;
  aiResponse: string;
  timestamp: number;
  usedSearch: boolean;
}

export enum ModelType {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview'
}
