export type ModelDef = {
  id: string;
  label: string;
  short: string;
  description: string;
  supportsVision: boolean;
};

export const MODELS: ModelDef[] = [
  {
    id: "google/gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    short: "Gemini 3 Flash",
    description: "Rapide · défaut. Idéal pour la plupart des questions.",
    supportsVision: true,
  },
  {
    id: "google/gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    short: "Gemini 3.1 Pro",
    description: "Raisonnement profond pour analyses complexes.",
    supportsVision: true,
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    short: "GPT-5",
    description: "Polyvalent, multimodal texte + image.",
    supportsVision: true,
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    short: "GPT-5.4",
    description: "Raisonnement avancé, code, analyse.",
    supportsVision: true,
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function getModel(id: string): ModelDef {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
