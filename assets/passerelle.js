// Kairosong — la passerelle des soirées, protocole v1 (cadrage landing § 3 bis).
//
// Avant la bascule, l'app vivait sur kairosong.com : les téléphones y ont rangé « Mes soirées »
// (`quiz:parties`), les soirées retirées de la liste (`quiz:parties:hidden`) et les étoiles de
// chaque soirée (`quiz:stars:<clé de soirée>`). L'app déménage sur app.kairosong.com, donc dans une
// autre mémoire. Cette page, servie sur l'ancienne origine, les lui passe UNE fois :
//
//   1. un cadre invisible charge https://app.kairosong.com/import ;
//   2. le cadre envoie la chaîne « prêt » quand il écoute — on n'envoie rien avant ;
//   3. on lui envoie l'enveloppe (les valeurs brutes, telles qu'elles sont rangées), origine cible
//      explicite ;
//   4. l'app fusionne et répond la chaîne « reçu » ;
//   5. alors seulement, on efface `quiz:parties` et `quiz:parties:hidden`, et on pose
//      `quiz:parties:migrated`. ⛔ Les `quiz:stars:*` restent : aucun code n'efface une étoile.
//
// Sans « reçu » dans le délai, on retire le cadre sans rien effacer : la passerelle réessaiera à
// la prochaine visite (l'app ne double rien). Aucune erreur n'est affichée ni journalisée.
// ⛔ Rien de tout cela ne part vers la mesure d'audience.
(function () {
  var APP = 'https://app.kairosong.com';
  var PARTIES = 'quiz:parties';
  var HIDDEN = 'quiz:parties:hidden';
  var STARS = 'quiz:stars:';
  var DONE = 'quiz:parties:migrated';
  var READY = 'prêt';
  var ACK = 'reçu';
  // La forme d'une clé de soirée (ABCD-20260724-7f3a) : une autre clé qui partage le préfixe
  // n'est pas une étoile et ne part pas.
  var PARTY_KEY = /^[A-Z0-9]+-\d{8}-[0-9a-f]{4}$/;
  var TIMEOUT_MS = 15000;

  // Une page qui redirige un lien d'invitation s'en va : on ne commence rien.
  if (/[?&]join=/.test(location.search)) return;

  var envelope;
  try {
    if (localStorage.getItem(DONE) !== null) return;
    var parties = localStorage.getItem(PARTIES);
    var stars = {};
    var starLists = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key === null || key.indexOf(STARS) !== 0) continue;
      var partyKey = key.slice(STARS.length);
      if (!PARTY_KEY.test(partyKey)) continue;
      stars[partyKey] = localStorage.getItem(key);
      starLists++;
    }
    if (parties === null && starLists === 0) return; // rien à passer
    envelope = {
      schema: 'kairosong/passerelle',
      version: 1,
      parties: parties,
      hidden: localStorage.getItem(HIDDEN),
      stars: stars,
    };
  } catch (e) {
    return; // mémoire locale inaccessible (navigation privée, blocage) : rien à passer
  }

  var frame = document.createElement('iframe');
  var timer = 0;
  var sent = false;

  function cleanup() {
    clearTimeout(timer);
    window.removeEventListener('message', onMessage);
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  }

  function onMessage(event) {
    if (event.origin !== APP || event.source !== frame.contentWindow) return;
    if (event.data === READY && !sent) {
      sent = true;
      frame.contentWindow.postMessage(envelope, APP);
      return;
    }
    if (event.data !== ACK || !sent) return;
    try {
      localStorage.removeItem(PARTIES);
      localStorage.removeItem(HIDDEN);
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
  window.addEventListener('message', onMessage);
  timer = setTimeout(cleanup, TIMEOUT_MS);
  frame.src = APP + '/import';
  document.body.appendChild(frame);
})();
