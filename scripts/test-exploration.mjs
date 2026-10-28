import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const snapshot = JSON.parse(readFileSync(fileURLToPath(new URL('../data/exploration.json', import.meta.url)), 'utf8'));
const { catalog, points } = snapshot;
const shown = [694, 17, 44, 45, 46, 269, 18, 70, 64, 71, 77, 79, 69, 798, 836];
const valid = point => Number.isSafeInteger(point.id) && point.id > 0 && Number.isFinite(point.x_pos) && Number.isFinite(point.y_pos);

assert.deepEqual([1, 1, -2, '3', 4, null].filter(value => Number.isSafeInteger(value) && value > 0), [1, 1, 4]);
assert.deepEqual([-100 + 1000, 50 + 2000], [900, 2050]);
assert.equal(catalog.terrain.map_version, 'eea752b746ae1f2e0c1988a574f2b7b0');
assert.deepEqual(catalog.terrain.origin, [24206, 8918]);
assert.equal(catalog.areas.length, 8);
assert.deepEqual(catalog.categories.map(category => category.id), shown);
assert.ok(catalog.categories.every(category => category.icon.startsWith('https://')));
assert.ok(points.length > 5000);
assert.equal(new Set(points.map(point => point.id)).size, points.length, 'location IDs are unique');
assert.ok(points.every(valid), 'all snapshot points have safe coordinates');
for (const id of shown) {
  const category = catalog.categories.find(item => item.id === id);
  const categoryPoints = points.filter(point => point.label_id === id);
  assert.equal(categoryPoints.length, category.point_count, `${category.name} count matches snapshot`);
}
assert.equal(points.filter(point => point.label_id === 999).length, 0);
console.log(`Passed: official terrain metadata, ${catalog.categories.length} icon categories, ${points.length} valid locations, unique IDs and category isolation.`);
