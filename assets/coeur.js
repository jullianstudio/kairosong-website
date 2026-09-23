/* « Le cœur du jeu », deux gestes, chacun une fois, à son arrivée à l'écran.
   1. En fond de la section : des années flottent, floues, derrière le titre et le texte ; l'une
      se précise et se fixe dans la clairière sous le titre, les autres restent autour, en
      fantômes. Faibles derrière le texte (0,25 au plus, contraste AA tenu), plus présentes là
      où rien n'est écrit. Code repris de l'essai « Où tu étais » (Canvas 2D).
   2. La chute, au fil du défilement : la frise et la réponse, « Sometimes spot on. », puis ton pari,
      la courbe de l'écart et la dernière phrase.
   Sans script ou avec « réduire les animations » : l'image finale, tout de suite. */
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = 'IntersectionObserver' in window;

  // ─── 2. La chute ─────────────────────────────────────────────────────────
  // Trois étapes, chacune quand son élément entre bien à l'écran, toujours dans l'ordre et jamais
  // plus serrées qu'un temps de lecture : la frise et la réponse, « Sometimes spot on. », l'écart.
  var turn = document.querySelector('.heart-turn');
  var gap = turn && turn.querySelector('.frise--gap');
  var spans = turn && turn.querySelectorAll('.turn-b span');
  if (gap && spans.length === 2 && !still) {
    turn.classList.add('is-waiting');
    var steps = [['is-on', gap], ['is-spot', spans[0]], ['is-gap', spans[1]]];
    var seen = [], shown = 0, next = 0, SPACE = 1400;
    var advance = function () {
      if (shown >= steps.length || !seen[shown]) return;
      var wait = next - Date.now();
      if (wait > 0) { setTimeout(advance, wait); return; }
      turn.classList.add(steps[shown][0]);
      shown++; next = Date.now() + SPACE;
      if (shown === steps.length) stopWatch();
      advance();
    };
    // Une étape part quand son élément franchit le quart bas de l'écran ; une étape vue valide
    // celles d'avant (défilement rapide). Le guet s'arrête à la dernière.
    var look = function () {
      var line = innerHeight * 0.75;
      for (var k = steps.length - 1; k >= 0; k--) {
        if (steps[k][1].getBoundingClientRect().top < line) { for (var m = 0; m <= k; m++) seen[m] = true; break; }
      }
      advance();
    };
    // Trois mesures par défilement, le temps de la chute seulement : pas besoin d'attendre une image.
    addEventListener('scroll', look, { passive: true });
    addEventListener('resize', look, { passive: true });
    var stopWatch = function () { removeEventListener('scroll', look); removeEventListener('resize', look); };
    look();
  }

  // ─── 1. Où tu étais ──────────────────────────────────────────────────────
  // Le dessin couvre le haut de la section ; l'année se fixe dans la clairière sous le titre.
  var stage = document.querySelector('.souvenirs-fond');
  var clearing = document.querySelector('.souvenirs');
  var cv = stage && stage.querySelector('canvas');
  var cx = cv && cv.getContext && cv.getContext('2d');
  if (!cx) return;

  var T = 6, YEAR = '1983', GREY = '#9c9384', IVORY = '#e8dcc4';
  var FONT = function (s) { return '500 ' + s + 'px Newsreader, Georgia, serif'; };
  var ss = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  // Hasard à graine fixe : chaque lecture, et l'image finale, sont identiques.
  var seed = 7;
  var rnd = function () {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  var W, H, dpr, items, target, CX, CY, big, few;

  // Un fragment flou se prépare une fois : le flou vient de l'ombre d'un texte poussé hors du cadre.
  var sprite = function (txt, size, blur, color) {
    var c = document.createElement('canvas'), g = c.getContext('2d'), pad = blur * 2 + 4;
    g.font = FONT(size * dpr);
    var w = g.measureText(txt).width;
    c.width = Math.ceil(w + pad * 2 * dpr);
    c.height = Math.ceil((size * 1.3 + pad * 2) * dpr);
    g.font = FONT(size * dpr); g.textAlign = 'center'; g.textBaseline = 'middle';
    if (blur > 0.3) { g.shadowColor = color; g.shadowBlur = blur * dpr; g.shadowOffsetX = 10000; g.fillText(txt, c.width / 2 - 10000, c.height / 2); }
    else { g.fillStyle = color; g.fillText(txt, c.width / 2, c.height / 2); }
    return c;
  };

  var build = function () {
    // Le dessin descend jusqu'au pari sur téléphone (il vient après la prose), jusqu'à « la réponse
    // tombe » sur ordinateur, et s'arrête là : la frise, plus bas, reste seule sur le noir.
    var phone = innerWidth < 1000;
    var until = phone ? clearing : document.querySelector('.heart-turn .turn-a') || clearing;
    stage.style.height = Math.round(until.getBoundingClientRect().bottom - stage.parentNode.getBoundingClientRect().top + (phone ? 120 : 60)) + 'px';
    var r = stage.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = clearing.getBoundingClientRect();
    CX = c.left + c.width / 2 - r.left; CY = c.top + c.height / 2 - r.top;
    seed = 7; items = [];
    // Là où un texte passe par-dessus, les fantômes restent faibles ; ailleurs, ils se montrent.
    var texts = [].map.call(document.querySelectorAll('.heart-head .eyebrow, .heart-head .title, .heart-body > p, .heart-bet .heart-line, .heart-turn .turn-a'), function (el) {
      var b = el.getBoundingClientRect();
      return { l: b.left - r.left - 8, t: b.top - r.top - 8, r: b.right - r.left + 8, b: b.bottom - r.top + 8 };
    });
    var behind = function (x, y, w, h, vx, vy) {
      var dx = Math.abs(vx) * 4.2 + w / 2, dy = Math.abs(vy) * 4.2 + h / 2;
      return texts.some(function (q) { return x + dx > q.l && x - dx < q.r && y + dy > q.t && y - dy < q.b; });
    };
    big = W >= 900 ? 84 : 64; few = phone;
    var years = {}, tries = 0, count = few ? 14 : Math.max(20, Math.min(90, Math.round(W * H / 4200)));
    years[YEAR] = true;
    while (items.length < count && tries++ < 2000) {
      var y = 1958 + Math.floor(rnd() * 59);
      if (years[y] && items.length < 59) continue;
      var z = rnd(), x = rnd() * W, yy = rnd() * H;
      // Le centre reste libre : l'année juste s'y fixera, les fantômes l'entourent.
      if (Math.abs(x - CX) < big * 2.1 && Math.abs(yy - CY) < big) continue;
      years[y] = true;
      var size = 13 + z * 20, blur = 1.6 + (1 - z) * 6;
      var vx = (rnd() - 0.5) * 10, vy = (rnd() - 0.5) * 5, img = sprite(String(y), size, blur, GREY);
      var under = behind(x, yy, img.width / dpr, img.height / dpr * 0.6, vx, vy);
      // Téléphone : jamais derrière un texte, et faibles.
      if (few && under) continue;
      // Derrière le texte : au plus 0,25 (contraste AA tenu). Ailleurs : jusqu'à 0,78.
      items.push({ x: x, y: yy, under: under, a: few ? 0.1 + z * 0.12 : under ? 0.1 + z * 0.15 : 0.38 + z * 0.4, vx: vx, vy: vy, f: 1 + rnd() * 2.5, ph: rnd() * 6.3, img: img });
    }
    // Là où aucun texte ne passe, quelques fantômes de plus : c'est là qu'on les voit.
    var extra = few ? 0 : 16, free = 0;
    for (var k = 0; free < extra && k < 3000; k++) {
      var fy = 1958 + Math.floor(rnd() * 59), fz = rnd(), fx = rnd() * W, fyy = rnd() * H;
      if (fy === 1983 || (Math.abs(fx - CX) < big * 2.1 && Math.abs(fyy - CY) < big)) continue;
      var fvx = (rnd() - 0.5) * 10, fvy = (rnd() - 0.5) * 5, fimg = sprite(String(fy), 13 + fz * 20, 1.6 + (1 - fz) * 6, GREY);
      if (behind(fx, fyy, fimg.width / dpr, fimg.height / dpr * 0.6, fvx, fvy)) continue;
      items.push({ x: fx, y: fyy, under: false, a: 0.38 + fz * 0.4, vx: fvx, vy: fvy, f: 1 + rnd() * 2.5, ph: rnd() * 6.3, img: fimg });
      free++;
    }
    // L'année juste part de loin, petite et floue, comme les autres.
    target = { x0: CX + W * 0.24, y0: CY - 70, soft: sprite(YEAR, big, 9, GREY), sharp: sprite(YEAR, big, 0, IVORY) };
  };

  var draw = function (t) {
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height); cx.scale(dpr, dpr);
    var fade = ss(0, 0.8, t), conv = ss(3, 5.2, t), sharp = ss(4, 5.4, t), calm = 1 - ss(2.8, 5.6, t);
    // Dérive : la vitesse s'éteint à mesure que les souvenirs se recoupent (intégrale de la vitesse).
    var tau = Math.min(t, 2.8) + Math.max(0, Math.min(t, 5.6) - 2.8) * 0.5;
    items.forEach(function (it) {
      var x = it.x + it.vx * tau, y = it.y + it.vy * tau;
      var flick = mix(0.55 + 0.45 * Math.sin(t * it.f + it.ph), 1, 1 - calm);
      // Les fantômes restent : ils pâlissent quand l'année se fixe, et s'effacent devant elle.
      var near = 1 - ss(big * 1.6, big * 3.6, Math.hypot(x - CX, y - CY));
      cx.globalAlpha = it.a * fade * flick * (few ? 1 - conv : (1 - (it.under ? 0.5 : 0.3) * conv) * (1 - 0.75 * conv * near));
      var w = it.img.width / dpr, h = it.img.height / dpr;
      cx.drawImage(it.img, x - w / 2, y - h / 2, w, h);
    });
    var e = 1 - Math.pow(1 - conv, 3), s = mix(0.34, 1, e);
    var x = mix(target.x0, CX, e), y = mix(target.y0, CY, e);
    var w = target.soft.width / dpr * s, h = target.soft.height / dpr * s;
    cx.globalAlpha = fade * (0.3 + 0.7 * conv) * (1 - sharp);
    cx.drawImage(target.soft, x - w / 2, y - h / 2, w, h);
    var w2 = target.sharp.width / dpr * s, h2 = target.sharp.height / dpr * s;
    cx.globalAlpha = sharp;
    cx.drawImage(target.sharp, x - w2 / 2, y - h2 / 2, w2, h2);
    cx.globalAlpha = 1;
  };

  var raf = 0, t0 = 0, elapsed = 0, visible = false, done = false;
  var frame = function (now) {
    elapsed = Math.min(T, (now - t0) / 1000);
    draw(elapsed);
    if (elapsed >= T) { done = true; raf = 0; return; } // fini : plus aucune image calculée
    raf = requestAnimationFrame(frame);
  };
  var run = function () {
    if (!raf && !done && visible) raf = requestAnimationFrame(function (now) { t0 = now - elapsed * 1000; frame(now); });
  };
  var stop = function () { cancelAnimationFrame(raf); raf = 0; };

  var ready = function () {
    build();
    clearing.classList.add('is-drawn');
    // Seule une vraie largeur nouvelle redessine (la barre d'adresse du téléphone change la hauteur).
    var lastW = W, rt;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (stage.getBoundingClientRect().width === lastW) return;
        build(); lastW = W; draw(elapsed);
      }, 150);
    });
    if (still || !io) { elapsed = T; done = true; draw(T); return; }
    draw(0);
    // Le dessin joue quand la clairière est à l'écran, s'arrête quand elle en sort.
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? run() : stop();
    }, { threshold: 0.5 }).observe(clearing);
  };
  // Le dessin attend toutes les polices : la prose au-dessus du pari se remet en page en les
  // recevant, et 1983 doit se fixer là où la clairière finit par être.
  document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load(FONT(40)), document.fonts.ready]).then(ready, ready)
    : ready();
})();
