// node pngcrop.js in.png x y w h zoom out.png  - a nearest-neighbour zoomed crop of an 8-bit PNG (no other tools here)
const fs=require('fs'),zlib=require('zlib');
function read(f){const b=fs.readFileSync(f);let p=8,w,h,bd,ct,id=[];while(p<b.length){const n=b.readUInt32BE(p),t=b.toString('latin1',p+4,p+8),d=b.subarray(p+8,p+8+n);if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);bd=d[8];ct=d[9];}if(t==='IDAT')id.push(d);p+=12+n;}
 const ch={0:1,2:3,4:2,6:4}[ct],bpp=ch*bd/8,st=w*bpp,raw=zlib.inflateSync(Buffer.concat(id)),o=Buffer.alloc(h*st);let q=0;
 for(let y=0;y<h;y++){const ft=raw[q++];for(let x=0;x<st;x++){const a=x>=bpp?o[y*st+x-bpp]:0,u=y?o[(y-1)*st+x]:0,c=(x>=bpp&&y)?o[(y-1)*st+x-bpp]:0;let v=raw[q++];
   if(ft===1)v+=a;else if(ft===2)v+=u;else if(ft===3)v+=(a+u)>>1;else if(ft===4){const P=a+u-c,pa=Math.abs(P-a),pb=Math.abs(P-u),pc=Math.abs(P-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?u:c;}o[y*st+x]=v&255;}}
 const out=Buffer.alloc(w*h*3),s=bd/8;for(let i=0;i<w*h;i++){for(let k=0;k<3;k++)out[i*3+k]=o[i*bpp+(ch>=3?k:0)*s];}
 return{w,h,rgb:out};}
function write(f,w,h,rgb){const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){raw[y*(w*3+1)]=0;rgb.copy(raw,y*(w*3+1)+1,y*w*3,(y+1)*w*3);}
 const crcT=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcT[n]=c>>>0;}
 const crc=b=>{let c=0xffffffff;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
 const chunk=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t,'latin1'),d]),r=Buffer.alloc(4);r.writeUInt32BE(crc(td));return Buffer.concat([l,td,r]);};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;
 fs.writeFileSync(f,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}
module.exports={read,write};
if(require.main===module){const[,,a,x,y,w,h,z,out]=process.argv,I=read(a),X=+x,Y=+y,W=+w,H=+h,Z=+z,o=Buffer.alloc(W*Z*H*Z*3);
 for(let j=0;j<H*Z;j++)for(let i=0;i<W*Z;i++){const sx=X+Math.floor(i/Z),sy=Y+Math.floor(j/Z),p=(sy*I.w+sx)*3,q=(j*W*Z+i)*3;I.rgb.copy(o,q,p,p+3);}
 write(out,W*Z,H*Z,o);}
