export function formatComponentList(names: string[]): string {
  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return `<${names[0]}>`;
  }

  if (names.length === 2) {
    return `<${names[0]}> or <${names[1]}>`;
  }

  const allButLast = names.slice(0, -1);
  const last = names[names.length - 1];

  return `${allButLast.map((name) => `<${name}>`).join(", ")}, or <${last}>`;
}
