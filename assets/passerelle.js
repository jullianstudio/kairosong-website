// Kairosong — la passerelle des soirées (cadrage landing § 3 bis).
//
// Avant la bascule, l'app vivait sur kairosong.com : les téléphones y ont rangé « Mes soirées »
// sous la clé `quiz:parties`. L'app déménage sur app.kairosong.com, donc dans une autre mémoire.
// Cette page, servie sur l'ancienne origine, lit la clé et la passe UNE fois à l'app :
//
//   1. un cadre invisible charge https://app.kairosong.com/import ;
//   2. au chargement, on lui envoie le contenu brut de `quiz:parties` (une chaîne, telle
//      qu'elle est rangée) par postMessage, origine cible explicite ;
//   3. l'app fusionne et répond la chaîne « reçu » ;
//   4. alors seulement, on efface `quiz:parties` et on pose `quiz:parties:migrated`.
//
// Sans réponse dans le délai, on retire le cadre sans rien effacer : la passerelle
// réessaiera à la prochaine visite. Aucune erreur n'est affichée ni journalisée.
// ⛔ Rien de tout cela ne part vers la mesure d'audience.
(function () {
  var APP = 'https://app.kairosong.com';
  var KEY = 'quiz:parties';
  var DONE = 'quiz:parties:migrated';
  var ACK = 'reçu';
  var TIMEOUT_MS = 15000;

  // Une page qui redirige un lien d'invitation s'en va : on ne commence rien.
  if (/[?&]join=/.test(location.search)) return;

  var raw;
  try {
    if (localStorage.getItem(DONE) !== null) return;
    raw = localStorage.getItem(KEY);
  } catch (e) {
    return; // mémoire locale inaccessible (navigation privée, blocage) : rien à passer
  }
  if (raw === null) return;

  var frame = document.createElement('iframe');
  var timer = 0;

  function cleanup() {
    clearTimeout(timer);
    window.removeEventListener('message', onMessage);
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  }

  function onMessage(event) {
    if (event.origin !== APP || event.source !== frame.contentWindow) return;
    if (event.data !== ACK) return;
    try {
      localStorage.removeItem(KEY);
      localStorage.setItem(DONE, new Date().toISOString());
    } catch (e) {
      // l'effacement a échoué : la copie reste et repartira à la prochaine visite
    }
    cleanup();
  }

  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('tabindex', '-1');
  frame.title = 'Kairosong';
  frame.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
  frame.addEventListener('load', function () {
    frame.contentWindow.postMessage(raw, APP);
  });
  window.addEventListener('message', onMessage);
  timer = setTimeout(cleanup, TIMEOUT_MS);
  frame.src = APP + '/import';
  document.body.appendChild(frame);
})();
