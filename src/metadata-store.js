const KEY = "arasaac-tableros-metadata";
const MISSING_KEY = "arasaac-tableros-no-encontrados";

export function recordMetadata(entry) {
  const current = JSON.parse(localStorage.getItem(KEY) || "{}");
  current[`${entry.group}/${entry.term}`] = entry;
  localStorage.setItem(KEY, JSON.stringify(current));
}

export function recordMissing(group, term) {
  const current = JSON.parse(localStorage.getItem(MISSING_KEY) || "[]");
  if (!current.some(item => item.group === group && item.term === term)) {
    current.push({ group, term, date: new Date().toISOString() });
    localStorage.setItem(MISSING_KEY, JSON.stringify(current));
  }
}
