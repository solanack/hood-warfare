// Device tier for Hood Warfare. Desktop stays full. Touch phones get the existing
// mobile budget. Solana Seeker (Dimensity 7300 / Mali-G615, 1200×2670) and similar
// mid GPUs get a lite path: no second GPU context, no post stack, no shadow pass
// over twelve thousand bricks. Override with ?tier=low|mid|high.
export const quality = { tier: 'high', budgetScale: 1 };
export const isLow = () => quality.tier === 'low';

export function detectTier(qs, touch) {
  const forced = qs.get('tier');
  if (forced === 'low' || forced === 'seeker' || forced === 'mid' || forced === 'high') {
    quality.tier = forced === 'seeker' ? 'low' : forced;
    return quality.tier;
  }
  let gpu = '';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    if (ext && gl) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
    const lose = gl && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  } catch { /* masked GPU, fall through to the screen fingerprint */ }
  const dpr = devicePixelRatio || 1;
  const pw = Math.round((screen.width || 0) * dpr);
  const ph = Math.round((screen.height || 0) * dpr);
  const sw = Math.min(pw, ph), sh = Math.max(pw, ph);
  // Seeker panel is 1200×2670. Allow a little rounding from DPR.
  const seekerScreen = sw >= 1170 && sw <= 1230 && sh >= 2600 && sh <= 2740;
  const ua = navigator.userAgent || '';
  const seekerUA = /Seeker|Solana Mobile/i.test(ua);
  // Mali-G615 is the Seeker. Neighbouring mid Mali / Adreno parts hit the same wall.
  const weakGpu = /Mali-G(31|51|52|57|68|71|72|76|77|310|510|610|615|710)|Mali-T|Adreno \(TM\) (5|6[0-4]|7[0-2])/i.test(gpu);
  const mem = navigator.deviceMemory || 8;
  if (seekerScreen || seekerUA || weakGpu || (touch && mem <= 4)) quality.tier = 'low';
  else if (touch) quality.tier = 'mid';
  else quality.tier = 'high';
  return quality.tier;
}
