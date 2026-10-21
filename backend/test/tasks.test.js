import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTask } from '../src/tasks.js';
test('creates defaults and preserves imported identity', () => {
  const task = validateTask({ title: ' Task ' });
  assert.equal(task.title, 'Task');
  assert.equal(task.status, 'inbox');
  assert.deepEqual(validateTask(task, { imported: true }), task);
});
test('rejects invalid dates, empty titles, oversized fields and unknown fields', () => {
  for (const input of [{title:' '},{title:'Task',due:'2026-02-30'},{title:'x'.repeat(121)},{title:'Task',status:'other'},{title:'Task',$set:{} }]) assert.throws(() => validateTask(input));
});
test('patches only supplied fields and rejects changes to identity', () => {
  assert.deepEqual(validateTask({status:'done'}, {partial:true}), {status:'done'});
  assert.throws(() => validateTask({id:'changed'}, {partial:true}));
});
