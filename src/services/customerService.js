/**
 * Mock customer list.
 *
 * It lives in a separate service so the profile page can count customers without
 * duplicating the data across the page. This keeps the app easy to understand for
 * a new React developer and mirrors the current mock-service style.
 */
const mockDelay = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const mockRequest = async (payload) => {
  await mockDelay();
  return payload;
};

const customers = [
  { id: "cust-01", name: "Ada Omale", phone: "+234 812 222 1144" },
  { id: "cust-02", name: "Chinedu Ayo", phone: "+234 803 457 9912" },
  { id: "cust-03", name: "Mariam Yusuf", phone: "+234 814 576 8831" },
  { id: "cust-04", name: "Tunde Lawal", phone: "+234 806 117 5590" },
  { id: "cust-05", name: "Ruth Okafor", phone: "+234 810 328 7849" },
  { id: "cust-06", name: "Kemi Bello", phone: "+234 812 311 6992" },
];

export async function getCustomers() {
  return mockRequest([...customers]);
}
