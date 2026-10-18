(function (root) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  function cameraState(progress, portrait) {
    const p = clamp(progress);
    return {
      x: -3 + Math.sin(p * Math.PI * 2) * 3,
      y: 2.8 + Math.sin(p * Math.PI * 3) * 1.8,
      z: 57 - p * 390,
      targetOffsetX: portrait ? 7 : 2,
      fov: portrait ? 1.15 : 0.88
    };
  }

  function create(B, canvas, options) {
    const opts = options || {};
    const engine = opts.engine || new B.Engine(canvas, true, {
      preserveDrawingBuffer: false, stencil: false, powerPreference: 'low-power'
    });
    if (!opts.engine) engine.setHardwareScalingLevel(1 / Math.min(root.devicePixelRatio || 1, 1.35));
    const scene = new B.Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor = new B.Color4(0.025, 0.052, 0.115, 1);
    scene.fogMode = B.Scene.FOGMODE_EXP2;
    scene.fogColor = new B.Color3(0.025, 0.052, 0.115);
    scene.fogDensity = 0.006;
    scene.skipPointerMovePicking = true;
    const camera = new B.FreeCamera('parcours', new B.Vector3(-3, 2.8, 57), scene);
    camera.minZ = 0.4;
    camera.maxZ = 550;
    camera.inputs.clear();
    scene.activeCamera = camera;
    const sky = new B.HemisphericLight('lumiere', new B.Vector3(-1, 1, 0.5), scene);
    sky.intensity = 1.1;
    sky.groundColor = new B.Color3(0.12, 0.2, 0.4);
    const sun = new B.DirectionalLight('relief', new B.Vector3(-0.4, -0.7, -1), scene);
    sun.intensity = 1.45;
    sun.diffuse = new B.Color3(0.72, 0.86, 1);

    const materials = {};
    function material(name, hex, emissive, alpha) {
      const m = new B.StandardMaterial(name, scene);
      const c = B.Color3.FromHexString(hex);
      m.diffuseColor = c;
      m.emissiveColor = c.scale(emissive || 0);
      m.specularColor = new B.Color3(0.6, 0.75, 1);
      m.specularPower = 80;
      if (alpha !== undefined) m.alpha = alpha;
      materials[name] = m;
      return m;
    }
    const blue = material('cobalt', '#3659EE', 0.18);
    const mint = material('lumiere-douce', '#BFF5E2', 0.45);
    const porcelain = material('porcelaine', '#CFDBFF', 0.12);
    const steel = material('architecture', '#23395C', 0.1);
    const wire = material('anneaux', '#658DF6', 0.4, 0.55);
    const ghost = material('lignes-profondes', '#41609D', 0.2, 0.3);

    const groups = [];
    function group(name, z) {
      const n = new B.TransformNode(name, scene);
      n.position.set(10, 0, z);
      groups.push(n);
      return n;
    }
    function torus(name, diameter, thickness, parent, mat, position) {
      const mesh = B.MeshBuilder.CreateTorus(name, { diameter, thickness, tessellation: 72 }, scene);
      mesh.rotation.x = Math.PI / 2;
      mesh.parent = parent;
      mesh.material = mat;
      if (position) mesh.position.copyFromFloats(...position);
      mesh.isPickable = false;
      return mesh;
    }
    function sphere(name, size, parent, mat, position) {
      const mesh = B.MeshBuilder.CreateSphere(name, { diameter: size, segments: 12 }, scene);
      mesh.parent = parent;
      mesh.material = mat;
      mesh.position.copyFromFloats(...position);
      mesh.isPickable = false;
      return mesh;
    }
    function box(name, dimensions, parent, mat, position) {
      const mesh = B.MeshBuilder.CreateBox(name, { width: dimensions[0], height: dimensions[1], depth: dimensions[2] }, scene);
      mesh.parent = parent;
      mesh.material = mat;
      mesh.position.copyFromFloats(...position);
      mesh.isPickable = false;
      return mesh;
    }
    function lines(name, segments, parent, color, alpha) {
      const mesh = B.MeshBuilder.CreateLineSystem(name, {
        lines: segments.map(s => s.map(v => new B.Vector3(...v)))
      }, scene);
      mesh.parent = parent;
      mesh.color = B.Color3.FromHexString(color);
      mesh.alpha = alpha === undefined ? 0.5 : alpha;
      mesh.isPickable = false;
      return mesh;
    }

    // A portal that the camera crosses, rather than a flat page reveal.
    const portal = group('le-cap', 0);
    [43, 34, 25, 16].forEach((diameter, i) => torus('expansion-' + i, diameter, i === 3 ? 0.24 : 0.09, portal, i === 3 ? mint : wire));
    sphere('point-de-depart', 2, portal, mint, [0, 0, -4]);
    for (let i = 0; i < 20; i++) {
      const a = i * Math.PI * 2 / 20;
      sphere('possibilite-' + i, i % 4 === 0 ? 0.5 : 0.16, portal, i % 4 === 0 ? mint : porcelain,
        [Math.cos(a) * 17, Math.sin(a) * 17, -2 + Math.sin(a * 2) * 2]);
    }

    // An open architectural space: the learning chapter.
    const school = group('apprendre', -80);
    box('socle', [31, 0.45, 22], school, steel, [0, -8, 0]);
    for (let i = 0; i < 6; i++) {
      const x = (i % 3 - 1) * 10;
      const z = Math.floor(i / 3) * -14 + 7;
      box('pilier-' + i, [0.55, 15, 0.55], school, porcelain, [x, -0.5, z]);
      box('base-' + i, [2.2, 0.8, 2.2], school, blue, [x, -7.5, z]);
    }
    box('traverse-avant', [21, 0.55, 0.55], school, porcelain, [0, 7, 7]);
    box('traverse-arriere', [21, 0.55, 0.55], school, porcelain, [0, 7, -7]);
    const book = box('question-ouverte', [5.5, 0.25, 8], school, mint, [0, -0.5, -2]);
    book.rotation.z = -0.18;
    const book2 = box('exploration', [5.5, 0.25, 8], school, porcelain, [5.4, -0.5, -2]);
    book2.rotation.z = 0.18;
    torus('curiosite', 15, 0.09, school, wire, [2, 0, -6]);
    lines('liens-apprentissage', [
      [[-10, 7, 7], [0, 11, -4], [10, 7, -7]],
      [[-10, 7, -7], [0, 11, -4], [10, 7, 7]]
    ], school, '#BFF5E2', 0.55);
    sphere('question', 1.25, school, mint, [0, 11, -4]);

    // A network without invented people, project names or usage numbers.
    const ideas = group('creer', -160);
    const positions = [];
    for (let i = 0; i < 32; i++) {
      const y = 1 - i / 31 * 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = i * 2.399963229728653;
      const p = [Math.cos(angle) * radius * 15, y * 12, Math.sin(angle) * radius * 10];
      positions.push(p);
      sphere('idee-' + i, i % 7 === 0 ? 1.8 : 0.7, ideas, i % 7 === 0 ? mint : blue, p);
    }
    const ideaLines = [];
    positions.forEach((p, i) => {
      ideaLines.push([p, positions[(i + 5) % positions.length]]);
      if (i % 2 === 0) ideaLines.push([p, positions[(i + 11) % positions.length]]);
    });
    lines('relations', ideaLines, ideas, '#87A9FF', 0.44);
    torus('cadre-projets', 36, 0.05, ideas, ghost);

    // Two separate circuits, with no upward return chart or fake balance.
    const exchange = group('echanger', -240);
    const domestic = new B.TransformNode('circuit-france', scene); domestic.parent = exchange; domestic.position.set(-9, 0, 0);
    const retirement = new B.TransformNode('circuit-retraite', scene); retirement.parent = exchange; retirement.position.set(10, 0, -5);
    [17, 12, 7].forEach((d, i) => {
      torus('eh-' + i, d, i === 0 ? 0.24 : 0.08, domestic, i === 0 ? blue : wire);
      torus('euros-' + i, d, i === 0 ? 0.24 : 0.08, retirement, i === 0 ? mint : wire);
    });
    sphere('circulation-france', 1.4, domestic, blue, [0, 0, 0]);
    sphere('capital-retraite', 1.4, retirement, mint, [0, 0, 0]);
    const coins = [];
    for (let i = 0; i < 10; i++) coins.push(sphere('circulation-' + i, 0.45, i < 5 ? domestic : retirement, i < 5 ? blue : mint, [0, 0, 0]));

    // Collective governance: many connected points, no central seat.
    const collective = group('gouverner-ensemble', -340);
    const citizens = [];
    for (let i = 0; i < 40; i++) {
      const a = i * Math.PI * 2 / 40;
      const r = i % 2 === 0 ? 16 : 12;
      const p = [Math.cos(a) * r, Math.sin(a) * r * 0.75, Math.sin(a * 3) * 5];
      citizens.push(p);
      sphere('participation-' + i, i % 3 === 0 ? 1 : 0.55, collective, i % 3 === 0 ? mint : blue, p);
    }
    lines('participation-continue', citizens.map((p, i) => [p, citizens[(i + 7) % citizens.length]]), collective, '#BFF5E2', 0.3);
    torus('cercle-collectif', 39, 0.06, collective, wire);
    lines('chemin', [[[-4, -11, 30], [4, -11, -70], [-3, -11, -150], [4, -11, -230], [0, -11, -340]]], null, '#3659EE', 0.3);
    scene.metadata = { chapters: 5, purpose: 'Programme de campagne, illustrations conceptuelles' };
    let disposed = false;
    const api = {
      scene, camera, engine,
      update(progress, portrait) {
        if (disposed) return;
        const p = clamp(progress);
        const c = cameraState(p, portrait);
        camera.position.set(c.x, c.y, c.z);
        camera.fov = c.fov;
        camera.setTarget(new B.Vector3(c.x + c.targetOffsetX, 0, c.z - 45));
        ideas.rotation.z = p * 0.27;
        coins.forEach((coin, i) => {
          const a = i * 1.256 + p * Math.PI * 3;
          coin.position.set(Math.cos(a) * 7, Math.sin(a) * 7, Math.sin(a * 2) * 1.5);
        });
        scene.render();
      },
      resize() { if (!disposed) engine.resize(); },
      dispose() { if (!disposed) { disposed = true; scene.dispose(); if (!opts.engine) engine.dispose(); } }
    };
    return api;
  }
  root.ExpansionWorld = { create, cameraState };
})(typeof window !== 'undefined' ? window : globalThis);
