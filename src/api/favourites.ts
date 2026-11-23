// Favourites API client — talks to the small Express + SQLite backend
// in server/ (http://localhost:5001, proxied by CRA in development).
//
// NOTE: the backend is the store. If the server isn't running, favourites
// cannot be saved or loaded and the app says so — it does NOT silently
// fall back to localStorage as the store.
import axios from "axios";
import type { Favourite } from "../types";

export async function loadFavourites(): Promise<Favourite[]> {
  const res = await axios.get<Favourite[]>("/api/favourites");
  return res.data;
}

export async function saveFavourite(
  adviceId: number,
  adviceEn: string,
  adviceSw: string | null,
): Promise<Favourite> {
  const res = await axios.post<Favourite>("/api/favourites", {
    adviceId,
    adviceEn,
    adviceSw,
  });
  return res.data;
}

export async function removeFavourite(adviceId: number): Promise<void> {
  await axios.delete(`/api/favourites/${adviceId}`);
}

export async function clearFavourites(): Promise<void> {
  await axios.delete("/api/favourites");
}
