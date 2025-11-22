
export type FieldType = 'text' | 'textarea' | 'select' | 'rating' | 'email' | 'date' | 'file';

export interface FormOption {
  id: string;
  label: string;
}

export interface LogicRule {
  conditionValue: string; // The label of the option that triggers this rule
  destinationId: string; // The ID of the target question or 'SUBMIT'
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: FormOption[]; // For select fields
  maxRating?: number; // For rating fields
  allowMultiple?: boolean; // For select fields
  logicRules?: LogicRule[]; // Flow logic
  allowedExtensions?: string[]; // For file upload fields (e.g., ['.pdf', '.jpg'])
}

export interface FormTheme {
  backgroundColor: string;
  primaryColor: string; // Used for buttons, accents, progress bars
  textColor: string;
}

export interface Form {
  id: string;
  title: string;
  createdAt: string;
  fields: FormField[];
  responseCount: number;
  theme?: FormTheme;
  logoUrl?: string;
}

export interface Submission {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Record<string, any>;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    xp: number;
    level: number;
}

export const calculateLevel = (xp: number): number => {
    // Simple formula: Level increases every 1000 XP
    return Math.floor(xp / 1000) + 1;
};

export const getXpProgress = (xp: number): number => {
    // Returns percentage (0-100) towards next level
    return (xp % 1000) / 10;
};

export const INITIAL_FIELDS: FormField[] = [
  {
    id: '1',
    type: 'text',
    label: 'Qual é o seu nome?',
    placeholder: 'Digite sua resposta aqui...',
    required: true,
  },
  {
    id: '2',
    type: 'rating',
    label: 'Como você está se sentindo hoje?',
    description: 'Em uma escala de 1 a 5 estrelas',
    maxRating: 5,
    required: false,
  }
];
