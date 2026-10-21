import { randomUUID } from 'node:crypto';
export function validateTask(input, { partial = false, imported = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Invalid task');
  const output = {};
  const limits = { title: 120, notes: 2000, project: 50, due: 10 };
  const allowed = [...Object.keys(limits), 'status', 'priority', ...(imported ? ['id', 'created'] : [])];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw Error('Unknown task field');
  for (const [key, limit] of Object.entries(limits)) {
    if (partial && input[key] === undefined) continue;
    const value = input[key] ?? (key === 'title' ? null : '');
    if (typeof value !== 'string' || value.length > limit || (key === 'title' && !value.trim())) throw Error(`Invalid ${key}`);
    output[key] = value.trim();
  }
  for (const [key, options, fallback] of [['status', ['inbox','next','doing','done'], 'inbox'], ['priority', ['low','medium','high'], 'medium']]) {
    if (partial && input[key] === undefined) continue;
    const value = input[key] ?? fallback;
    if (!options.includes(value)) throw Error(`Invalid ${key}`);
    output[key] = value;
  }
  if (output.due && (!/^\d{4}-\d{2}-\d{2}$/.test(output.due) || Number.isNaN(Date.parse(output.due)) || new Date(output.due).toISOString().slice(0,10) !== output.due)) throw Error('Invalid due date');
  if (!partial) {
    output.id = imported ? input.id : randomUUID();
    output.created = imported ? input.created : Date.now();
    if (typeof output.id !== 'string' || !output.id.length || output.id.length > 150) throw Error('Invalid task id');
    if (!Number.isSafeInteger(output.created) || output.created < 0) throw Error('Invalid creation time');
  }
  return output;
}
