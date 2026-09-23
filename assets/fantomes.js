/* Le milieu de la page : les années fantômes du cœur du jeu restent, derrière le texte, de
   « Comment ça marche » aux questions. Elles descendent avec la page plus lentement que lui
   (parallaxe, en transform seul, calculée au défilement) et flottent de quelques pixels par
   seconde (animation CSS). Les deux ne tournent que tant que le champ est à l'écran.
   Sans script ou avec « réduire les animations » : immobiles. */
(function () {
  var nuit = document.querySelector('.nuit');
  if (!nuit || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var couches = [].slice.call(nuit.querySelectorAll('.fantomes-couche'));
  var live = false, tick = 0;
  // Part du défilement que chaque couche rend : la lointaine va le moins vite.
  var parallax = function () {
    tick = 0;
    var r = nuit.getBoundingClientRect();
    // 0 quand le milieu du champ passe au milieu de l'écran ; la couche rend k de l'écart.
    var y = innerHeight / 2 - (r.top + r.height / 2);
    couches.forEach(function (c) {
      var k = c.classList.contains('fantomes-loin') ? 0.4 : 0.22;
      c.style.transform = 'translate3d(0,' + (y * k).toFixed(1) + 'px,0)';
    });
  };
  parallax();
  new IntersectionObserver(function (entries) {
    live = entries[0].isIntersecting;
    nuit.classList.toggle('is-live', live); // le flottement ne tourne qu'à l'écran
    if (live) parallax();
  }).observe(nuit);
  addEventListener('scroll', function () {
    if (live && !tick) tick = requestAnimationFrame(parallax);
  }, { passive: true });
})();
