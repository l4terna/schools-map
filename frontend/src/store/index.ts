import { configureStore } from "@reduxjs/toolkit";
import { schoolsApi } from "./api/schoolsApi";

export const store = configureStore({
  reducer: {
    [schoolsApi.reducerPath]: schoolsApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(schoolsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
