import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import resumeReducer from "../features/resume/resumeSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import exploreReducer from "../features/explore/exploreSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    dashboard: dashboardReducer,
    explore: exploreReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;