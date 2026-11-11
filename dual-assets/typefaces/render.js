// App-derived vector artwork for the finite display alphabet; no webfont is shipped.
window.TockettTypefaceReady=(async()=>{
 const faces=await fetch('/dual-assets/typefaces/product-glyphs.json').then(r=>{if(!r.ok)throw Error('Product glyph artwork unavailable');return r.json()}),ns='http://www.w3.org/2000/svg';
 const faceFor=font=>/NativeMono/.test(font)?'cuckoo':/DIN/.test(font)?'airport':null;
 function width(value,face,size){return [...String(value)].reduce((a,c)=>a+(faces[face].glyphs[c]?.advance||0),0)*size/100}
 function canvas(ctx){const measure=ctx.measureText.bind(ctx),fill=ctx.fillText.bind(ctx),cache=new Map();
 ctx.measureText=value=>{const face=faceFor(ctx.font);if(!face)return measure(value);const size=Number(ctx.font.match(/([\d.]+)px/)?.[1]||10);return {width:width(value,face,size),actualBoundingBoxAscent:faces[face].capHeight*size/100,actualBoundingBoxDescent:0}};
 ctx.fillText=(value,x,y,maxWidth)=>{const face=faceFor(ctx.font);if(!face)return fill(value,x,y,maxWidth);const size=Number(ctx.font.match(/([\d.]+)px/)?.[1]||10),w=width(value,face,size);ctx.save();ctx.translate(x-(ctx.textAlign==='center'?w/2:ctx.textAlign==='right'||ctx.textAlign==='end'?w:0),y);ctx.scale(size/100,size/100);for(const c of String(value)){const glyph=faces[face].glyphs[c];if(!glyph)continue;const key=face+c;let path=cache.get(key);if(!path){path=new Path2D(glyph.path);cache.set(key,path)}ctx.fill(path);ctx.translate(glyph.advance,0)}ctx.restore()};return ctx;
 }
 function svgText(node,value,face){let output=node;if(node.tagName.toLowerCase()==='text'){output=document.createElementNS(ns,'g');for(const attr of node.attributes)output.setAttribute(attr.name,attr.value);node.replaceWith(output)}
 output.replaceChildren();output.dataset.value=value;const size=Number(output.getAttribute('font-size')||16),spacing=Number(output.getAttribute('letter-spacing')||0),w=width(value,face,size)+Math.max(0,[...value].length-1)*spacing,x=Number(output.getAttribute('x')||0),y=Number(output.getAttribute('y')||0),offset=output.getAttribute('text-anchor')==='middle'?w/2:output.getAttribute('text-anchor')==='end'?w:0;
 let at=0;for(const c of value){const glyph=faces[face].glyphs[c];if(!glyph)continue;const path=document.createElementNS(ns,'path');path.setAttribute('d',glyph.path);path.setAttribute('transform',`translate(${x-offset+at} ${y}) scale(${size/100})`);output.append(path);at+=glyph.advance*size/100+spacing}return output;
 }
 return {faces,canvas,svgText,width};
})();
