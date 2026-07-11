import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WizardState {
  questionnaireId: number | null;
  currentStep: number;
  /** `questionId -> questionOptionId` escolhido. */
  answers: Record<number, number>;
  start: (questionnaireId: number) => void;
  answer: (questionId: number, questionOptionId: number) => void;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

/**
 * Estado do wizard de resposta (RF-18) — vive fora do React pra sobreviver a
 * re-renders entre os passos sem precisar subir tudo pro componente pai.
 * `start` só zera o progresso se o paciente mudou de questionário; recarregar
 * a mesma página no meio do fluxo não perde as respostas já dadas.
 *
 * Persistido em `sessionStorage` (PRD.md §2.2/§5.13): sem isso, fechar a aba
 * ou dar refresh no meio do questionário perdia todo o progresso sem aviso —
 * `sessionStorage` (não `localStorage`) porque é um fluxo de sessão única, não
 * um rascunho que deveria sobreviver entre dispositivos/sessões.
 */
export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      questionnaireId: null,
      currentStep: 0,
      answers: {},
      start: (questionnaireId) => {
        if (get().questionnaireId !== questionnaireId) {
          set({ questionnaireId, currentStep: 0, answers: {} });
        }
      },
      answer: (questionId, questionOptionId) =>
        set((state) => ({ answers: { ...state.answers, [questionId]: questionOptionId } })),
      goNext: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      goPrev: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
      goToStep: (step) => set({ currentStep: step }),
      reset: () => set({ questionnaireId: null, currentStep: 0, answers: {} }),
    }),
    {
      name: "remind-wizard-progress",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        questionnaireId: state.questionnaireId,
        currentStep: state.currentStep,
        answers: state.answers,
      }),
    },
  ),
);
