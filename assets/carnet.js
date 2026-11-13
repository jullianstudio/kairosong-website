/* Explore, le carnet et la danse de victoire : chaque vidéo tourne en boucle tant qu'elle est à l'écran,
   et s'arrête dès qu'elle en sort. Sans script ou avec « réduire les animations » : l'affiche
   seule, pas de lecture. */
(function () {
  var videos = document.querySelectorAll('video.en-vue');
  if (!videos.length || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var p = e.target.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        e.target.pause();
      }
    });
  }, { threshold: 0.6 });
  [].forEach.call(videos, function (v) {
    v.muted = true;
    v.loop = true;
    io.observe(v);
  });
})();
