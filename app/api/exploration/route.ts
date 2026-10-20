import { validPoint, type Point, type Terrain, type Area } from '../../../lib/exploration';
type SourceData = { info?: { detail_v2?: Terrain }; tree?: {name:string;children?:{id:number;name:string}[]}[]; list?: (Area & {map_id:number})[]; point_list?: Point[] };
const BASE = 'https://sg-public-api-static.hoyolab.com/common/map_user/ys_obc';
let pointsRequest: Promise<Point[]> | undefined;
const cache = new Map<string, { until: number; value: unknown }>();
async function upstream(path: string) {
 const response = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}app_sn=ys_obc`, { headers: { 'x-rpc-language': 'en-us' }, signal: AbortSignal.timeout(20000) });
 if (!response.ok) throw new Error('Map source unavailable');
 const body = await response.json() as {retcode?:number;data?:SourceData};
 if (body.retcode !== 0 || !body.data) throw new Error('Map source unavailable');
 return body.data;
}
async function catalog() {
 const hit = cache.get('catalog'); if (hit && hit.until > Date.now()) return hit.value as Awaited<ReturnType<typeof loadCatalog>>;
 const value = await loadCatalog(); cache.set('catalog', { until: Date.now()+3600000, value }); return value;
}
async function loadCatalog() {
 const [map, labels, regions] = await Promise.all([upstream('/v3/map/info?map_id=2'), upstream('/v1/map/label/tree?map_id=2'), upstream('/v1/map/get_area_pageLabel?map_id=2')]);
 const terrain = map.info?.detail_v2;
 if (!terrain || !/^[a-f0-9]{32}$/.test(terrain.map_version) || !Array.isArray(terrain.origin) || !terrain.origin.every(Number.isFinite) || !Array.isArray(terrain.total_size) || !terrain.total_size.every(Number.isFinite)) throw new Error('Unexpected terrain data');
 const categories: {id:number;name:string;group:string}[] = [];
 for (const group of labels.tree || []) if (['Chests','Puzzle Chest'].includes(group.name)) for (const item of group.children || []) if (Number.isSafeInteger(item.id)) categories.push({id:item.id,name:String(item.name).replace(/\s+/g,' '),group:group.name});
 if (!categories.length || !Array.isArray(regions.list)) throw new Error('Unexpected map catalog');
 const areas = regions.list.filter((a: {map_id:number}) => a.map_id === 2).map((a: {id:number;name:string;l_x:number;l_y:number;r_x:number;r_y:number}) => ({id:a.id,name:a.name,l_x:a.l_x,l_y:a.l_y,r_x:a.r_x,r_y:a.r_y}));
 return { terrain, categories, areas };
}
export async function GET(request: Request) {
 try {
  const label = new URL(request.url).searchParams.get('category');
  const meta = await catalog();
  if (label === null) return Response.json(meta, {headers:{'Cache-Control':'public, max-age=600'}});
  if (!/^\d+$/.test(label) || !meta.categories.some(c=>c.id===Number(label))) return Response.json({error:'Unknown chest category'}, {status:400});
  const hit = cache.get('points');
  let all: Point[];
  if (hit && hit.until > Date.now()) all = hit.value as Point[];
  else {
   // The public endpoint's label_ids filter can return an empty success response.
   // Fetch once, normalize only exploration categories, then filter locally.
   pointsRequest ??= upstream('/v1/map/point/list?map_id=2').then(data => {
    if (!Array.isArray(data.point_list) || !data.point_list.length) throw new Error('Unexpected location data');
    const allowed = new Set(meta.categories.map(c=>c.id));
    const normalized: Point[] = data.point_list.filter((p: Point)=>p && allowed.has(p.label_id) && validPoint(p)).map((p: Point)=>({id:p.id,label_id:p.label_id,x_pos:p.x_pos,y_pos:p.y_pos,area_id:p.area_id,z_level:p.z_level}));
    cache.set('points', {until:Date.now()+600000,value:normalized});
    return normalized;
   }).finally(()=>{pointsRequest=undefined});
   all = await pointsRequest;
  }
  const points = all.filter(p=>p.label_id===Number(label));
  const value = {points, fetchedAt:new Date().toISOString()};
  return Response.json(value, {headers:{'Cache-Control':'public, max-age=300'}});
 } catch { return Response.json({error:'HoYoLAB map data is temporarily unavailable. Please retry.'}, {status:502, headers:{'Cache-Control':'no-store'}}); }
}
