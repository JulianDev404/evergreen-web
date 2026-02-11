// apps/web/src/utils/getServices.ts
import { getPayload } from "payload";
import config from "evergreen-payload";

const API_URL = import.meta.env.PUBLIC_API_URL;

export async function getAllServices() {
  try {
    const res = await fetch(
      `${API_URL}/api/services?depth=2&where[active][equals]=true&limit=1000`,
    );
    const data = await res.json();

    return data.docs;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}
