import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
export interface IAuthState {
  authState: boolean;
  authName: string;
  authId: string;
  updateUser?: boolean;
}

const initialState: IAuthState = {
  authState: false,
  authName: "",
  authId: "",
  updateUser: false,

};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState: (state, action: PayloadAction<boolean>) => {
      state.authState = action.payload;
    },
    setAuthName: (state, action: PayloadAction<string>) => {
      state.authName = action.payload;
    },
    setAuthId: (state, action: PayloadAction<string>) => {
      state.authId = action.payload;
    },
    setUpdateUser: (state, action: PayloadAction<boolean>) => {
      state.updateUser = action.payload;
    },
  },
});

export const {
  setAuthState,
  setAuthName,
  setAuthId,
  setUpdateUser,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
