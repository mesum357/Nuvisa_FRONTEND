import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface IVisaState {
  selectedCountry: string;
  visaFees: number;
  insuranceFees: number;
  travelers: number;
  visaTypeId: string;
  selectedVisaType: any;
  arrivalDate: string;
  departureDate: string;
}

const initialState: IVisaState = {
  selectedCountry: "",
  visaFees: 159,
  insuranceFees: 0, // Will be set dynamically based on selected country
  travelers: 1,
  visaTypeId: "",
  selectedVisaType: null,
  arrivalDate: "",
  departureDate: "",
};

export const visaSlice = createSlice({
  name: "visa",
  initialState,
  reducers: {
    setSelectedCountry: (state, action: PayloadAction<string>) => {
      state.selectedCountry = action.payload;
    },
    setVisaFees: (state, action: PayloadAction<number>) => {
      state.visaFees = action.payload;
    },
    setInsuranceFees: (state, action: PayloadAction<number>) => {
      state.insuranceFees = action.payload;
    },
    setTravelers: (state, action: PayloadAction<number>) => {
      state.travelers = action.payload;
    },
    setVisaTypeId: (state, action: PayloadAction<string>) => {
      state.visaTypeId = action.payload;
    },
    setSelectedVisaType: (state, action: PayloadAction<any>) => {
      state.selectedVisaType = action.payload;
    },
    setArrivalDate: (state, action: PayloadAction<string>) => {
      state.arrivalDate = action.payload;
    },
    setDepartureDate: (state, action: PayloadAction<string>) => {
      state.departureDate = action.payload;
    },
    clearVisaData: (state) => {
      state.selectedCountry = "";
      state.visaFees = 159;
      state.insuranceFees = 0; // Will be set dynamically
      state.travelers = 1;
      state.visaTypeId = "";
      state.selectedVisaType = null;
      state.arrivalDate = "";
      state.departureDate = "";
    },
  },
});

export const {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
  setVisaTypeId,
  setSelectedVisaType,
  setArrivalDate,
  setDepartureDate,
  clearVisaData,
} = visaSlice.actions;
export const visaReducer = visaSlice.reducer;
