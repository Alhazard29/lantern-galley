// One way to put words on the canvas, so every label in the galley shares its type.

const BODY = '"Trebuchet MS", "DejaVu Sans", Verdana, sans-serif';
const DISPLAY = 'Georgia, "DejaVu Serif", serif';

export function fontOf(size, { bold = true, display = false } = {}) {
  return (bold ? 'bold ' : '') + size + 'px ' + (display ? DISPLAY : BODY);
}

export function drawLabel(ctx, text, x, y, { size = 14, colour = '#fff', align = 'center', bold = true, display = false, outline = null } = {}) {
  ctx.font = fontOf(size, { bold, display });
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineWidth = Math.max(3, size * 0.22);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

/** A rounded tag with words in it, centred on (x, y). Returns its width. */
export function drawTag(ctx, text, x, y, { size = 13, fill = '#10222a', colour = '#fff', pad = 8, edge = null } = {}) {
  ctx.font = fontOf(size);
  const width = ctx.measureText(text).width + pad * 2;
  const height = size + pad;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, height / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
  drawLabel(ctx, text, x, y + 1, { size, colour });
  return width;
}
