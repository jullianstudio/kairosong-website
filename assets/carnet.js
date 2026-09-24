/* « Ce qui reste » : le carnet de l'app tourne en boucle tant qu'il est à l'écran, et s'arrête
   dès qu'il en sort. Sans script ou avec « réduire les animations » : l'affiche seule, pas de
   lecture. */
(function () {
  var v = document.querySelector('video.carnet');
  if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  v.muted = true;
  v.loop = true;
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      v.pause();
    }
  }, { threshold: 0.6 }).observe(v);
})();
