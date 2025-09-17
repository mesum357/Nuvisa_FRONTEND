import { localStorageEnums } from "@/enums/localstorage.enums";

export function localStorageGateway<T>(
  key: string,
  keyTypevalue,
  value = null
): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (keyTypevalue === localStorageEnums.SET && value !== null) {
    localStorage.setItem(key, value);
    return null;
  } else {
    const item = localStorage.getItem(key);
    return item !== null ? (item as unknown as T) : null;
  }
}
