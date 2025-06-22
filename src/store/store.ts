import { configureStore } from "@reduxjs/toolkit";
import experiencesReducer from "./slices/experiencesSlice";

export const store = configureStore({
  reducer: {
    experiences: experiencesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
        ignoredActionsPaths: [],
        ignoredPaths: [],
      },
    }),
});

if (typeof window !== "undefined") {
  (window as any).__REDUX_STORE__ = store;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
