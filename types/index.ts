export type Locale = 'en' | 'ko' | 'uz' | 'ru';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  nationality: string;
  language: Locale;
  createdAt: Date;
}

export interface ResumeSection {
  id: string;
  type: 'personal' | 'education' | 'experience' | 'skills' | 'languages' | 'certifications';
  title: string;
  content: Record<string, string | string[]>;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  template: ResumeTemplate;
  sections: ResumeSection[];
  language: Locale;
  createdAt: Date;
  updatedAt: Date;
}

export type ResumeTemplate = 'modern' | 'classic' | 'minimal' | 'korean';

export interface PersonalInfo {
  fullName: string;
  fullNameKorean?: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  nationality: string;
  photo?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

export interface Award {
  id: string;
  title: string;
  organization: string;
  date: string;
  type: 'award' | 'scholarship' | 'honor';
  description?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  score?: string;
  credentialId?: string;
}

export interface Project {
  id: string;
  title: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  technologies?: string;
  description: string;
  url?: string;
}

export interface Volunteer {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Publication {
  id: string;
  title: string;
  type: 'thesis' | 'journal' | 'proceedings';
  publisher: string;
  date: string;
  authors?: string;
  doi?: string;
  description?: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  company: string;
  position: string;
  content: string;
  language: Locale;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  context: 'resume' | 'cover-letter' | 'general';
  createdAt: Date;
}

export interface Template {
  id: ResumeTemplate;
  name: string;
  preview: string;
  description: string;
  popular?: boolean;
}

export interface DashboardStats {
  resumeCount: number;
  coverLetterCount: number;
  aiChatsCount: number;
  lastActivity: Date;
}
