
import { api } from "./api";
import type { User } from "@/types/user";
import type { Note } from "@/types/note";
import type { NotesResponse } from "./clientApi"; 

export interface FetchNotesParams {
  page?: number;
  search?: string;
  perPage?: number;
  tag?: string;
}

/* ================= NOTES ================= */

export const fetchNotes = async (
  params: FetchNotesParams,
  cookies: string,
): Promise<NotesResponse> => {
  const res = await api.get<NotesResponse>("/notes", {
    params,
    headers: {
      Cookie: cookies,
    },
  });

  return res.data;
};

export const fetchNoteById = async (
  id: string,
  cookies: string,
): Promise<Note> => {
  const res = await api.get<Note>(`/notes/${id}`, {
    headers: {
      Cookie: cookies,
    },
  });

  return res.data;
};

/* ================= USER ================= */

export const getMe = async (cookies: string): Promise<User> => {
  const res = await api.get<User>("/users/me", {
    headers: {
      Cookie: cookies,
    },
  });

  return res.data;
};
