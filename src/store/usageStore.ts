import { create } from 'zustand';

type ModuleName = 'scribe' | 'matrix' | 'reportly' | 'submission';

interface ModuleUsage {
  filesUsed: number;
  submissionsUsed: number;
}

interface UsageState {
  userEmail: string | null;
  isPaid: boolean;
  limits: {
    maxFiles: number;
    maxSubmissions: number;
  };
  usage: Record<ModuleName, ModuleUsage>;
  setUser: (email: string) => void;
  setIsPaid: (status: boolean) => void;
  incrementFileUsage: (module: ModuleName) => void;
  incrementSubmissionUsage: () => void;
  resetUsage: () => void;
  loadUserData: (email: string) => void;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  userEmail: null,
  isPaid: false,
  limits: {
    maxFiles: 5,
    maxSubmissions: 5,
  },
  usage: {
    scribe: { filesUsed: 0, submissionsUsed: 0 },
    matrix: { filesUsed: 0, submissionsUsed: 0 },
    reportly: { filesUsed: 0, submissionsUsed: 0 },
    submission: { filesUsed: 0, submissionsUsed: 0 },
  },

  // ✅ Set current user and load their data
  setUser: (email) => {
    set({ userEmail: email });
    get().loadUserData(email);
  },

  setIsPaid: (status) => {
    set((state) => {
      const updatedState = {
        isPaid: status,
        limits: {
          maxFiles: status ? 15 : 5,
          maxSubmissions: 5,
        },
      };

      // Save updated plan in localStorage
      if (state.userEmail) {
        localStorage.setItem(`${state.userEmail}_payment`, JSON.stringify(updatedState));
      }

      return updatedState;
    });
  },

  // ✅ Increment file usage and save it properly
  incrementFileUsage: (module) =>
    set((state) => {
      const currentUsage = state.usage[module].filesUsed;

      const updatedUsage = {
        ...state.usage,
        [module]: {
          ...state.usage[module],
          filesUsed: currentUsage + 1,
        },
      };

      // ✅ Save full module usage object
      if (state.userEmail) {
        localStorage.setItem(
          `${state.userEmail}_${module}_usage`,
          JSON.stringify(updatedUsage[module])
        );
      }

      return {
        usage: updatedUsage,
      };
    }),

  // ✅ Increment submission usage and save it properly
  incrementSubmissionUsage: () =>
    set((state) => {
      const currentUsage = state.usage.submission.submissionsUsed;

      const updatedUsage = {
        ...state.usage,
        submission: {
          ...state.usage.submission,
          submissionsUsed: currentUsage + 1,
        },
      };

      // ✅ Save full module usage object
      if (state.userEmail) {
        localStorage.setItem(
          `${state.userEmail}_submission_usage`,
          JSON.stringify(updatedUsage.submission)
        );
      }

      return {
        usage: updatedUsage,
      };
    }),

  // ✅ Reset all usage
  resetUsage: () => {
    set((state) => {
      if (state.userEmail) {
        const modules: ModuleName[] = ['scribe', 'matrix', 'reportly', 'submission'];
        modules.forEach((module) => {
          localStorage.removeItem(`${state.userEmail}_${module}_usage`);
        });
        localStorage.removeItem(`${state.userEmail}_payment`);
      }

      return {
        usage: {
          scribe: { filesUsed: 0, submissionsUsed: 0 },
          matrix: { filesUsed: 0, submissionsUsed: 0 },
          reportly: { filesUsed: 0, submissionsUsed: 0 },
          submission: { filesUsed: 0, submissionsUsed: 0 },
        },
        isPaid: false,
        limits: {
          maxFiles: 5,
          maxSubmissions: 5,
        },
      };
    });
  },

  // ✅ Load full user data (filesUsed + submissionsUsed)
  loadUserData: (email) => {
    const paymentData = JSON.parse(localStorage.getItem(`${email}_payment`) || '{}');

    const modules: ModuleName[] = ['scribe', 'matrix', 'reportly', 'submission'];
    const loadedUsage: Record<ModuleName, ModuleUsage> = {
      scribe: { filesUsed: 0, submissionsUsed: 0 },
      matrix: { filesUsed: 0, submissionsUsed: 0 },
      reportly: { filesUsed: 0, submissionsUsed: 0 },
      submission: { filesUsed: 0, submissionsUsed: 0 },
    };

    modules.forEach((module) => {
      const savedUsage = JSON.parse(localStorage.getItem(`${email}_${module}_usage`) || 'null');

      if (savedUsage && typeof savedUsage === 'object') {
        loadedUsage[module] = savedUsage;
      }
    });

    set({
      usage: loadedUsage,
      isPaid: paymentData.isPaid || false,
      limits: {
        maxFiles: paymentData.isPaid ? 15 : 5,
        maxSubmissions: 5,
      },
    });
  },
}));
