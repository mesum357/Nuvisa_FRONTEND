import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { authReducer } from "@/store/authSlice";
import { visaReducer } from "@/store/visaSlice";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: number) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

const authPersistConfig = {
  key: "auth",
  storage: storage,
  whitelist: ["authState", "authName", "authId", "updateUser"],
};

const visaPersistConfig = {
  key: "visa",
  storage: storage,
  whitelist: ["selectedCountry", "visaFees", "insuranceFees", "travelers", "visaTypeId", "selectedVisaType", "arrivalDate", "departureDate", "requiredDocuments", "recommendedItems", "appliedDiscount", "couponCode", "userEmail", "selectedPaymentMethod", "giftCardFees", "totalAmount", "insuranceOnly"],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedVisaReducer = persistReducer(visaPersistConfig, visaReducer);

const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  visa: persistedVisaReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  devTools: {
    serialize: {
      options: {
        undefined: true,
        function: true,
        symbol: true,
      },
    },
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["items.dates"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
