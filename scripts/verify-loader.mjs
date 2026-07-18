/**
 * Module loader for verify-store.mjs. Lets the real app source run under plain
 * Node by resolving the `@/` path alias and swapping React Native's
 * AsyncStorage for an in-memory stub. Node 22+ strips the TypeScript types.
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), '../src');

const ASYNC_STORAGE_STUB = `
const mem = new Map();
export default {
  getItem: async (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: async (k, v) => { mem.set(k, v); },
  removeItem: async (k) => { mem.delete(k); },
};
`;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@react-native-async-storage/async-storage') {
    return { url: 'stub:async-storage', shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    const bare = resolvePath(SRC, specifier.slice(2));
    // The alias omits the extension; .ts covers everything we import here
    // except the seed JSON, which carries its own.
    const withExt = bare.endsWith('.json') ? bare : `${bare}.ts`;
    return nextResolve(pathToFileURL(withExt).href, context);
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === 'stub:async-storage') {
    return { format: 'module', source: ASYNC_STORAGE_STUB, shortCircuit: true };
  }
  return nextLoad(url, context);
}
