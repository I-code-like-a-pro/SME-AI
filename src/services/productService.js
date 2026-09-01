/**
 * Product service wrapper.
 *
 * The app stores inventory in localStorage under src/lib/storage.ts. For the
 * profile snapshot we treat inventory items as the product list and count them
 * here so the page can show live data without duplicating any numbers.
 */
import { getInventory } from "@/lib/storage";

const mockDelay = (ms = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));
const mockRequest = async (payload) => {
  await mockDelay();
  return payload;
};

export async function getProducts() {
  const products = await getInventory();

  if (products.length > 0) {
    return mockRequest(products);
  }

  return mockRequest([
    { id: "seed-1", name: "Rice" },
    { id: "seed-2", name: "Cooking Oil" },
    { id: "seed-3", name: "Soap" },
  ]);
}
