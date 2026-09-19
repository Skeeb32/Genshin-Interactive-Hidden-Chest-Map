"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Compass, Layers3, LocateFixed, MapPin, Search, Sparkles, X } from "lucide-react";

type Chest = { id:number; title:string; region:string; area:string; type:string; method:string; x:number; y:number; difficulty:"Easy"|"Medium"|"Hard"; note:string; reward:number };

const chests: Chest[] = [
  { id:1,title:"Ashen Crater Dig Spot",region:"Natlan",area:"Ochkanatlan",type:"Precious",method:"Buried",x:63,y:27,difficulty:"Medium",reward:10,note:"Defeat the three nearby warriors, then investigate the disturbed earth beside the cracked obsidian pillar." },
  { id:2,title:"Saurian Trail Reward",region:"Natlan",area:"Tezcatepetonco Range",type:"Exquisite",method:"Puzzle",x:47,y:38,difficulty:"Easy",reward:5,note:"Follow the Monetoo trail through all four painted stones. The chest appears after the final mural lights up." },
  { id:3,title:"Forgotten Warrior Trial",region:"Natlan",area:"Quahuacan Cliff",type:"Luxurious",method:"Challenge",x:71,y:52,difficulty:"Hard",reward:10,note:"Complete the hidden warrior trial in under 45 seconds. Enter from the cave opening on the cliff's western face." },
  { id:4,title:"Echoes Below the Falls",region:"Fontaine",area:"Morte Region",type:"Remarkable",method:"Quest",x:31,y:62,difficulty:"Medium",reward:5,note:"Available after completing Search in the Algae Sea. Dive beneath the waterfall and activate the conch." },
  { id:5,title:"Ancient Stone Table",region:"Liyue",area:"Chenyu Vale",type:"Precious",method:"Puzzle",x:22,y:34,difficulty:"Medium",reward:10,note:"Place three Simulacra around the stone table. One is hidden on the ridge directly north of this marker." },
  { id:6,title:"Windrise Camp Secret",region:"Mondstadt",area:"Galesong Hill",type:"Common",method:"Buried",x:18,y:72,difficulty:"Easy",reward:2,note:"Dig at the small campfire between the two trees. No quest is required." },
  { id:7,title:"Clockwork Rooftop Run",region:"Fontaine",area:"Court of Fontaine",type:"Exquisite",method:"Challenge",x:38,y:22,difficulty:"Hard",reward:5,note:"Start the rooftop time trial at dusk and collect all 18 Hydro Particles." },
  { id:8,title:"Night Spirit Graffiti",region:"Natlan",area:"Basin of Unnumbered Flames",type:"Remarkable",method:"Puzzle",x:79,y:69,difficulty:"Easy",reward:5,note:"Use an Iktomisaur to scan the hidden Nightspirit graffiti on the cliff wall." },
  { id:9,title:"Seelie Reunion",region:"Liyue",area:"Minlin",type:"Luxurious",method:"Seelie",x:55,y:76,difficulty:"Hard",reward:10,note:"Guide all three Seelie to the sealed court. The last starts inside the breakable amber to the southeast." },
];
const regions=["All","Natlan","Fontaine","Liyue","Mondstadt"];
const methods=["All types","Buried","Puzzle","Challenge","Quest","Seelie"];
const markerColor:Record<string,string>={Common:"#9ab7bf",Exquisite:"#51a8b5",Precious:"#bd7bd3",Luxurious:"#e8a84b",Remarkable:"#55b79d"};

