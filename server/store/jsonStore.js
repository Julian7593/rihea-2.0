import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function ensureFile(filePath, createInitialState) {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    const initialState = createInitialState();
    await writeFile(filePath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
  }
}

export function createJsonFileStore({ filePath, createInitialState }) {
  return {
    async read() {
      await ensureFile(filePath, createInitialState);
      const raw = await readFile(filePath, "utf8");
      return JSON.parse(raw);
    },
    async write(nextState) {
      await ensureFile(filePath, createInitialState);
      await writeFile(filePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
      return nextState;
    },
  };
}

export function createMemoryStore(initialState) {
  let state = structuredClone(initialState);

  return {
    async read() {
      return structuredClone(state);
    },
    async write(nextState) {
      state = structuredClone(nextState);
      return structuredClone(state);
    },
  };
}
