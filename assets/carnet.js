/* « Ce qui reste » : le carnet de l'app joue une fois, à son arrivée à l'écran, puis reste sur
   son image finale (celle de l'affiche). Sans script ou avec « réduire les animations » :
   l'affiche seule, pas de lecture. */
(function () {
  var v = document.querySelector('video.carnet');
  if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  v.muted = true;
  var see = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    see.disconnect();
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }, { threshold: 0.6 });
  see.observe(v);
})();
