/* Fin de page : la pleine lune en halo derrière le dernier bloc (« Prêt quand la musique
   l'est. » et « Jouer »). Des ondes emplissent la pièce, se resserrent, et il reste un halo
   doux et diffus, où des ondes se devinent encore ; pas d'année (1983 est révélée plus haut).
   Les ondes restent faibles à l'intérieur, là où passe le texte. Une fois, 6 s, à son arrivée
   à l'écran. Code repris de l'essai « La pleine lune » (WebGL, un shader, sans bibliothèque).
   Sans WebGL, sans script, avec « réduire les animations », ou si l'appareil rame : l'image
   finale. */
(function () {
  var stage = document.querySelector('.lune');
  var cv = stage && stage.querySelector('canvas');
  if (!cv || !('IntersectionObserver' in window)) return;
  var gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return; // le cercle CSS reste
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = 6;
  var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  // Trois sources (la pièce, ses murs) se rejoignent au centre ; l'énergie se resserre sur un halo, puis se fige.
  var fs = 'precision mediump float;\n' +
    'uniform vec2 r;uniform float t;\n' +
    'float ss(float a,float b,float x){return smoothstep(a,b,x);}\n' +
    'float wave(vec2 p,vec2 s,float k){float l=length(p-s);return pow(.5+.5*sin(l*k-t*4.),24.)*exp(-l*3.5);}\n' +
    'void main(){\n' +
    '  vec2 p=(gl_FragCoord.xy-.5*r)/r.y;\n' +
    '  float u=t/' + T + '.,d=length(p),R=.3;\n' +
    '  float conv=ss(.18,.62,u);\n' +
    '  float k=mix(30.,52.,conv);\n' +
    '  vec2 c=vec2(0.);\n' +
    '  float f=wave(p,mix(vec2(-.45,.28),c,conv),k)+wave(p,mix(vec2(.5,-.1),c,conv),k*1.07)+wave(p,mix(vec2(-.05,-.38),c,conv),k*.93);\n' +
    '  float band=mix(1.5,.7,ss(.35,.8,u));\n' +
    '  float amp=ss(0.,.16,u)*(1.-.5*ss(.62,.88,u));\n' +
    '  float waves=f*amp*exp(-pow((d-R)/band,2.))*.55*ss(.02,.22,d+1.-conv)*mix(.5,1.,ss(R*.9,R*1.05,d));\n' +
    '  float ring=exp(-pow((d-R)/mix(.1,.08,ss(.55,.95,u)),2.))*ss(.5,.9,u)*.22;\n' +
    '  gl_FragColor=vec4(vec3(.765,.733,.678)*(waves+ring*.95),1.);\n' +
    '}';
  var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't');
  var size = function () {
    var b = stage.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(b.width * dpr); cv.height = Math.round(b.height * dpr);
    gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height);
  };
  var draw = function (t) { gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  var elapsed = still ? T : 0, raf = 0, t0 = 0, visible = false, done = still, frames = 0, since = 0, from = 0, checked = false;
  // Contexte perdu (téléphone à court de mémoire) : on rend la main au cercle CSS.
  cv.addEventListener('webglcontextlost', function () { cancelAnimationFrame(raf); raf = 0; done = true; stage.classList.remove('is-gl'); });
  var lastW = 0;
  addEventListener('resize', function () {
    var w = stage.getBoundingClientRect().width;
    if (w === lastW || gl.isContextLost()) return;
    lastW = w; size(); draw(elapsed);
  });
  size(); lastW = stage.getBoundingClientRect().width;
  stage.classList.add('is-gl');
  draw(elapsed);
  if (still) return;

  var finish = function () {
    elapsed = T; done = true; raf = 0;
    draw(T);
  };
  var frame = function (now) {
    elapsed = Math.min(T, (now - t0) / 1000);
    // L'appareil rame vraiment (moins de 15 images en une seconde) : on pose l'image finale. La
    // mesure part 300 ms après la première image, une fois le GPU en route : ses premières images,
    // lentes même sur un bon ordinateur, ne comptent pas.
    if (!checked && now - since >= 300) {
      if (!frames) from = now;
      frames++;
      if (now - from >= 1000) { checked = true; if (frames < 15) { finish(); return; } }
    }
    draw(elapsed);
    if (elapsed >= T) { done = true; raf = 0; return; } // fini : le GPU se tait
    raf = requestAnimationFrame(frame);
  };
  var run = function () {
    if (raf || done || !visible) return;
    raf = requestAnimationFrame(function (now) { t0 = now - elapsed * 1000; since = now; frames = 0; frame(now); });
  };
  var stop = function () { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    visible ? run() : stop();
  }, { threshold: 0.5 }).observe(stage);
})();
