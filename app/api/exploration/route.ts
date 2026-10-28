import snapshot from '../../../data/exploration.json';
import { validPoint, type Catalog, type Point } from '../../../lib/exploration';

type Snapshot = { catalog: Catalog; points: Point[] };
const SHOWN_LABEL_IDS = new Set([694,17,44,45,46,269,18,70,64,71,77,79,69,798,836]);
const DATA = snapshot as Snapshot;
const cache = new Map<string, { until: number; value: unknown }>();

function catalog() {
 const hit = cache.get('catalog');
 if (hit && hit.until > Date.now()) return hit.value as Catalog;
 cache.set('catalog', { until: Date.now()+3600000, value: DATA.catalog });
 return DATA.catalog;
}

export async function GET(request: Request) {
 try {
  const label = new URL(request.url).searchParams.get('category');
  const meta = catalog();
  if (label === null) return Response.json(meta, {headers:{'Cache-Control':'public, max-age=600', 'X-Map-Data':'HoYoLAB snapshot'} });
  const categoryId = Number(label);
  if (!/^\d+$/.test(label) || !SHOWN_LABEL_IDS.has(categoryId) || !meta.categories.some(c=>c.id===categoryId)) return Response.json({error:'Unknown map icon category'}, {status:400});
  const hit = cache.get('points');
  const all = hit && hit.until > Date.now() ? hit.value as Point[] : DATA.points;
  if (!hit || hit.until <= Date.now()) cache.set('points', {until:Date.now()+600000,value:all});
  const points = all.filter(p=>p.label_id===categoryId && validPoint(p));
  return Response.json({points, fetchedAt:snapshot.fetched_at}, {headers:{'Cache-Control':'public, max-age=300', 'X-Map-Data':'HoYoLAB snapshot'} });
 } catch { return Response.json({error:'HoYoLAB map data is temporarily unavailable. Please retry.'}, {status:502, headers:{'Cache-Control':'no-store'}}); }
}
