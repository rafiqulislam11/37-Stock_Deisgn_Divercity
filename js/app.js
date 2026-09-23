const $=id=>document.getElementById(id);
const pools={
style:["Minimal","Modern","Corporate","Luxury","Editorial","Geometric","Organic","Abstract","Futuristic","Technology","3D","Isometric","Flat Vector","Line Art","Outline","Monoline","Paper Cut","Glass","Liquid","Neon","Retro","Vintage","Memphis","Bauhaus","Scandinavian","Swiss","Brutalist","Playful","Architectural"],
composition:["Center","Left aligned","Right aligned","Top weighted","Bottom weighted","Diagonal","Radial","Circular","Spiral","Grid","Broken grid","Asymmetric","Symmetric","Rule of thirds","Golden ratio","Full frame","Corner focused","Floating","Layered","Overlapping","Stacked","Scattered","Clustered","Isolated subject","Negative-space dominant","Dense"],
shape:["Circle","Square","Rectangle","Triangle","Polygon","Hexagon","Blob","Wave","Spiral","Arc","Ring","Capsule","Organic shape","Geometric mesh","Grid","Ribbon","Fold","Starburst","Dot","Line"],
color:["Monochrome","Navy blue","Pastel","Earth tone","Neon cyan-magenta","Warm orange-red","Cool blue-violet","Black and gold","Green natural","Corporate blue-gray","Cream terracotta","Purple gradient","Silver metallic","High contrast","Soft neutral"],
background:["Pure white","Pure black","Solid color","Soft gradient","Geometric field","Abstract field","Grid","Dots","Lines","Waves","Blobs","Minimal studio","Architectural","Fluid","Cosmic","Technology","Paper-like","Transparent-style"],
lighting:["Flat","Soft light","Hard light","Rim light","Backlight","Top light","Side light","Studio light","Ambient","Glow","Neon glow","Long shadow","Soft shadow","No shadow","Dramatic"],
texture:["Smooth","Grain","Paper","Fabric","Concrete","Metallic","Glass","Plastic","Wood","Liquid","Noise","Mesh","Matte","Glossy"],
density:["Minimal","Low","Medium","High","Maximum detail"],
position:["Center","Upper-left","Upper-right","Lower-left","Lower-right","Left third","Right third","Top third","Bottom third","Diagonal","Distributed","Edge cropped"],
orientation:["Square","Portrait","Landscape","Wide Banner","Ultra-wide","Vertical Poster","Social Media","Website Hero","Presentation"]
};
let history=JSON.parse(localStorage.getItem("stockDiversityHistory")||"[]"), current=[];
function pick(arr,used=[]){let a=arr.filter(x=>!used.includes(x));return a.length?a[Math.floor(Math.random()*a.length)]:arr[Math.floor(Math.random()*arr.length)]}
function makePrompt(d){
 let cat=$("category").value.trim()||"Abstract Background";
 return `${cat}, ${d.style.toLowerCase()} style, ${d.composition.toLowerCase()} composition, ${d.shape.toLowerCase()} forms, ${d.color.toLowerCase()} palette, ${d.background.toLowerCase()} background, ${d.lighting.toLowerCase()} lighting, ${d.texture.toLowerCase()} surface, ${d.density.toLowerCase()} visual density, subject placed ${d.position.toLowerCase()}, ${d.orientation.toLowerCase()} format, ${$("copySpace").checked?"usable copy space, ":""}${$("vector").checked?"clean editable vector geometry, EPS/SVG-friendly, ":""}professional commercial stock design, clean high-quality finish, no logos, no watermark, no copyrighted characters.`
}
function similarity(a,b){
 const keys=["style","composition","shape","color","background","lighting","texture","density","position","orientation"];
 let same=keys.reduce((n,k)=>n+(a[k]===b[k]?1:0),0);
 return Math.round((same/keys.length)*100);
}
function generate(){
 const n=Math.min(50,Math.max(1,+$("batch").value||10)), threshold=+$("threshold").value;
 current=[]; let attempts=0;
 while(current.length<n && attempts<n*100){
  attempts++;
  const d={style:$("style").value==="Auto Diversity"?pick(pools.style):$("style").value,
    composition:pick(pools.composition),shape:pick(pools.shape),color:pick(pools.color),background:pick(pools.background),
    lighting:pick(pools.lighting),texture:pick(pools.texture),density:pick(pools.density),position:pick(pools.position),
    orientation:$("orientation").value==="Auto"?pick(pools.orientation):$("orientation").value};
  const compare=[...current,...history.slice(-100)];
  const maxSim=compare.length?Math.max(...compare.map(x=>similarity(d,x))):0;
  if(maxSim<=threshold || attempts>n*70){d.similarity=maxSim;d.id=`D-${Date.now().toString().slice(-5)}-${current.length+1}`;d.prompt=makePrompt(d);current.push(d)}
 }
 history=[...current,...history].slice(0,300);
 localStorage.setItem("stockDiversityHistory",JSON.stringify(history));
 render(); renderHistory();
}
function render(){
 $("empty").style.display=current.length?"none":"grid";
 $("results").innerHTML=current.map(d=>`<article class="card"><div class="card-head"><span class="id">${d.id}</span><span class="score">${d.similarity||0}% similarity</span></div><div class="dna">STYLE:${d.style}<br>COMP:${d.composition}<br>SHAPE:${d.shape}<br>COLOR:${d.color}<br>BG:${d.background}<br>LIGHT:${d.lighting}</div><div class="prompt">${d.prompt}</div><div class="tags"><span class="tag">${d.density}</span><span class="tag">${d.position}</span><span class="tag">${d.orientation}</span><span class="tag">${d.texture}</span></div></article>`).join("");
 $("uniqueCount").textContent=history.length;
 $("diversityBar").style.width=Math.min(100,history.length/3)+"%";
}
function renderHistory(){
 $("historyInfo").textContent=`${history.length} records`;
 $("historyBody").innerHTML=history.slice(0,80).map((d,i)=>`<tr><td>${i+1}</td><td>${esc(d.prompt?.split(",")[0]||"")}</td><td>${esc(d.style)}</td><td>${esc(d.composition)}</td><td>${esc(d.shape)}</td><td>${esc(d.color)}</td><td>${esc(d.background)}</td><td>${esc(d.density)}</td><td>${d.similarity||0}%</td></tr>`).join("");
}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("generate").onclick=generate;
$("threshold").oninput=()=>{$("thresholdOut").textContent=$("threshold").value+"%"};
$("clearHistory").onclick=()=>{if(confirm("Clear all local design history?")){history=[];current=[];localStorage.removeItem("stockDiversityHistory");render();renderHistory()}};
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
$("copyAll").onclick=async()=>{if(!current.length)return alert("Generate a batch first.");await navigator.clipboard.writeText(current.map(x=>x.prompt).join("\n\n"));alert("Prompt pack copied.")};
$("promptBtn").onclick=()=>{generate();setTimeout(()=>alert("Prompt pack generated. Use Copy Prompts to copy it."),50)};
$("exportCsv").onclick=()=>{
 if(!history.length)return alert("No history to export.");
 const cols=["id","style","composition","shape","color","background","lighting","texture","density","position","orientation","similarity","prompt"];
 const csv=[cols.join(","),...history.map(x=>cols.map(c=>`"${String(x[c]??"").replaceAll('"','""')}"`).join(","))].join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="stock-design-diversity-history.csv";a.click();URL.revokeObjectURL(a.href)
};
render();renderHistory();