import { create } from 'zustand';
import { User, UserLoginRequest, UserRegisterRequest, UserRegisterResponse } from '../types';
import { authService } from '../services/authService';

const ACCESS_TOKEN_KEY = 'cc_access_token';
const REFRESH_TOKEN_KEY = 'cc_refresh_token';
const USER_KEY = 'cc_user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  isAdminModalOpen: boolean;
  isTraineeModalOpen: boolean;
  isTrainerModalOpen: boolean;
  isCoursePlayerOpen: boolean;
  selectedCourseIdForPlayer: string | null;

  // Actions
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  openTraineeModal: () => void;
  closeTraineeModal: () => void;
  openTrainerModal: () => void;
  closeTrainerModal: () => void;
  openCoursePlayer: (courseId: string) => void;
  closeCoursePlayer: () => void;
  clearError: () => void;
  login: (credentials: UserLoginRequest) => Promise<void>;
  register: (data: UserRegisterRequest) => Promise<UserRegisterResponse>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),
  isLoading: false,
  error: null,
  isAuthModalOpen: false,
  authModalTab: 'login',
  isAdminModalOpen: false,
  isTraineeModalOpen: false,
  isTrainerModalOpen: false,
  isCoursePlayerOpen: false,
  selectedCourseIdForPlayer: null,

  openAuthModal: (tab = 'login') => {
    set({ isAuthModalOpen: true, authModalTab: tab, error: null });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false, error: null });
  },

  openAdminModal: () => {
    set({ isAdminModalOpen: true });
  },

  closeAdminModal: () => {
    set({ isAdminModalOpen: false });
  },

  openTraineeModal: () => {
    set({ isTraineeModalOpen: true });
  },

  closeTraineeModal: () => {
    set({ isTraineeModalOpen: false });
  },

  openTrainerModal: () => {
    set({ isTrainerModalOpen: true });
  },

  closeTrainerModal: () => {
    set({ isTrainerModalOpen: false });
  },

  openCoursePlayer: (courseId: string) => {
    set({ isCoursePlayerOpen: true, selectedCourseIdForPlayer: courseId });
  },

  closeCoursePlayer: () => {
    set({ isCoursePlayerOpen: false, selectedCourseIdForPlayer: null });
  },

  setAuthModalTab: (tab) => {
    set({ authModalTab: tab, error: null });
  },

  clearError: () => set({ error: null }),

  login: async (credentials: UserLoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isAuthModalOpen: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (data: UserRegisterRequest): Promise<UserRegisterResponse> => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup(data);
      set({ isLoading: false, error: null });
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please check your details.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    const { accessToken } = get();
    try {
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  loadSession: async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const cachedUser = localStorage.getItem(USER_KEY);

    if (cachedUser) {
      try {
        set({ user: JSON.parse(cachedUser), isAuthenticated: !!token });
      } catch {
        // Corrupt cache
      }
    }

    if (token) {
      try {
        const user = await authService.getMe(token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        set({ user, isAuthenticated: true });
      } catch {
        // Token expired or invalid; try refresh token if present
        const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refresh) {
          try {
            const refreshed = await authService.refreshToken(refresh);
            localStorage.setItem(ACCESS_TOKEN_KEY, refreshed.access_token);
            const user = await authService.getMe(refreshed.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            set({
              user,
              accessToken: refreshed.access_token,
              isAuthenticated: true,
            });
            return;
          } catch {
            // Refresh failed
          }
        }
        // Session dead, reset
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      }
    }
  },
}));
