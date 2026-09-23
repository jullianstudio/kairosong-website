/* L'accueil : trois ondes emmêlées se resserrent en un seul filet, et ce filet devient la
   frise sur laquelle les années se posent. Un geste, une fois, 5,2 s en tout.
   Code repris de l'essai « L'onde se fige » (SVG, tracés morphés en SMIL).
   Sans script, avec « réduire les animations » ou sans SMIL : la frise est déjà posée. */
(function () {
  var fr = document.querySelector('.frise--hero');
  if (!fr) return;
  var svg = fr.querySelector('.frise-onde');
  var set = function () { fr.classList.add('is-set'); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !svg || !svg.pauseAnimations || !('IntersectionObserver' in window)) { set(); return; }

  var NS = 'http://www.w3.org/2000/svg', N = 72, K = 44, WAVE = 3.4, BASE = 44, AMP = 22;
  var ss = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  // Chaque ligne : sa fréquence, sa phase, sa vitesse ; elles s'alignent en une seule, à plat.
  var lines = [[0.045, 0, 5.2, 1], [0.071, 1.9, -4.1, 0.8], [0.032, 4.2, 6.3, 0.9]];
  var shape = function (l, u) {
    var t = u * WAVE, amp = ss(0, 0.2, u) * (1 - ss(0.55, 0.9, u)), sig = mix(260, 46, ss(0.3, 0.82, u)), al = ss(0.3, 0.72, u);
    var f = mix(l[0], 0.06, al), p = mix(l[1], 0, al), w = mix(l[2], 5, al), a = mix(l[3], 1, al), d = '';
    for (var i = 0; i <= N; i++) {
      var x = i * 360 / N, env = Math.exp(-Math.pow((x - 180) / sig, 2)) * Math.pow(Math.sin(Math.PI * x / 360), 0.5);
      var y = BASE + AMP * amp * env * a * (Math.sin(f * x - w * t + p) + 0.35 * (1 - al) * Math.sin(2.3 * f * x + 1.7 * w * t));
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  };
  var anims = [].map.call(svg.querySelectorAll('path'), function (el, i) {
    var a = document.createElementNS(NS, 'animate'), values = [];
    for (var k = 0; k <= K; k++) values.push(shape(lines[i], k / K));
    a.setAttribute('attributeName', 'd');
    a.setAttribute('begin', 'indefinite');
    a.setAttribute('dur', WAVE + 's');
    a.setAttribute('fill', 'freeze');
    a.setAttribute('values', values.join(';'));
    el.appendChild(a);
    return a;
  });

  var started = false, done = false;
  // Le filet est à plat : la frise le remplace, les années se posent ; l'horloge SVG se fige.
  var finish = function () {
    if (done) return;
    done = true;
    svg.pauseAnimations();
    set();
  };
  anims[0].addEventListener('endEvent', finish);
  fr.classList.add('is-waving');
  // Hors de l'écran, l'onde s'arrête ; elle reprend où elle en était.
  new IntersectionObserver(function (entries) {
    var seen = entries[0].isIntersecting;
    if (done) return;
    if (seen && !started) {
      started = true;
      anims.forEach(function (a) { a.beginElement(); });
    } else if (started) {
      seen ? svg.unpauseAnimations() : svg.pauseAnimations();
    }
  }, { threshold: 0.5 }).observe(fr);
})();
