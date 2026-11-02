import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import resumeReducer from "../features/resume/resumeSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import exploreReducer from "../features/explore/exploreSlice";
import invitationsReducer from "../features/invitations/invitationsSlice";
import analyticsReducer from "../features/analytics/analyticsSlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    dashboard: dashboardReducer,
    explore: exploreReducer,
    invitations: invitationsReducer,
    analytics: analyticsReducer, 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
