/* v65 — Remove only the near-white photographic matte from the original
 * 791×1989 lotus manifesto PNG. Keep all colored flower pixels, the ink
 * annotations, image proportions, intrinsic size, and existing layout.
 *
 * CSS multiply alone cannot reliably remove white pixels when the artwork is
 * composited inside nested stacking contexts. Export a transparent copy in
 * memory (no network, no permanent source-asset replacement).
 */
(() => {
  const img = document.querySelector('img.lotus-manifesto');
  if (!img) return;

  let converted = false;
  const makeTransparent = async () => {
    if (converted) return;
    if (!img.complete || !img.naturalWidth) return;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    if (!ctx) return;
    try {
      ctx.drawImage(img,0,0,width,height);
      const pixels=ctx.getImageData(0,0,width,height);
      const data=pixels.data;
      for(let i=0;i<data.length;i+=4){
        const r=data[i],g=data[i+1],b=data[i+2];
        const low=Math.min(r,g,b);
        const spread=Math.max(r,g,b)-low;
        // Protect all chromatic pinks/greens and dark letterforms.
        // Pure and near-pure white paper becomes fully transparent;
        // feather neutral antialiased edges to avoid a white halo.
        if(spread<=12 && low>=234){
          const alpha=low>=248?0:Math.round(255*(248-low)/14);
          data[i+3]=Math.round(data[i+3]*alpha/255);
        }
      }
      ctx.putImageData(pixels,0,0);
      const url=canvas.toDataURL('image/png');
      // Applying the new src preserves intrinsic image dimensions and
      // all original CSS positioning; it changes only matte transparency.
      converted=true;
      img.dataset.matteRemoved='true';
      img.src=url;
    } catch(err) {
      console.warn('Lotus matte conversion unavailable; original image retained.',err);
    }
  };

  if(img.complete && img.naturalWidth) {
    makeTransparent();
  } else {
    img.addEventListener('load',makeTransparent,{once:true});
  }
})();
