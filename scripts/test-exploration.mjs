import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const directory = mkdtempSync(join(tmpdir(), 'chest-exploration-'));
const require = createRequire(import.meta.url);
const originalFetch = globalThis.fetch;
try {
 execFileSync(process.execPath, ['node_modules/typescript/bin/tsc','app/api/exploration/route.ts','lib/exploration.ts','--outDir',directory,'--module','commonjs','--target','es2022','--skipLibCheck','--esModuleInterop']);
 const lib = require(join(directory,'lib/exploration.js'));
 assert.deepEqual(lib.parseProgress('{broken'), []);
 assert.deepEqual(lib.parseProgress('[1,1,-2,"3",4,null]'), [1,4]);
 assert.deepEqual(lib.project({x_pos:-100,y_pos:50},{origin:[1000,2000]}),[900,2050]);
 let pointRequests=0;
 const point=(id,label,x=1)=>({id,label_id:label,x_pos:x,y_pos:2,area_id:1,z_level:0});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  let data;
  if(path.endsWith('/map/info')) data={info:{detail_v2:{origin:[1000,2000],total_size:[4096,4096],min_zoom:-3,max_zoom:0,map_version:'a'.repeat(32)}}};
  else if(path.endsWith('/label/tree')) data={tree:[{name:'Chests',children:[{id:17,name:'Common Chest'}]},{name:'Puzzle Chest',children:[{id:69,name:'Buried Chest'}]}]};
  else if(path.endsWith('/get_area_pageLabel')) data={list:[{id:1,name:'Mondstadt',map_id:2}]};
  else {pointRequests++;data={point_list:[point(100,69),point(101,17),point(102,999),point(103,69,'bad')]};}
  return Response.json({retcode:0,data});
 };
 const routePath=join(directory,'app/api/exploration/route.js');
 let {GET}=require(routePath);
 const get=category=>GET(new Request(`https://example.com/api/exploration${category===undefined?'':`?category=${category}`}`));
 assert.equal((await get()).status,200);
 assert.deepEqual((await (await get(69)).json()).points.map(p=>p.id),[100]);
 assert.deepEqual((await (await get(17)).json()).points.map(p=>p.id),[101]);
 assert.equal(pointRequests,1,'categories reuse the normalized upstream fetch');
 assert.equal((await get('bogus')).status,400);
 assert.equal((await get(999)).status,400);
 delete require.cache[routePath];({GET}=require(routePath));
 globalThis.fetch=async()=>Response.json({retcode:-1,data:null});
 const failed=await get();assert.equal(failed.status,502);assert.equal(failed.headers.get('Cache-Control'),'no-store');
 console.log('Passed: coordinate alignment, corrupt progress recovery, ID deduplication, category isolation, upstream reuse, invalid requests and upstream failure.');
} finally {globalThis.fetch=originalFetch;rmSync(directory,{recursive:true,force:true});}
