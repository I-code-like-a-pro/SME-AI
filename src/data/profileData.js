/**
 * This is the mock profile for the logged-in business owner.
 *
 * Keeping it in its own data file makes the page easier to replace with an API
 * later without changing the page component. The app is still frontend-only, so
 * we store the single owner object here and let the service layer read and update
 * it in memory.
 */
export const profile = {
  id: "dan-owner-001",
  fullName: "Daniel Ambrose",
  role: "Business Owner",
  businessName: "Daniels store",
  phone: "+2347046253879",
  email: "danielambrose.web@gmail.com",
  dateJoined: "2023-02-14T00:00:00.000Z",
};

export default profile;
