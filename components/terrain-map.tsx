'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, LocateFixed, Minus, Plus } from 'lucide-react';
import { project, type Category, type Point, type Terrain } from '../lib/exploration';
type Props = { terrain: Terrain; category: Category | undefined; points: Point[]; found: number[]; selected: number | null; onSelect: (point: Point)=>void };
export default function TerrainMap({terrain,category,points,found,selected,onSelect}:Props) {
 const root=useRef<HTMLDivElement>(null), drag=useRef<{x:number;y:number;cx:number;cy:number}|null>(null);
 const [size,setSize]=useState({w:1000,h:700}),[view,setView]=useState({x:terrain.origin[0],y:terrain.origin[1],zoom:-1}),[tileError,setTileError]=useState(false),[tileRetry,setTileRetry]=useState(0);
 useEffect(()=>{const el=root.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setSize({w:entry.contentRect.width,h:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect()},[]);
 function center(){ if(!points.length)return; const positions=points.map(p=>project(p,terrain)); const xs=positions.map(p=>p[0]),ys=positions.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);setView({x:(minX+maxX)/2,y:(minY+maxY)/2,zoom:Math.max(-4,Math.min(1,Math.log2(Math.min((size.w-100)/Math.max(100,maxX-minX),(size.h-100)/Math.max(100,maxY-minY)))))}); }
 // Reframe when the category/region result set changes, not when a marker is selected.
 // Fit the viewport to the newly loaded category and selection.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{center()},[points]); // eslint-disable-line react-hooks/exhaustive-deps
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{const point=points.find(p=>p.id===selected);if(point){const [x,y]=project(point,terrain);setView(v=>({...v,x,y,zoom:Math.max(0,v.zoom)}))}},[selected]); // eslint-disable-line react-hooks/exhaustive-deps
 const scale=2**view.zoom, nativeZoom=Math.max(terrain.min_zoom,Math.min(terrain.max_zoom,Math.floor(view.zoom))),tileWorld=256/2**nativeZoom;
 const left=view.x-size.w/2/scale,top=view.y-size.h/2/scale;
 const tiles=[];
 for(let y=Math.max(0,Math.floor(top/tileWorld));y<=Math.min(Math.ceil(terrain.total_size[1]/tileWorld)-1,Math.floor((top+size.h/scale)/tileWorld));y++) for(let x=Math.max(0,Math.floor(left/tileWorld));x<=Math.min(Math.ceil(terrain.total_size[0]/tileWorld)-1,Math.floor((left+size.w/scale)/tileWorld));x++) tiles.push({x,y,url:`https://act-webstatic.hoyoverse.com/map_manage/map/2/${terrain.map_version}/${x}_${y}_${nativeZoom<0?'N':'P'}${Math.abs(nativeZoom)}.png`});
 const visible=useMemo(()=>{
  const groups=new Map<string,{x:number;y:number;points:Point[]}>();
  for(const p of points){const [px,py]=project(p,terrain),x=(px-left)*scale,y=(py-top)*scale;if(x < -30||y < -30||x>size.w+30||y>size.h+30)continue;const key=view.zoom<0?`${Math.floor(x/45)},${Math.floor(y/45)}`:String(p.id);const group=groups.get(key);if(group)group.points.push(p);else groups.set(key,{x,y,points:[p]});}return [...groups.values()];
 },[points,terrain,left,top,scale,size,view.zoom]);
 function zoom(delta:number){setView(v=>({...v,zoom:Math.max(-4,Math.min(2,v.zoom+delta))}));}
 return <div className="terrain" ref={root} tabIndex={0} role="region" aria-label="Teyvat map. Drag to pan, use plus and minus to zoom, or arrow keys to move." onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='+'||e.key==='='){zoom(.5);e.preventDefault()}if(e.key==='-'){zoom(-.5);e.preventDefault()}const move:Record<string,number[]>={ArrowLeft:[-100,0],ArrowRight:[100,0],ArrowUp:[0,-100],ArrowDown:[0,100]};if(move[e.key]){e.preventDefault();const [x,y]=move[e.key];setView(v=>({...v,x:v.x+x/scale,y:v.y+y/scale}))}}} onPointerDown={e=>{if((e.target as HTMLElement).closest('button,a'))return;drag.current={x:e.clientX,y:e.clientY,cx:view.x,cy:view.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(d)setView(v=>({...v,x:Math.max(0,Math.min(terrain.total_size[0],d.cx-(e.clientX-d.x)/scale)),y:Math.max(0,Math.min(terrain.total_size[1],d.cy-(e.clientY-d.y)/scale))}))}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
 {tiles.map(t=><img key={`${tileRetry}-${nativeZoom}-${t.x}-${t.y}`} className="terrain-tile" src={t.url} alt="" draggable={false} onError={()=>setTileError(true)} style={{left:(t.x*tileWorld-left)*scale,top:(t.y*tileWorld-top)*scale,width:tileWorld*scale+.5,height:tileWorld*scale+.5}}/>)}
 {visible.map(g=>g.points.length>1?<button key={g.points[0].id} className="cluster" style={{left:g.x,top:g.y}} aria-label={`Zoom into ${g.points.length} locations`} onClick={()=>{const [x,y]=project(g.points[0],terrain);setView(v=>({x,y,zoom:Math.min(2,v.zoom+1)}))}}>{g.points.length}</button>:<button key={g.points[0].id} className={`live-marker ${selected===g.points[0].id?'selected':''} ${found.includes(g.points[0].id)?'found':''}`} style={{left:g.x,top:g.y}} aria-label={`${category?.name||'Map'} location ${g.points[0].id}${found.includes(g.points[0].id)?', found':''}`} onClick={()=>onSelect(g.points[0])}>{found.includes(g.points[0].id)?<Check size={18}/>:<img src={category?.icon||'/treasure-chest.png'} alt="" onError={e=>{e.currentTarget.src='/treasure-chest.png'}}/>}</button>)}
 <div className="map-actions"><button aria-label="Zoom in" onClick={()=>zoom(.5)}><Plus size={19}/></button><button aria-label="Zoom out" onClick={()=>zoom(-.5)}><Minus size={19}/></button><button aria-label="Fit filtered locations" onClick={center}><LocateFixed size={19}/></button></div>
 <div className="map-count">{points.length.toLocaleString()} locations · drag to explore</div>
 {tileError&&<div className="tile-warning" role="status">Some terrain tiles could not load. <button onClick={()=>{setTileError(false);setTileRetry(n=>n+1)}}>Retry tiles</button></div>}
 <a className="map-credit" href="https://act.hoyolab.com/ys/app/interactive-map/index.html?lang=en-us#/map/2" target="_blank" rel="noreferrer">Map & data © HoYoverse · HoYoLAB</a>
 </div>
}
