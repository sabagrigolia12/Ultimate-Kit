// node pngsheet.js out.png cols tileW file1 file2 ...  - a contact sheet of PNG frames (box-averaged), no other tools here
const {read,write}=require('./pngcrop.js');
const [,,out,cols,tw,...files]=process.argv, C=+cols, TW=+tw;
const tiles=files.map(f=>{const I=read(f),TH=Math.round(TW*I.h/I.w),o=Buffer.alloc(TW*TH*3),sx=I.w/TW,sy=I.h/TH;
 for(let j=0;j<TH;j++)for(let i=0;i<TW;i++){let r=0,g=0,b=0,n=0;for(let y=Math.floor(j*sy);y<Math.floor((j+1)*sy);y++)for(let x=Math.floor(i*sx);x<Math.floor((i+1)*sx);x++){const p=(y*I.w+x)*3;r+=I.rgb[p];g+=I.rgb[p+1];b+=I.rgb[p+2];n++;}const q=(j*TW+i)*3;o[q]=r/n;o[q+1]=g/n;o[q+2]=b/n;}
 return{w:TW,h:TH,o};});
const THm=Math.max(...tiles.map(t=>t.h)),R=Math.ceil(tiles.length/C),W=C*TW+(C-1)*4,H=R*THm+(R-1)*4,s=Buffer.alloc(W*H*3,30);
tiles.forEach((t,n)=>{const X=(n%C)*(TW+4),Y=Math.floor(n/C)*(THm+4);for(let j=0;j<t.h;j++)t.o.copy(s,((Y+j)*W+X)*3,j*t.w*3,(j+1)*t.w*3);});
write(out,W,H,s);
