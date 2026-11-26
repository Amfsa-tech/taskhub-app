export function newerVersion(latest: string, installed: string): boolean {
  const parse = (version: string) => {
    if (!/^\d+(?:\.\d+){0,3}$/.test(version)) throw new Error('The store did not return a valid app version.');
    return version.split('.').map(Number);
  };
  const a = parse(latest), b = parse(installed);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}
export async function withStoreTimeout<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('The store took too long to respond. Please try again.')), 20000);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}
