import { describe, it, expect } from "vitest";
import { getProfile, updateProfile } from "./profileService";

describe("profileService", () => {
  it("loads the current mock profile and exposes the shape expected by the app", async () => {
    const profile = await getProfile();

    expect(profile).toMatchObject({
      id: expect.any(String),
      fullName: expect.any(String),
      role: expect.any(String),
      businessName: expect.any(String),
      phone: expect.any(String),
      email: expect.any(String),
      dateJoined: expect.any(String),
    });
  });

  it("updates the stored profile with patch data", async () => {
    const updated = await updateProfile({
      fullName: "Grace Okafor",
      role: "Founder & Business Owner",
    });

    expect(updated).toMatchObject({
      fullName: "Grace Okafor",
      role: "Founder & Business Owner",
    });

    const latest = await getProfile();
    expect(latest.fullName).toBe("Grace Okafor");
    expect(latest.role).toBe("Founder & Business Owner");
  });
});
