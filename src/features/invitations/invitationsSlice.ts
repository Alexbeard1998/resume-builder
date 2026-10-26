import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../api/client";

// Тип приглашения
export interface Invitation {
  id: string;
  message: string;
  hrName: string;
  hrEmail: string;
  createdAt: string;
  resumeId: string;
  resume: {
    title: string;
  };
}

interface InvitationsState {
  invitations: Invitation[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: InvitationsState = {
  invitations: [],
  status: "idle",
  error: null,
};

// Thunk для загрузки приглашений
export const fetchInvitations = createAsyncThunk(
  "invitations/fetch",
  async () => {
    return api.getInvitations();
  }
);

const invitationsSlice = createSlice({
  name: "invitations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvitations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.invitations = action.payload;
      })
      .addCase(fetchInvitations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Ошибка загрузки";
      });
  },
});

export default invitationsSlice.reducer;