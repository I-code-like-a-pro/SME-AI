/**
 * Sales service wrapper.
 *
 * The app already stores sales in localStorage via src/lib/storage.ts. This mock
 * service keeps the same async pattern while exposing a clean sales API for the
 * profile page and any future dashboard/profile features.
 */
import { getSales as getStoredSales } from "@/lib/storage";

const mockDelay = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const mockRequest = async (payload) => {
  await mockDelay();
  return payload;
};

export async function getSales() {
  const sales = await getStoredSales();
  return mockRequest(sales);
}
