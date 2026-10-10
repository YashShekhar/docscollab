export interface LocalUser {
  id: string;
  name: string;
  color: string;
}

const COLOR_PALETTE = [
  "#2563EB", // Blue
  "#7C3AED", // Violet
  "#DB2777", // Pink
  "#DC2626", // Red
  "#D97706", // Amber
  "#059669", // Emerald
  "#0D9488", // Teal
  "#0284C7", // Sky
  "#4F46E5", // Indigo
  "#9333EA", // Purple
  "#E11D48", // Rose
];

const ANIMALS = [
  "Falcon", "Otter", "Panda", "Fox", "Koala", "Dolphin", "Eagle",
  "Lynx", "Badger", "Owl", "Tiger", "Penguin", "Wolf", "Hawk", "Seal"
];

const ADJECTIVES = [
  "Swift", "Clever", "Calm", "Brave", "Curious", "Bright", "Eager",
  "Gentle", "Keen", "Lively", "Nimble", "Radiant", "Serene", "Wise"
];

export function generateRandomUser(): LocalUser {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  const id = "usr_" + Math.random().toString(36).substring(2, 9);

  return {
    id,
    name: `${adj} ${animal}`,
    color,
  };
}

export function getStoredUser(): LocalUser {
  if (typeof window === "undefined") {
    return {
      id: "anon",
      name: "Anonymous User",
      color: "#2563EB",
    };
  }

  const stored = localStorage.getItem("collab_doc_user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.id && parsed.name && parsed.color) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  const newUser = generateRandomUser();
  localStorage.setItem("collab_doc_user", JSON.stringify(newUser));
  return newUser;
}

export function saveStoredUser(user: LocalUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("collab_doc_user", JSON.stringify(user));
  }
}
