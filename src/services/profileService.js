/**
 * Mock profile service.
 *
 * The rest of this project uses async helpers that resolve after a short delay so
 * pages can render a loading state. This file follows that same pattern: a tiny
 * in-memory store is updated and returned as if it came from an API.
 */
import { profile as initialProfile } from "@/data/profileData";

const mockDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const mockRequest = async (payload) => {
  await mockDelay();
  return payload;
};

let profileStore = { ...initialProfile };

export async function getProfile() {
  return mockRequest({ ...profileStore });
}

export async function updateProfile(updates = {}) {
  profileStore = {
    ...profileStore,
    ...updates,
  };

  return mockRequest({ ...profileStore });
}
