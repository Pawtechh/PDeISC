export type ComponentCategory =
  | 'Todos'
  | 'Básicos'
  | 'Entradas'
  | 'Toques e Interacción'
  | 'Listas'
  | 'Feedback y Diálogos'
  | 'Sistema';

export interface ComponentProp {
  name: string;
  type: string;
  description: string;
}

export interface NativeComponentDoc {
  id: string;
  name: string;
  category: Exclude<ComponentCategory, 'Todos'>;
  icon: string;
  summary: string;
  purpose: string;
  useCases: string[];
  keyProps: ComponentProp[];
  codeSnippet: string;
  tip?: string;
}
