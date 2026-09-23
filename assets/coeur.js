/* « Le cœur du jeu », un geste, une fois : ton année roule jusqu'à la réponse. Quand l'année est bien
   à l'écran, le chiffre des dizaines passe de 8 à 6 en deux crans, puis « Then the answer lands… »,
   puis la frise et la dernière phrase (tout le minutage est dans site.css, chaque temps part à la fin
   du précédent). Si l'année a déjà filé hors de l'écran, ou si l'on arrive par en dessous, l'image
   finale se pose d'un coup, sans rejouer.
   Sans script ou avec « réduire les animations » : l'image finale, sans rouleau. */
(function () {
  var heart = document.querySelector('.heart');
  var year = heart && heart.querySelector('.heart-year');
  var roue = year && year.querySelector('.heart-roue');
  if (!roue || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
})();
