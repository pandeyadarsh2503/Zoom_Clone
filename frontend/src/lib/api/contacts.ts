import { apiClient } from "./client";

export type ContactStatus = "online" | "busy" | "offline";

export interface Contact {
  id: string;
  name: string;
  email: string;
  title: string | null;
  status: ContactStatus;
  accent: string | null;
}

interface ContactList {
  items: Contact[];
  total: number;
}

export interface NewContact {
  name: string;
  email: string;
  title?: string;
}

export const contactsApi = {
  list(): Promise<ContactList> {
    return apiClient.get<ContactList>("/api/v1/contacts");
  },
  create(payload: NewContact): Promise<Contact> {
    return apiClient.post<Contact>("/api/v1/contacts", payload);
  },
  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/contacts/${id}`);
  },
};
