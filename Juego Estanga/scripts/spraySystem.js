export const SPRAY_PATTERNS = [
  (ctx,x,y,col)=>{ ctx.save(); ctx.translate(x,y); ctx.fillStyle=col; ctx.globalAlpha=0.75;
    for(let i=0;i<5;i++){ ctx.rotate(Math.PI*2/5); ctx.beginPath(); ctx.ellipse(0,-10,3,8,0,0,Math.PI*2); ctx.fill(); }
    ctx.restore(); },
  (ctx,x,y,col)=>{ ctx.save(); ctx.translate(x,y); ctx.strokeStyle=col; ctx.lineWidth=3; ctx.globalAlpha=0.8;
    ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.stroke(); ctx.restore(); },
  (ctx,x,y,col)=>{ ctx.save(); ctx.translate(x,y); ctx.fillStyle=col; ctx.globalAlpha=0.8;
    ctx.beginPath(); ctx.moveTo(-12,8); ctx.lineTo(-12,-4); ctx.lineTo(-6,2); ctx.lineTo(0,-10);
    ctx.lineTo(6,2); ctx.lineTo(12,-4); ctx.lineTo(12,8); ctx.closePath(); ctx.fill(); ctx.restore(); },
  (ctx,x,y,col)=>{ ctx.save(); ctx.translate(x,y); ctx.strokeStyle=col; ctx.lineWidth=4; ctx.lineCap='round'; ctx.globalAlpha=0.8;
    ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(10,10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(10,-10); ctx.lineTo(-10,10); ctx.stroke(); ctx.restore(); }
];

export class SpraySystem {
  constructor(colorPalette, patternOffset=0) {
    this.sprays = []; this.palette = colorPalette; this.pOffset = patternOffset; this.count = 0;
  }
  add(x,y) {
    if(this.sprays.length>=3) this.sprays.shift();
    const col = this.palette[this.count % this.palette.length];
    const pat = SPRAY_PATTERNS[(this.count+this.pOffset) % SPRAY_PATTERNS.length];
    this.sprays.push({x,y,col,pat});
    this.count++;
    return this.sprays.length;
  }
  draw(ctx) { this.sprays.forEach(s=>{ ctx.save(); s.pat(ctx,s.x,s.y,s.col); ctx.restore(); }); }
  reset() { this.sprays = []; this.count = 0; }
}