export default function Home(){
 const [region,setRegion]=useState("All"),[method,setMethod]=useState("All types"),[query,setQuery]=useState("");
 const [selected,setSelected]=useState<Chest|null>(chests[0]),[found,setFound]=useState<number[]>([]),[hideFound,setHideFound]=useState(false),[panelOpen,setPanelOpen]=useState(true);
 useEffect(()=>{const saved=localStorage.getItem("hidden-chest-found");if(saved)setFound(JSON.parse(saved))},[]);
 useEffect(()=>{
  const context=(document as unknown as {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  void Promise.resolve(context.registerTool({
   name:"mark_hidden_chests_found",title:"Mark hidden chests found",description:"Mark one or more visible Hidden Chest Atlas locations as found using their numeric IDs.",
   inputSchema:{type:"object",properties:{ids:{type:"array",items:{type:"number"},minItems:1}},required:["ids"],additionalProperties:false},
   annotations:{readOnlyHint:false,untrustedContentHint:false},
   execute(input:unknown){const ids=(input as {ids?:unknown}).ids;if(!Array.isArray(ids)||ids.some(id=>!Number.isInteger(id)||!chests.some(c=>c.id===id)))throw new Error("Every ID must match a known chest.");const next=Array.from(new Set([...found,...ids as number[]]));setFound(next);localStorage.setItem("hidden-chest-found",JSON.stringify(next));return {marked:ids,foundCount:next.length};}
  },{signal:lifecycle.signal})).catch(()=>{});
  return()=>lifecycle.abort();
 },[found]);
 const filtered=useMemo(()=>chests.filter(c=>(region==="All"||c.region===region)&&(method==="All types"||c.method===method)&&(`${c.title} ${c.area}`.toLowerCase().includes(query.toLowerCase()))&&(!hideFound||!found.includes(c.id))),[region,method,query,hideFound,found]);
 function toggleFound(id:number){const next=found.includes(id)?found.filter(x=>x!==id):[...found,id];setFound(next);localStorage.setItem("hidden-chest-found",JSON.stringify(next))}
 return <main className="app-shell">
  <header className="topbar">
   <div className="brand"><span className="brand-mark"><Compass size={21}/></span><div><strong>Hidden Chest Atlas</strong><small>Compass-undetectable finds</small></div></div>
   <div className="search-wrap"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search locations" aria-label="Search chest locations"/></div>
   <button className="account-button"><span className="account-dot"/>Local progress</button>
  </header>
  <aside className="filters">
   <div className="filter-head"><div><span className="eyebrow">EXPLORATION</span><h1>Hidden chests</h1></div><button className="icon-button" aria-label="Collapse filters"><ChevronLeft size={19}/></button></div>
   <div className="progress-card"><div className="progress-copy"><span>{found.length} of {chests.length} found</span><strong>{Math.round(found.length/chests.length*100)}%</strong></div><div className="progress-track"><span style={{width:`${found.length/chests.length*100}%`}}/></div><small>Saved on this device</small></div>
   <label className="field-label">Region</label><div className="region-grid">{regions.map(x=><button key={x} onClick={()=>setRegion(x)} className={region===x?"active":""}>{x}</button>)}</div>
   <label className="field-label" htmlFor="method">Discovery type</label><select id="method" value={method} onChange={e=>setMethod(e.target.value)}>{methods.map(x=><option key={x}>{x}</option>)}</select>
   <label className="toggle-row"><span><strong>Hide found</strong><small>Show only what remains</small></span><input type="checkbox" checked={hideFound} onChange={e=>setHideFound(e.target.checked)}/></label>
   <div className="legend"><span className="field-label">CHEST RARITY</span>{Object.entries(markerColor).map(([name,color])=><span key={name}><i style={{background:color}}/>{name}</span>)}</div>
   <div className="truth-note"><Sparkles size={17}/><p><strong>Built for honest tracking</strong><br/>HoYoLAB reports totals, not exact chest locations. Every find here is checked off by you.</p></div>
  </aside>
  <section className="map" aria-label="Interactive hidden chest map">
   <div className="map-vignette"/>
   {filtered.map(c=><button key={c.id} className={`marker ${found.includes(c.id)?"is-found":""} ${selected?.id===c.id?"is-selected":""}`} data-rarity={c.type} style={{left:`${c.x}%`,top:`${c.y}%`,"--marker":markerColor[c.type]} as React.CSSProperties} onClick={()=>{setSelected(c);setPanelOpen(true)}} aria-label={`${c.title}, ${c.type} chest`}><span><img src="/treasure-chest.png" alt=""/>{found.includes(c.id)&&<b><Check size={12}/></b>}</span></button>)}
   {filtered.length===0&&<div className="empty-map"><Search size={24}/><strong>No hidden chests match</strong><span>Try another region or discovery type.</span></div>}
   <div className="map-actions"><button aria-label="Center map"><LocateFixed size={19}/></button><button aria-label="Map layers"><Layers3 size={19}/></button></div><div className="map-count"><strong>{filtered.length}</strong> hidden locations</div>
  </section>
  {selected&&panelOpen&&<aside className="detail-panel"><button className="close-button" onClick={()=>setPanelOpen(false)} aria-label="Close location details"><X size={19}/></button><div className="detail-art"><div className="art-ridge"/><span className="rarity-pill" style={{background:markerColor[selected.type]}}>{selected.type}</span></div><div className="detail-body"><span className="location-line">{selected.region} · {selected.area}</span><h2>{selected.title}</h2><div className="tag-row"><span>{selected.method}</span><span>{selected.difficulty}</span><span>+{selected.reward} Primogems</span></div><div className="guide"><span>HOW TO FIND IT</span><p>{selected.note}</p></div><button className={`found-button ${found.includes(selected.id)?"done":""}`} onClick={()=>toggleFound(selected.id)}>{found.includes(selected.id)?<><Check size={18}/>Marked as found</>:<><MapPin size={18}/>Mark as found</>}</button><p className="sync-copy">This location is saved manually and does not alter your in-game account.</p></div></aside>}
 </main>
}
