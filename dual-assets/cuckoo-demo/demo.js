(async()=>{
const en=new URLSearchParams(location.search).get('lang')==='en',b=document.querySelector('button');if(en){document.documentElement.lang='en';b.setAttribute('aria-label','Preview the Cuckoo Clock animation');b.title='Tap to preview';document.querySelector('svg').setAttribute('aria-label','Code-rendered Cuckoo Clock landscape preview')}
const typography=await window.TockettTypefaceReady;const frames=await fetch('frames.json').then(r=>r.json()),ns='http://www.w3.org/2000/svg',svg=document.querySelector('svg'),group=document.querySelector('#digits'),bird=document.querySelector('#bird'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let active=self===top,running=false,seen=false,raf=0,started=0,loaded=false,lastSecond='',preloads;
const cv=typography.canvas(document.createElement('canvas').getContext('2d'));cv.font='600 193.12px NativeMono';const cap=cv.measureText('H').actualBoundingBoxAscent,cells=[[188,332],[548,336],[912,340]],nodes=[],plates=[],defs=svg.querySelector("defs");
function make(tag,a,p){let n=document.createElementNS(ns,tag==='text'&&a['font-family']==='NativeMono'?'g':tag);for(let[k,v]of Object.entries(a))n.setAttribute(k,v);p.append(n);return n}
cells.forEach(([x,w],i)=>{
 const g=make('g',{},group),attrs={x:x+w/2,y:194+(272+cap)/2,'text-anchor':'middle','font-family':'NativeMono','font-size':193.12,'font-weight':600,fill:'#ece8da'},t=make('text',attrs,g);
 ['top','bottom'].forEach((half,j)=>{const clip=make('clipPath',{id:`plate-${i}-${half}`},defs);make('rect',{x,y:194+j*136,width:w,height:136},clip)});
 function leaf(half){const transform=make('g',{},g),crop=make('g',{'clip-path':`url(#plate-${i}-${half})`},transform);make('image',{href:'shell-alpha.png',width:1432,height:672},crop);const text=make('text',attrs,crop),shade=make('rect',{x,y:194,width:w,height:272,fill:'#000',opacity:0},crop);return {transform,text,shade}}
 const bottomOld=leaf('bottom'),topOld=leaf('top'),bottomNew=leaf('bottom');
 const p={value:'',start:0,flipping:false,layers:[bottomOld,topOld,bottomNew]};p.layers.forEach(l=>l.transform.style.display='none');plates.push(p);
 make('rect',{x,y:329,width:w,height:2,fill:'#101211'},g);nodes.push(t);
});
function finish(p){p.flipping=false;p.layers.forEach(l=>{l.transform.style.display='none';l.transform.removeAttribute('transform')})}
function setValue(i,value,now,animate=true){const p=plates[i],old=p.value;if(old===value)return;finish(p);p.value=value;typography.svgText(nodes[i],value,'cuckoo');if(!old||!animate||reduced.matches||(i===2&&running))return;
 p.start=now;p.flipping=true;typography.svgText(p.layers[0].text,old,'cuckoo');typography.svgText(p.layers[1].text,old,'cuckoo');typography.svgText(p.layers[2].text,value,'cuckoo');
}
function drawPlates(now){plates.forEach(p=>{if(!p.flipping)return;let progress=Math.max(0,(now-p.start)/400);if(progress>=1||!active||document.hidden||reduced.matches){finish(p);return}
 const [oldBottom,oldTop,newBottom]=p.layers;
 oldBottom.transform.style.display='';oldTop.transform.style.display=progress<.5?'':'none';newBottom.transform.style.display=progress>=.5?'':'none';
 const leaf=progress<.5?oldTop:newBottom,scale=Math.max(.001,Math.cos((progress<.5?progress:1-progress)*Math.PI));
 leaf.transform.setAttribute('transform',`translate(0 330) scale(1 ${scale}) translate(0 -330)`);leaf.shade.setAttribute('opacity',(progress<.5?progress:1-progress)*.8);
})}
function clock(now=performance.now()){
 if(!active||document.hidden)return;const date=new Date(),s=Math.floor(date.getTime()/1000);
 if(s!==lastSecond){const consecutive=Number.isFinite(lastSecond)&&s-lastSecond===1;lastSecond=s;const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(date);
 ['hour','minute','second'].forEach((k,i)=>setValue(i,parts.find(p=>p.type===k).value,now-date.getMilliseconds(),consecutive));if(date.getSeconds()===59&&!running)play()}
 drawPlates(now);
}
function timeLoop(now){clock(now);requestAnimationFrame(timeLoop)}
async function preload(){if(!preloads)preloads=Promise.all(frames.map(src=>new Promise(resolve=>{let i=new Image;i.onload=i.onerror=resolve;i.src=src}))).then(()=>loaded=true);return preloads}
function stop(){cancelAnimationFrame(raf);running=false;bird.setAttribute('opacity','0');nodes[2].parentNode.style.opacity='1';clock()}
async function play(){if(!active||document.hidden||running)return;if(reduced.matches){stop();return}running=true;await preload();if(!active||document.hidden){stop();return}started=performance.now();finish(plates[2]);nodes[2].parentNode.style.opacity='0';bird.setAttribute('opacity','1');const tick=now=>{if(!active||document.hidden){stop();return}let t=(now-started)/1000;if(t>=2){stop();return}bird.setAttribute('href',frames[Math.max(0,Math.min(frames.length-1,Math.floor(t/2*frames.length)))]);raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
function setActive(v){active=v;if(!v)stop();else{lastSecond='';clock();if(!seen){seen=true;play()}}}
b.addEventListener('click',play);addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='airport-demo-visibility')setActive(!!e.data.active)});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});reduced.addEventListener('change',()=>{if(reduced.matches)stop()});requestAnimationFrame(timeLoop);lastSecond='';const old=active;active=true;clock();active=old;if(active){seen=true;play()};window.tockettCuckooDemo={play,getState:()=>({ready:true,active,running,loaded,reduced:reduced.matches,clock:nodes.map(n=>n.dataset.value),frame:bird.getAttribute('href'),plates:plates.map(p=>({value:p.value,flipping:p.flipping}))})};document.documentElement.dataset.ready='true';if(parent!==self)parent.postMessage({type:'airport-demo-ready'},location.origin);
})();
