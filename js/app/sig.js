/* Signature provider. Every signatory in the account master points at a real person in js/app/real-signatures.js (party.sig).
   Specimens are the signatures on the bank's record. A genuine signing is another real signature by the same person.
   A forged attempt is a real forgery where the data has one, otherwise a different person's signature.
   Images are decoded once by Sig.ready(); after that every call here is synchronous. */
(function () {
  const R = (window.REALSIG && window.REALSIG.people) || {}, keys = Object.keys(R);
  const imgs = {}, canv = {};
  let loading = null;
  const hash = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; };
  const person = (party) => (party && party.sig && R[party.sig]) || null;
  const pick = (arr, js) => arr[Math.abs(js | 0) % arr.length];
  // a stranger is chosen the same way every time, so a seeded case always shows the same forged scan
  const strangerOf = (party) => { const others = keys.filter((k) => k !== party.sig); return R[others[(hash(party.sig) * 7 + 3) % others.length]]; };

  const Sig = {
    has: (party) => !!person(party),
    realForgeries: (party) => !!(person(party) && person(party).forged.length),
    // specimens on the bank record (data URIs)
    specimens: (party) => (person(party) ? person(party).spec : []),
    // a genuine signing by this person; js picks which one
    genuine: (party, js) => { const p = person(party); return p ? pick(p.gen, js) : null; },
    // a forged attempt against this person
    forged: (party, js) => { const p = person(party); if (!p) return null; return p.forged.length ? pick(p.forged, js) : pick(strangerOf(party).gen, js); },
    // decode every image once
    ready() {
      if (loading) return loading;
      const all = []; keys.forEach((k) => ["spec", "gen", "forged"].forEach((t) => R[k][t].forEach((u) => all.push(u))));
      loading = Promise.all(all.map((u) => new Promise((res) => { const i = new Image(); i.onload = i.onerror = () => { imgs[u] = i; res(); }; i.src = u; })));
      return loading;
    },
    // a canvas with the image on white, ready for the comparison engine
    canvas(src) {
      if (canv[src]) return canv[src];
      const i = imgs[src], c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0);
      return (canv[src] = c);
    },
    // the specimens of a party as canvases, the form the comparison engine takes
    refCanvases: (party) => Sig.specimens(party).map(Sig.canvas),
    // draw an image into a box, fitted and bottom-centred. "multiply" lets the white of the image disappear into the paper.
    draw(ctx, src, x, y, w, h) {
      const i = imgs[src], s = Math.min(w / i.naturalWidth, h / i.naturalHeight, 2.4), dw = i.naturalWidth * s, dh = i.naturalHeight * s;
      ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.drawImage(i, x + (w - dw) / 2, y + h - dh, dw, dh); ctx.restore();
    },
  };
  window.Sig = Sig;
})();
