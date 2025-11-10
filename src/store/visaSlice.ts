import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface RequiredDocuments {
  passport: boolean;
  ukVisa: boolean;
  photos: boolean;
  bankStatements: boolean;
  employmentProof: boolean;
  insurance: boolean;
}

interface RecommendedItems {
  insuranceCertificate: boolean;
  giftCard: boolean;
}

interface AppliedDiscount {
  description: string;
  percentage: number;
  discountAmount?: number;
}

export interface IVisaState {
  selectedCountry: string;
  visaFees: number;
  insuranceFees: number;
  travelers: number;
  visaTypeId: string;
  selectedVisaType: any;
  arrivalDate: string;
  departureDate: string;
  requiredDocuments: RequiredDocuments;
  recommendedItems: RecommendedItems;
  appliedDiscount: AppliedDiscount | null;
  couponCode: string;
  userEmail: string;
  selectedPaymentMethod: string;
  giftCardFees: number;
  totalAmount: number;
  insuranceOnly: boolean;
  triggerDocumentValidation?: boolean;
  amountWithoutDiscount: number;
  insuranceCount?: number;
  giftCardCount?: number;
}

const initialState: IVisaState = {
  selectedCountry: "",
  visaFees: 0,
  insuranceFees: 0, // Will be set dynamically based on selected country
  travelers: 1,
  visaTypeId: "",
  selectedVisaType: null,
  arrivalDate: "",
  departureDate: "",
  requiredDocuments: {
    passport: false,
    ukVisa: false,
    photos: false,
    bankStatements: false,
    employmentProof: false,
    insurance: false,
  },
  recommendedItems: {
    insuranceCertificate: false,
    giftCard: false,
  },
  appliedDiscount: null,
  couponCode: "",
  userEmail: "",
  selectedPaymentMethod: "",
  giftCardFees: 0,
  totalAmount: 0,
  insuranceOnly: false,
  amountWithoutDiscount: 0,
  insuranceCount: 0,
  giftCardCount: 0,
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
    setRequiredDocuments: (state, action: PayloadAction<RequiredDocuments>) => {
      state.requiredDocuments = action.payload;
    },
    setRecommendedItems: (state, action: PayloadAction<RecommendedItems>) => {
      state.recommendedItems = action.payload;
    },
    setAppliedDiscount: (state, action: PayloadAction<AppliedDiscount | null>) => {
      state.appliedDiscount = action.payload;
    },
    setCouponCode: (state, action: PayloadAction<string>) => {
      state.couponCode = action.payload;
    },
    setUserEmail: (state, action: PayloadAction<string>) => {
      state.userEmail = action.payload;
    },
    setSelectedPaymentMethod: (state, action: PayloadAction<string>) => {
      state.selectedPaymentMethod = action.payload;
    },
    setGiftCardFees: (state, action: PayloadAction<number>) => {
      state.giftCardFees = action.payload;
    },
    setTotalAmount: (state, action: PayloadAction<number>) => {
      state.totalAmount = action.payload;
    },
    setInsuranceOnly: (state, action: PayloadAction<boolean>) => {
      state.insuranceOnly = action.payload;
    },
    triggerDocumentValidation: (state) => {
      // This action can be used to trigger document validation from other components
      state.triggerDocumentValidation = !state.triggerDocumentValidation;
    },
    setAmountWithoutDiscount: (state, action: PayloadAction<number>) => {
      state.amountWithoutDiscount = action.payload;
    },
    setReduxInsuranceCount: (state, action: PayloadAction<number>) => {
      state.insuranceCount = action.payload;
    },
    setReduxGiftCardCount: (state, action: PayloadAction<number>) => {
      state.giftCardCount = action.payload;
    },
    clearVisaData: (state) => {
      state.selectedCountry = "";
      state.visaFees = 0;
      state.insuranceFees = 0; // Will be set dynamically
      state.travelers = 1;
      state.visaTypeId = "";
      state.selectedVisaType = null;
      state.arrivalDate = "";
      state.departureDate = "";
      state.requiredDocuments = {
        passport: false,
        ukVisa: false,
        photos: false,
        bankStatements: false,
        employmentProof: false,
        insurance: false,
      };
      state.recommendedItems = {
        insuranceCertificate: false,
        giftCard: false,
      };
      state.appliedDiscount = null;
      state.couponCode = "";
      state.userEmail = "";
      state.selectedPaymentMethod = "";
      state.giftCardFees = 0;
      state.totalAmount = 0;
      state.insuranceOnly = false;
      state.amountWithoutDiscount = 0;
      state.insuranceCount = 0;
      state.giftCardCount = 0;
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
  setRequiredDocuments,
  setRecommendedItems,
  setAppliedDiscount,
  setCouponCode,
  setUserEmail,
  setSelectedPaymentMethod,
  setGiftCardFees,
  setTotalAmount,
  setInsuranceOnly,
  triggerDocumentValidation,
  clearVisaData,
  setAmountWithoutDiscount,
  setReduxInsuranceCount,
  setReduxGiftCardCount,
} = visaSlice.actions;
export const visaReducer = visaSlice.reducer;
