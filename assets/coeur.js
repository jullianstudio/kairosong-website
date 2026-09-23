/* « Le cœur du jeu », un geste, une fois : ton année roule jusqu'à la réponse.
   1. Le rouleau : quand l'année est bien à l'écran, le chiffre des dizaines passe de 8 à 6 en deux
      crans, puis « Then the answer lands… », puis la frise et la dernière phrase (tout le minutage
      est dans site.css, chaque temps part à la fin du précédent). Si l'année a déjà filé hors de
      l'écran, ou si l'on arrive par en dessous, l'image finale se pose d'un coup, sans rejouer.
   2. Les années fantômes du cœur : floues, fines, là où rien n'est écrit, jamais 1963 ni 1983.
   Sans script ou avec « réduire les animations » : l'image finale, sans rouleau. */
(function () {
  var heart = document.querySelector('.heart');
  var year = heart && heart.querySelector('.heart-year');
  var roue = year && year.querySelector('.heart-roue');
  if (!roue) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── 1. Le rouleau ───────────────────────────────────────────────────────
  if (!still) {
    roue.innerHTML = '<span class="heart-rouleau"><span>8</span><span>7</span><span>6</span></span>';
    heart.classList.add('is-waiting');
    // « Bien à l'écran » : toute l'année au-dessus du tiers bas, la frise suit alors sous les yeux.
    // Une année dont le haut a passé le bord de l'écran (défilement rapide, retour par en dessous,
    // lien vers plus bas) ne tourne plus : l'image finale se pose. Une mesure par défilement,
    // le temps d'attendre seulement.
    var look = function () {
      var r = year.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= innerHeight * 0.65) heart.classList.replace('is-waiting', 'is-playing');
      else if (r.top < 0) heart.classList.remove('is-waiting');
      else return;
      removeEventListener('scroll', look);
      removeEventListener('resize', look);
    };
    addEventListener('scroll', look, { passive: true });
    addEventListener('resize', look, { passive: true });
    look();
  }

  // ─── 2. Les années fantômes ──────────────────────────────────────────────
  var fond = heart.querySelector('.heart-fond');
  if (!fond) return;
  var texts = heart.querySelectorAll('.eyebrow, .title, .heart-body p, .heart-line, .heart-year, .frise, .heart-coda');

  var place = function () {
    var desk = innerWidth >= 1000;
    var R = fond.getBoundingClientRect(), W = R.width, H = R.height, pad = desk ? 20 : 12;
    var blocks = [].map.call(texts, function (el) {
      var r = el.getBoundingClientRect();
      return { l: r.left - R.left - pad, t: r.top - R.top - pad, r: r.right - R.left + pad, b: r.bottom - R.top + pad };
    });
    // Un peu d'air sous l'accueil : la marge haute de la section en touche la dernière ligne.
    var top = 32;
    // Hasard à graine fixe : la même image à chaque visite.
    var s = (desk ? 11 : 3) * 9301 + 49297;
    var rnd = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    var target = desk ? 30 : 14, out = [], html = '', seen = { 1963: 1, 1983: 1 };
    for (var i = 0; i < 4000 && out.length < target; i++) {
      var size = Math.round((desk ? 22 : 18) + rnd() * (desk ? 16 : 12));
      var w = size * 2.1, h = size, x = rnd() * (W - w), y = top + rnd() * (H - h - top);
      var box = { l: x, t: y, r: x + w, b: y + h };
      var hit = function (a, m) { return !(box.r + m < a.l || box.l - m > a.r || box.b + m < a.t || box.t - m > a.b); };
      if (blocks.some(function (a) { return hit(a, 0); })) continue;
      if (out.some(function (o) { return hit(o, desk ? 28 : 16); })) continue;
      // Chaque année une seule fois, et jamais le pari ni la réponse.
      var yr;
      do { yr = 1950 + Math.floor(rnd() * 71); } while (seen[yr]);
      seen[yr] = 1; out.push(box);
      html += '<span style="left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px;font-size:' + size +
        'px;opacity:' + (0.12 + rnd() * 0.06).toFixed(2) + '">' + yr + '</span>';
    }
    fond.innerHTML = html;
  };

  // Les fantômes attendent les polices : le texte se remet en page en les recevant. Seule une vraie
  // largeur nouvelle les replace (la barre d'adresse du téléphone ne change que la hauteur).
  var lastW = 0, rt;
  var ready = function () {
    lastW = innerWidth; place();
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (innerWidth !== lastW) { lastW = innerWidth; place(); } }, 150);
    });
  };
  document.fonts && document.fonts.ready ? document.fonts.ready.then(ready, ready) : ready();
})();
