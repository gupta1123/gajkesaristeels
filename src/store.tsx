import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Interfaces
interface AuthState {
  user: null | { [key: string]: any };
  token: null | string;
  employeeId: null | number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: null | string | { [key: string]: any };
  username: null | string;
  role: "ADMIN" | "MANAGER" | "FIELD OFFICER" | "OFFICE MANAGER" | null;
  firstName: null | string;
  lastName: null | string;
  teamId: null | number;
  officeManagerId: number | null;
  teamMembers: any[];
  isModalOpen: boolean;
  gajkesariRate: number;
}

interface LoginResponse {
  role: string;
  token: string;
}

interface UserInfo {
  username: string;
  roles: string;
  employeeId: number;
  firstName: string;
  lastName: string;
}

interface TeamInfo {
  id: number;
  officeManager: {
    id: number;
    firstName: string;
    lastName: string;
  };
  fieldOfficers: any[];
}

// API Configuration
export const api = axios.create({
  baseURL: 'https://api.gajkesaristeels.in'
});

// Async Thunks
export const loginUser = createAsyncThunk<LoginResponse, { username: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ username, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/user/token', { username, password });
      if (response.data === 'Bad credentials') {
        return rejectWithValue('Invalid username or password');
      }

      const [role, token] = response.data.split(' ');
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await dispatch(fetchUserInfo(username));

      if (role === 'MANAGER') {
        await dispatch(fetchTeamInfo());
      }

      await dispatch(checkDailyPricing(role));

      return { role, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserInfo = createAsyncThunk<UserInfo, string, { rejectValue: string }>(
  'auth/fetchUserInfo',
  async (username, { rejectWithValue }) => {
    try {
      const response = await api.get(`/user/manage/get?username=${username}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTeamInfo = createAsyncThunk<TeamInfo | null, void, { rejectValue: string }>(
  'auth/fetchTeamInfo',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const employeeId = state.auth.employeeId;
      if (!employeeId) {
        return null;
      }
      const response = await api.get(`/employee/team/getbyEmployee?id=${employeeId}`);
      return response.data[0];
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const checkDailyPricing = createAsyncThunk<void, string, { rejectValue: string }>(
  'auth/checkDailyPricing',
  async (role, { rejectWithValue, dispatch }) => {
    const today = new Date().toISOString().split('T')[0];
    const url = `/brand/getByDateRange?start=${today}&end=${today}`;
    try {
      const response = await api.get(url);
      const gajkesariBrand = response.data.find((item: any) => item.brandName === 'Gajkesari');

      if (gajkesariBrand && gajkesariBrand.employeeDto?.id === 86) {
        dispatch(setGajkesariRate(gajkesariBrand.price));
        dispatch(setModalOpen(false));
      } else {
        dispatch(setGajkesariRate(0));
        if (role === 'ADMIN') {
          dispatch(setModalOpen(true));
        }
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('teamId');
      localStorage.removeItem('username');
      delete api.defaults.headers.common['Authorization'];
      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  employeeId: null,
  status: 'idle',
  error: null,
  username: null,
  role: null,
  firstName: null,
  lastName: null,
  teamId: null,
  officeManagerId: null,
  teamMembers: [],
  isModalOpen: false,
  gajkesariRate: 0,
};

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      api.defaults.headers.common['Authorization'] = `Bearer ${action.payload}`;
    },
    setRole: (state, action: PayloadAction<AuthState['role']>) => {
      state.role = action.payload;
    },
    resetState: (state) => {
      Object.assign(state, initialState);
      delete api.defaults.headers.common['Authorization'];
    },
    setModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
    setGajkesariRate: (state, action: PayloadAction<number>) => {
      state.gajkesariRate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.role = action.payload.role as AuthState['role'];
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unknown error';
      })
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.employeeId = action.payload.employeeId;
        state.username = action.payload.username;
        state.firstName = action.payload.firstName;
        state.lastName = action.payload.lastName;
      })
      .addCase(fetchTeamInfo.fulfilled, (state, action) => {
        if (action.payload) {
          state.teamId = action.payload.id;
          state.teamMembers = action.payload.fieldOfficers;
          localStorage.setItem('teamId', action.payload.id.toString());
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
      });
  },
});

// Action Creators
export const { setToken, setRole, resetState, setModalOpen, setGajkesariRate } = authSlice.actions;

// Store Configuration
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Utility Functions
export const setupAxiosDefaults = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};