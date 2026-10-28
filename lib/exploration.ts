export type Point = { id: number; label_id: number; x_pos: number; y_pos: number; area_id: number; z_level: number };
export type Category = { id: number; name: string; group: string; icon: string; point_count: number };
export type Area = { id: number; name: string; l_x: number; l_y: number; r_x: number; r_y: number };
export type Terrain = { origin: number[]; total_size: number[]; map_version: string; min_zoom: number; max_zoom: number };
export type Catalog = { categories: Category[]; areas: Area[]; terrain: Terrain };
export const MAP_URL = 'https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=en-us';
export function project(point: Point, terrain: Terrain) { return [point.x_pos + terrain.origin[0], point.y_pos + terrain.origin[1]]; }
export function validPoint(p: Point) { return Number.isSafeInteger(p.id) && p.id > 0 && Number.isFinite(p.x_pos) && Number.isFinite(p.y_pos); }
export function parseProgress(raw: string | null): number[] {
 try { const value: unknown = JSON.parse(raw || '[]'); return Array.isArray(value) ? [...new Set(value.filter((v): v is number => Number.isSafeInteger(v) && v > 0))] : []; } catch { return []; }
}
