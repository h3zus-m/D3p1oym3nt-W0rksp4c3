// Industrial scene: illustrative geometry, verified operational annotations.
import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

export function initBriefing3D(container, onSelect, onReady = () => {}, onState = () => {}) {
  const abort = new AbortController();
  let disposed = false, frame = 0, station = 'generac', view = 'iso', moving = false;
  let motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let explode = 0, explodeTarget = 0, dimensions = true, imported = false, focusedPart = null, focusedMesh = null;
  let lastFrameTime = performance.now(), actionClock = 0;
  const groups = {}, objects = [], pins = [], explodeParts = [], partMeshes = new Map(), slotBins = [];
  const actions = Object.fromEntries(['sourcing', 'slotting', 'ndt'].map(id => [id, {status: 'idle', progress: 0, elapsed: 0}]));
  let activeAction = null, focusPin = null;
  const listen = (target, name, fn, options = {}) => target.addEventListener(name, fn, {...options, signal: abort.signal});
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label', 'Interactive industrial model. Drag to orbit, scroll to zoom, or select a component.');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
  container.replaceChildren(renderer.domElement);
  const pinLayer = document.createElement('div');
  pinLayer.className = 'twin-pins';
  pinLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.append(pinLayer);
  const svgNS = 'http://www.w3.org/2000/svg';
  const leaders = document.createElementNS(svgNS, 'svg');
  leaders.setAttribute('aria-hidden', 'true');
  leaders.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
  pinLayer.append(leaders);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08080a);
  scene.fog = new THREE.Fog(0x08080a, 22, 48);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 1.4, 0), desiredTarget = target.clone();
  const desiredPosition = new THREE.Vector3(9, 7.5, 10.5);
  camera.position.copy(desiredPosition);camera.lookAt(target);

  // Broad, neutral studio reflections make machined metal legible on dark slate.
  const environmentCanvas = document.createElement('canvas');
  environmentCanvas.width = 512;environmentCanvas.height = 256;
  const ctx = environmentCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#c7cbd4');gradient.addColorStop(.46, '#656b76');
  gradient.addColorStop(.54, '#22252c');gradient.addColorStop(1, '#454a54');
  ctx.fillStyle = gradient;ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#ffffff';ctx.fillRect(30, 30, 145, 75);ctx.fillRect(340, 30, 80, 120);
  const environmentTexture = new THREE.CanvasTexture(environmentCanvas);
  environmentTexture.mapping = THREE.EquirectangularReflectionMapping;
  environmentTexture.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(environmentTexture);
  scene.environment = environment.texture;environmentTexture.dispose();pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xffffff, .8));
  const key = new THREE.DirectionalLight(0xf4f7ff, 2.8);
  key.position.set(5, 12, 7);key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);key.shadow.camera.left = -12;key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;key.shadow.camera.bottom = -12;key.shadow.normalBias = .035;scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 2.2);rim.position.set(-8, 7, -6);scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.2);fill.position.set(2, 3, -8);scene.add(fill);
  const mats = {
    aluminum: new THREE.MeshStandardMaterial({color: 0x9caebc, metalness: .85, roughness: .22}),
    dark: new THREE.MeshStandardMaterial({color: 0x22252c, metalness: .65, roughness: .36}),
    steel: new THREE.MeshStandardMaterial({color: 0x6d8394, metalness: .8, roughness: .28}),
    blue: new THREE.MeshStandardMaterial({color: 0x137cbd, metalness: .12, roughness: .35}),
    accent: new THREE.MeshStandardMaterial({color: 0xe02424, metalness: .35, roughness: .4}),
    pcb: new THREE.MeshStandardMaterial({color: 0x142a38, metalness: .08, roughness: .72}),
    copper: new THREE.MeshStandardMaterial({color: 0xc87a3e, metalness: .9, roughness: .25}),
    black: new THREE.MeshStandardMaterial({color: 0x090d10, metalness: .02, roughness: .78}),
    gold: new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: .88, roughness: .26}),
    silver: new THREE.MeshStandardMaterial({color: 0xc1cbd2, metalness: .92, roughness: .2}),
    gasket: new THREE.MeshStandardMaterial({color: 0x101519, metalness: 0, roughness: .93}),
    carton: new THREE.MeshStandardMaterial({color: 0x8798a4, metalness: .08, roughness: .82}),
    light: new THREE.MeshStandardMaterial({color: 0xdce7ef, metalness: .4, roughness: .42}),
    glass: new THREE.MeshStandardMaterial({color: 0xff3b30, transparent: true, opacity: .16, metalness: .25, roughness: .15, depthWrite: false})
  };
  function box(group, size, position, material = mats.dark) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);mesh.castShadow = true;mesh.receiveShadow = true;group.add(mesh);return mesh;
  }
  function cylinder(group, radius, length, position, material = mats.steel, horizontal = false) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 40), material);
    mesh.position.set(...position);if (horizontal) mesh.rotation.z = Math.PI / 2;
    mesh.castShadow = true;mesh.receiveShadow = true;group.add(mesh);return mesh;
  }
  function segment(group, a, b, radius, material = mats.dark) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = cylinder(group, radius, start.distanceTo(end), start.clone().add(end).multiplyScalar(.5).toArray(), material);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());return mesh;
  }
  function line(group, points, color = 0x6c727e, opacity = .8) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({color, transparent: true, opacity}));group.add(mesh);return mesh;
  }
  function group(id) {const result = new THREE.Group();groups[id] = result;result.visible = id === station;scene.add(result);return result;}
  function registerPart(mesh, partId) {if (!partId) return;mesh.userData.partId = partId;if (!partMeshes.has(partId)) partMeshes.set(partId, []);partMeshes.get(partId).push(mesh);}
  function item(mesh, id, name, specs, metric, partId = mesh.userData.partId) {mesh.userData = {...mesh.userData, id, name, specs, metric};registerPart(mesh, partId);objects.push(mesh);return mesh;}
  function pin(mesh, label, sub, offset = [0, 0, 0], role = 'context') {
    const button = document.createElement('button');button.type = 'button';button.className = 'twin-pin';
    button.dataset.pinRole = role;
    button.style.cssText = 'position:absolute;left:0;top:0;pointer-events:auto;color:#ffffff;background:#15181ef7;border:1px solid #22252c;border-left:2px solid #e02424;border-radius:2px;padding:5px 7px;text-align:left;font:10px var(--mono,Consolas,monospace);line-height:1.45;white-space:nowrap;box-shadow:0 2px 10px #0008;cursor:pointer;z-index:1;';
    const title = document.createElement('span');title.textContent = label;title.style.cssText = 'display:block;font-weight:bold;letter-spacing:.04em;';
    const secondary = document.createElement('span');secondary.textContent = sub;secondary.style.color = '#9ea3ae';
    button.append(title, secondary);button.setAttribute('aria-label', `Inspect ${mesh.userData.name || label}: ${sub}`);
    let record;
    listen(button, 'click', e => {e.stopPropagation();selectMesh(record.mesh);});
    listen(button, 'pointerenter', () => {button.style.borderColor = '#ff3b30';button.style.boxShadow = '0 0 12px #e0242433';});
    listen(button, 'pointerleave', () => {button.style.borderColor = '#22252c';button.style.borderLeftColor = '#e02424';button.style.boxShadow = '0 2px 10px #0008';});
    const leader = document.createElementNS(svgNS, 'line');
    leader.setAttribute('stroke', '#9ea3ae');leader.setAttribute('stroke-width', '1');leader.setAttribute('stroke-opacity', '.75');
    const dot = document.createElementNS(svgNS, 'circle');dot.setAttribute('r', '2.5');dot.setAttribute('fill', '#ff3b30');dot.style.filter = 'drop-shadow(0 0 3px #ff3b30)';
    leaders.append(leader, dot);
    record = {mesh, button, title, secondary, leader, dot, role, offset: new THREE.Vector3(...offset)};
    pinLayer.append(button);pins.push(record);return button;
  }
  function ensureCBOMParts(boardMesh, baseMesh) {
    const extra = [
      ['CBOM-06', 'Illustrative boost power FET', [.98, .13, -1.5], [.32, .13, .35], mats.black],
      ['CBOM-07', 'Illustrative DSP microcontroller', [-.9, .13, -1.45], [.5, .14, .48], mats.black],
      ['CBOM-10', 'Illustrative grid disconnect relay', [2.16, .2, -1.3], [.56, .32, .58], mats.blue],
      ['CBOM-12', 'Illustrative RF transceiver module', [-2.1, .14, -1.3], [.55, .17, .45], mats.silver],
      ['CBOM-13', 'Illustrative Hall current sensor', [-.28, .13, -1.5], [.25, .15, .28], mats.black],
      ['CBOM-17', 'Illustrative isolated bias controller', [.35, .13, -1.5], [.25, .14, .3], mats.black],
      ['CBOM-18', 'Illustrative thermal interface pad', [2.3, -.06, .7], [.45, .035, .7], mats.light],
      ['CBOM-20', 'Illustrative current shunt resistor', [-.15, .1, -.36], [.35, .09, .15], mats.silver]
    ];
    const available = id => partMeshes.get(id)?.some(visible);
    const context = 'Illustrative component family linked to the user-confirmed CBOM snapshot. Internal placement is explanatory, not manufacturer CAD.';
    for (const [id, name, position, size, material] of extra) {
      if (available(id)) continue;
      const mesh = item(box(boardMesh, size, position, material), id, name, context, 'Technical and commercial details are available in the linked CBOM row.', id);
      if (['CBOM-06', 'CBOM-07', 'CBOM-13', 'CBOM-17'].includes(id)) {
        for (const side of [-1, 1]) for (let i = 0; i < 4; i++) box(mesh, [.09, .025, .025], [side * (size[0] / 2 + .035), -.035, -size[2] * .3 + i * size[2] * .2], mats.silver);
      }
    }
    if (!available('CBOM-08')) item(cylinder(baseMesh, .16, .65, [-3.1, .1, .7], mats.black, true), 'CBOM-08', 'Illustrative PV input connector', context, 'Connector family linked to CBOM-08.', 'CBOM-08');
    if (!available('CBOM-09')) item(cylinder(baseMesh, .2, .6, [3.1, .1, -.6], mats.black, true), 'CBOM-09', 'Illustrative AC trunk connector', context, 'Connector family linked to CBOM-09.', 'CBOM-09');
    if (!available('CBOM-11')) {
      const toroid = new THREE.Mesh(new THREE.TorusGeometry(.26, .09, 12, 40), mats.copper);toroid.rotation.x = -Math.PI / 2;toroid.position.set(1.4, .18, .8);boardMesh.add(toroid);
      item(toroid, 'CBOM-11', 'Illustrative toroidal boost inductor', context, 'Magnetics family linked to CBOM-11.', 'CBOM-11');
    }
    if (!available('CBOM-14')) {
      const choke = new THREE.Mesh(new THREE.TorusGeometry(.16, .065, 12, 32), mats.black);choke.rotation.x = -Math.PI / 2;choke.position.set(1.6, .16, -1.47);boardMesh.add(choke);
      item(choke, 'CBOM-14', 'Illustrative common-mode choke', context, 'EMI magnetics family linked to CBOM-14.', 'CBOM-14');
      for (let i = 0; i < 8; i++) {const winding = new THREE.Mesh(new THREE.TorusGeometry(.075, .012, 6, 16), mats.copper);const angle = i / 8 * Math.PI * 2;winding.position.set(Math.cos(angle) * .16, Math.sin(angle) * .16, 0);winding.rotation.y = angle;choke.add(winding);}
    }
    if (!available('CBOM-15')) item(box(boardMesh, [.18, .08, .1], [.65, .09, -.36], mats.light), 'CBOM-15', 'Illustrative ceramic capacitor', context, 'MLCC family linked to CBOM-15.', 'CBOM-15');
    if (!available('CBOM-16')) {
      const resinMaterial = new THREE.MeshStandardMaterial({color: 0x25323b, roughness: .48, transparent: true, opacity: .24, depthWrite: false});
      item(box(boardMesh, [4.85, .035, 2.95], [0, -.075, 0], resinMaterial), 'CBOM-16', 'Illustrative potting resin region', context, 'Material region linked to CBOM-16.', 'CBOM-16');
    }
    if (!available('CBOM-19')) {
      const mov = cylinder(boardMesh, .16, .065, [-1.5, .25, -1.5], mats.blue);mov.rotation.x = Math.PI / 2;
      item(mov, 'CBOM-19', 'Illustrative metal-oxide varistor', context, 'Surge protection family linked to CBOM-19.', 'CBOM-19');
    }
  }
  function fixture(group, w, d) {
    box(group, [w, .16, d], [0, .08, 0], mats.dark);
    box(group, [w, .035, .035], [0, .18, d / 2], mats.steel);
    for (const x of [-1, 1]) for (const z of [-1, 1]) cylinder(group, .065, .035, [x * (w / 2 - .2), .18, z * (d / 2 - .2)], mats.light);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({color: 0x08080a, toneMapped: false}));
  floor.rotation.x = -Math.PI / 2;floor.position.y = -.025;scene.add(floor);
  const floorShadows = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({color: 0x000000, opacity: .32, depthWrite: false}));
  floorShadows.rotation.x = -Math.PI / 2;floorShadows.position.y = -.022;floorShadows.receiveShadow = true;scene.add(floorShadows);
  const grid = new THREE.GridHelper(40, 40, 0x181b22, 0x181b22);grid.position.y = -.012;
  grid.material.transparent = true;grid.material.opacity = .65;scene.add(grid);

  const gen = group('generac');fixture(gen, 8, 5.7);
  const contactCanvas = document.createElement('canvas');contactCanvas.width = contactCanvas.height = 128;
  const contactCtx = contactCanvas.getContext('2d'), contactGradient = contactCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
  contactGradient.addColorStop(0, 'rgba(0,0,0,.72)');contactGradient.addColorStop(.55, 'rgba(0,0,0,.28)');contactGradient.addColorStop(1, 'rgba(0,0,0,0)');
  contactCtx.fillStyle = contactGradient;contactCtx.fillRect(0, 0, 128, 128);
  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(7.7, 5.4), new THREE.MeshBasicMaterial({map: contactTexture, transparent: true, opacity: .72, depthWrite: false}));
  contactShadow.rotation.x = -Math.PI / 2;contactShadow.position.y = .19;gen.add(contactShadow);
  const fallback = new THREE.Group();gen.add(fallback);
  const base = item(box(fallback, [5.9, .45, 4], [0, .55, 0], mats.aluminum), 'enclosure', 'PM820 enclosure', 'Illustrative enclosure and heat-dissipation surfaces. Qualification remains part of the sourcing decision.', '20 priority CBOM components in the verified sourcing bridge.', 'ENCL-AL-DIECAST');
  for (let i = -7; i <= 7; i++) box(fallback, [.06, .3, 3.05], [i * .29, .32, 0], mats.aluminum);
  const board = item(box(fallback, [5.3, .08, 3.5], [0, .68, 0], mats.pcb), 'pcb', 'Power electronics assembly', 'Illustrative component arrangement. No individual manufacturer CAD dimensions are asserted.', '$1,247,538.11 annualized quotation opportunity across 200,000 units.');
  const electronics = new THREE.Group();fallback.add(electronics);electronics.position.y = .68;
  for (const x of [-1.3, 1.3]) registerPart(box(electronics, [.8, .28, .8], [x, .22, -.55], mats.copper), 'PWR-XFMR-01');
  for (const x of [-.45, .45]) registerPart(box(electronics, [.55, .35, .8], [x, .22, .65], mats.blue), 'CAP-BULK-450V');
  for (let i = 0; i < 4; i++) registerPart(box(electronics, [.24, .09, .35], [-1.6 + i * 1.05, .09, 0], mats.black), 'MOSFET-SIC-650V');
  registerPart(box(electronics, [.3, .1, .42], [0, .1, -.8], mats.black), 'MCU-GATE-DRV');
  const cover = item(box(fallback, [5.9, .17, 4], [0, 1.08, 0], mats.aluminum), 'cover', 'Inspection cover', 'Illustrative exploded assembly. Drag the assembly control to inspect the internal layers.', 'Baseline $4,471,763.97 | Target quotation $3,224,225.86');
  for (let i = 0; i < 16; i++) {const rib = box(fallback, [5.55, .12, .065], [0, 1.2, -1.8 + i * .24], mats.aluminum);explodeParts.push({mesh: rib, y: rib.position.y, amount: 2.2});}
  for (const mesh of [board, electronics]) explodeParts.push({mesh, y: mesh.position.y, amount: 1});
  explodeParts.push({mesh: cover, y: cover.position.y, amount: 2.2});
  ensureCBOMParts(board, base);
  const fallbackPins = [pin(base, 'ENCLOSURE', 'Qualification boundary', [2.4, -.5, 0], 'enclosure'), pin(board, 'PRIORITY CBOM', '20 components', [-2.2, 1.4, 0], 'cbom'), pin(cover, 'PM820 MICROINVERTER', 'Illustrative assembly', [0, 2.8, 0], 'assembly')];
  let assemblyBadge = 'Loading illustrative GLB';
  function paintBadge() {const badge = document.getElementById('cad-mesh-badge');if (badge) badge.textContent = station === 'generac' ? assemblyBadge : 'Illustrative operational model';}
  paintBadge();
  new GLTFLoader().load('./media/pm820-microinverter.glb', gltf => {
    if (disposed) {disposeTree(gltf.scene);return;}
    const assembly = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(assembly), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group(), scale = 6.7 / Math.max(size.x, size.z);
    wrapper.scale.setScalar(scale);assembly.position.set(-center.x, -bounds.min.y + .28 / scale, -center.z);wrapper.add(assembly);gen.add(wrapper);
    fallback.visible = false;fallbackPins.forEach(button => button.hidden = true);imported = true;
    const relevant = {};
    assembly.traverse(child => {
      if (!child.isMesh) return;
      const rawName = child.name, lower = rawName.toLowerCase();
      const original = Array.isArray(child.material) ? child.material[0] : child.material;
      const materialName = original?.name?.toLowerCase() || '';
      child.material = materialName.includes('pcb') ? mats.pcb : materialName.includes('copper') ? mats.copper : materialName.includes('film') ? mats.blue : materialName.includes('gold') ? mats.gold : materialName.includes('silver') ? mats.silver : materialName.includes('gasket') ? mats.gasket : /epoxy|ferrite|polymer/.test(materialName) ? mats.black : materialName.includes('label') ? mats.light : mats.aluminum;
      child.castShadow = true;child.receiveShadow = true;
      if (/^input_connector/.test(lower)) child.userData.partId = 'CBOM-08';
      if (/^ac_cable_gland/.test(lower)) child.userData.partId = 'CBOM-09';
      if (/^illustrative_toroidal_inductor/.test(lower)) child.userData.partId = 'CBOM-11';
      if (lower === 'surface_mount_component') {child.userData.partId = 'CBOM-15';child.material = mats.light;}
      // Inspect meaningful assemblies rather than every fastener, pad, and trace.
      if (/base_enclosure|motherboard|top_cover|planar_power_transformer|dclink_film_capacitor|power_mosfet_epoxy|mcu_gate_driver|input_connector|ac_cable_gland|toroidal_inductor/.test(lower) || lower === 'surface_mount_component') {
        item(child, rawName, rawName.replaceAll('_', ' '), 'Illustrative Blender assembly component. Engineering drawings and supplier qualification are separate from this visual model.', 'Verified project scope: 20 priority CBOM components; $1,247,538.11 annualized sourcing opportunity.');
      }
      if (lower.includes('motherboard')) relevant.board = child;
      if (lower.includes('top_cover')) relevant.cover = child;
      if (lower.includes('base_enclosure')) relevant.base = child;
      if (lower.includes('motherboard')) explodeParts.push({mesh: child, y: child.position.y, amount: 1 / scale});
      if (lower.includes('top_cover')) explodeParts.push({mesh: child, y: child.position.y, amount: 2.2 / scale});
    });
    if (relevant.board && relevant.base) ensureCBOMParts(relevant.board, relevant.base);
    if (relevant.base) pin(relevant.base, 'ENCLOSURE', 'Qualification boundary', [2.4, -.5, 0], 'enclosure');
    if (relevant.board) pin(relevant.board, 'PRIORITY CBOM', '20 components', [-2.2, 1.4, 0], 'cbom');
    if (relevant.cover) pin(relevant.cover, 'PM820 MICROINVERTER', 'Illustrative assembly', [0, 2.8, 0], 'assembly');
    assemblyBadge = 'HD illustrative GLB';renderer.domElement.dataset.assembly = 'blender-glb';paintBadge();
    if (focusedPart) focusPart(focusedPart, false, {autoExplode: false, preserveCamera: true});onReady();
  }, undefined, () => {assemblyBadge = 'Procedural assembly | GLB unavailable';renderer.domElement.dataset.assembly = 'procedural';paintBadge();onReady();});

  const usc = group('usc');fixture(usc, 11.8, 8.3);
  for (const z of [-2.65, 2.65]) {
    for (let i = 0; i < 5; i++) box(usc, [.11, 4.3, .11], [-4.7 + i * 2.35, 2.32, z], mats.accent);
    for (const y of [1.15, 2.55, 3.95]) {
      box(usc, [9.5, .1, 1.55], [0, y, z], mats.steel);
      box(usc, [9.5, .18, .07], [0, y, z + (z < 0 ? .77 : -.77)], mats.accent);
      for (let i = 0; i < 8; i++) {
        const bin = box(usc, [.85, .75, .95], [-4.1 + i * 1.15, y + .43, z], y === 1.15 ? mats.light : mats.carton);
        if (y < 3) slotBins.push({mesh: bin, origin: bin.position.clone(), targetY: (y === 1.15 ? 2.55 : 1.15) + .43, direction: z < 0 ? 1 : -1});
        if (y === 1.15) item(bin, `fast-pick-${z}-${i}`, 'USC fast-pick location', '1,200 fast-pick SKUs relocated during a 3-month transition, using a 45 to 60-day turnover window.', 'Inventory cycle-count accuracy maintained above 98% across peak fall intake.');
      }
    }
  }
  const lane = item(box(usc, [1.8, .035, 6.5], [0, .185, 0], mats.pcb), 'fast-pick-lane', 'Fast-pick relocation zone', 'Slotting decisions connect observed turnover to pick-face location.', '1,200 fast-pick SKUs | 45 to 60-day turnover window');
  for (const x of [-1, 1]) line(usc, [[x * 1.1, .205, -3.3], [x * 1.1, .205, 3.3]], 0xe02424);
  pin(lane, 'FAST-PICK ZONE', '1,200 SKUs relocated', [0, 2.2, 0]);
  const rack = objects.find(o => o.parent === usc && o.userData.id?.startsWith('fast-pick'));
  if (rack) pin(rack, 'CYCLE-COUNT ACCURACY', '>98% maintained', [-1, 3, 0]);

  const lt = group('lt');fixture(lt, 10, 7);
  for (const x of [-3.3, 3.3]) {
    box(lt, [.8, 1.1, 2.5], [x, .75, 0], mats.dark);
    cylinder(lt, .18, 1.5, [x, 1.35, .65], mats.steel, true);
    cylinder(lt, .18, 1.5, [x, 1.35, -.65], mats.steel, true);
  }
  const tube = item(cylinder(lt, 1.05, 8.2, [0, 2.25, 0], mats.steel, true), 'tubular', 'Offshore platform tubular', 'Robotic ultrasonic inspection replaces dangerous manual scaffolding climbs across offshore platform tubulars.', 'Automated 6-axis robotic ultrasonic weld scanner');
  const endMaterial = new THREE.MeshStandardMaterial({color: 0x15181e, metalness: .65, roughness: .45, side: THREE.DoubleSide});
  for (const x of [-4.11, 4.11]) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.88, 40), endMaterial);hole.rotation.y = x < 0 ? -Math.PI / 2 : Math.PI / 2;hole.position.set(x, 2.25, 0);lt.add(hole);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.98, .08, 8, 48), mats.aluminum);ring.rotation.y = Math.PI / 2;ring.position.set(x, 2.25, 0);lt.add(ring);
  }
  const seam = item(new THREE.Mesh(new THREE.TorusGeometry(1.07, .045, 10, 64), mats.accent), 'weld-seam', 'Ultrasonic weld-seam inspection', 'The verified inspection resolution is 0.8 mm. Model geometry and scan illumination are illustrative.', '0.8 mm defect resolution');
  seam.rotation.y = Math.PI / 2;seam.position.y = 2.25;lt.add(seam);
  cylinder(lt, .75, .35, [2.7, .38, 2.2], mats.dark);
  const joints = [[2.7, .6, 2.2], [2.7, 1.7, 2.2], [1.75, 3.25, 2.0], [.4, 3.65, 1.2], [0, 3.55, .3], [0, 3.35, 0]];
  const armLinks = [], armJoints = [];
  for (let i = 0; i < joints.length - 1; i++) {const mesh = segment(lt, joints[i], joints[i + 1], i < 2 ? .23 : .14, mats.accent);armLinks.push({mesh, length: new THREE.Vector3(...joints[i]).distanceTo(new THREE.Vector3(...joints[i + 1]))});}
  for (const joint of joints) {const ball = new THREE.Mesh(new THREE.SphereGeometry(.25, 20, 14), mats.dark);ball.position.set(...joint);lt.add(ball);armJoints.push(ball);}
  const head = item(box(lt, [.45, .23, .6], [0, 3.32, 0], mats.light), 'ultrasonic-head', 'Robotic ultrasonic scan head', 'Six-axis robot positions the ultrasonic inspection head at the tubular weld seam.', '0.8 mm defect resolution | Manual scaffolding exposure removed');
  const scan = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .015, 48, 1, true), mats.glass);scan.rotation.z = Math.PI / 2;scan.position.set(.03, 2.25, 0);lt.add(scan);
  scan.visible = false;
  const scanCone = new THREE.Mesh(new THREE.ConeGeometry(.3, .85, 40, 1, true), new THREE.MeshBasicMaterial({color: 0xff3b30, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide}));
  scanCone.visible = false;lt.add(scanCone);
  pin(head, 'ULTRASONIC NDT', '0.8 mm defect resolution', [0, .4, 0]);pin(tube, 'OFFSHORE TUBULAR', 'Robotic access replaces climbs', [-2.6, .7, -.6]);

  const banco = group('banco');fixture(banco, 11.5, 6.5);
  const furnace = item(box(banco, [6.5, 2.4, 3], [0, 1.95, 0], mats.steel), 'cab-furnace', 'Controlled atmosphere brazing furnace', 'Peak temperature window: 595 plus or minus 3 degrees Celsius. Temperature control is one element of the process intervention.', 'Scrap 4.8% to 4.2% | 12.5% relative reduction');
  box(banco, [10.1, .25, 2.1], [0, .65, 0], mats.dark);
  for (let i = 0; i < 23; i++) cylinder(banco, .09, 2, [-4.9 + i * .445, .85, 0], mats.aluminum).rotation.x = Math.PI / 2;
  for (const x of [-4.5, 4.5]) for (const z of [-.8, .8]) box(banco, [.16, .6, .16], [x, .38, z], mats.dark);
  for (let i = 0; i < 3; i++) {
    box(banco, [1.55, 1.2, .08], [-2.05 + i * 2.05, 1.95, 1.55], mats.dark);
    const thermal = new THREE.MeshStandardMaterial({color: 0xff9100, emissive: 0x763807, emissiveIntensity: .7, roughness: .7});
    const window = box(banco, [1.35, .93, .1], [-2.05 + i * 2.05, 1.95, 1.61], thermal);
    item(window, `cab-control-${i}`, 'CAB thermal-profile control', 'Controlled atmosphere and process alignment support repeatable brazing. The verified peak band is 592 to 598 degrees Celsius.', '595 +/- 3 C | RPN 288 to 72');
    for (let rib = 0; rib < 7; rib++) box(banco, [.035, .9, .03], [-2.6 + i * 2.05 + rib * .18, 1.95, 1.68], mats.dark);
  }
  box(banco, [.8, 1.6, .6], [3.75, 1.1, 1.4], mats.dark);box(banco, [.6, .6, .03], [3.75, 1.55, 1.72], mats.pcb);
  const product = item(box(banco, [1, .25, 1.5], [-4.45, 1.05, 0], mats.aluminum), 'brazing-fixture', 'Brazing alignment fixture', 'Process optimization reduced scrap from 4.8% to 4.2%, a 0.6 percentage point decrease.', 'Relative scrap reduction = (4.8 - 4.2) / 4.8 = 12.5%');
  for (let i = 0; i < 12; i++) box(banco, [.035, .12, 1.35], [-4.9 + i * .08, 1.22, 0], mats.steel);
  pin(furnace, 'CAB PROCESS WINDOW', '595 +/- 3 C', [0, 1.4, 0]);pin(product, 'SCRAP REDUCTION', '4.8% to 4.2% | 12.5% relative', [-.3, 1.1, .3]);

  const ontology = group('ontology');fixture(ontology, 10.8, 7.5);
  const nodes = [
    {id: 'postgres', name: 'PostgreSQL object-action ontology', x: -3.1, y: 1.3, z: -1.5, sub: 'Object state and relationships'},
    {id: 'mcp', name: 'MCP deterministic rule validation', x: 0, y: 2.5, z: 0, sub: 'Validate business rules before action'},
    {id: 'rag', name: 'Vector RAG for engineering ECO notes', x: -2.8, y: 1.1, z: 2.1, sub: 'Retrieve engineering change context'},
    {id: 'erp', name: 'PLM-ERP bridge', x: 3.1, y: 1.3, z: -1.5, sub: 'Link engineering and enterprise state'},
    {id: 'action', name: 'Validated action', x: 3, y: 1.1, z: 2.1, sub: 'Explicit state change and decision record'}
  ];
  for (const n of nodes) {
    const node = item(box(ontology, [1.65, .8, 1.2], [n.x, n.y, n.z], n.id === 'mcp' ? mats.accent : mats.steel), n.id, n.name, `Academic architecture: ${n.sub}. This is a demonstration, not a deployed Palantir environment.`, 'PostgreSQL | MCP rule validation | Vector RAG for ECO notes');
    box(ontology, [1.4, .03, .95], [n.x, n.y + .42, n.z], mats.pcb);
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) box(ontology, [.12, .15, .08], [n.x + side * .85, n.y + .05, n.z - .35 + i * .23], mats.light);
    pin(node, n.id === 'postgres' ? 'POSTGRESQL' : n.id === 'mcp' ? 'MCP RULE ENGINE' : n.id === 'rag' ? 'VECTOR RAG' : n.id === 'erp' ? 'PLM / ERP' : 'ACTION', n.sub, [0, .65, 0]);
  }
  for (const n of nodes.filter(n => n.id !== 'mcp')) line(ontology, [[n.x, n.y + .15, n.z], [n.x * .55, 2.5, n.z * .55], [0, 2.5, 0]], 0xe02424, .9);

  const calipers = new THREE.Group();scene.add(calipers);
  function caliper(a, b, tick) {line(calipers, [a, b], 0x9ea3ae, .8);for (const p of [a, b]) line(calipers, [[p[0] - tick[0], p[1] - tick[1], p[2] - tick[2]], [p[0] + tick[0], p[1] + tick[1], p[2] + tick[2]]], 0x9ea3ae, .8);}
  const dimensionLabel = document.createElement('div');dimensionLabel.className = 'twin-dimension-label';
  dimensionLabel.style.cssText = 'position:absolute;bottom:36px;left:12px;right:12px;width:max-content;max-width:calc(100% - 24px);color:#9ea3ae;background:#08080aeb;padding:4px 6px;font:9px var(--mono,Consolas,monospace);line-height:1.5;letter-spacing:.02em;pointer-events:none;';pinLayer.append(dimensionLabel);
  function updateCalipers() {
    for (const child of [...calipers.children]) {calipers.remove(child);child.geometry?.dispose();child.material?.dispose();}
    const w = station === 'generac' ? 3.3 : 5.6, d = station === 'generac' ? 2.25 : 3.9;
    caliper([-w, .22, d], [w, .22, d], [0, 0, .12]);caliper([w + .4, .22, -d], [w + .4, .22, d], [.12, 0, 0]);
    if (station === 'generac') caliper([w + .4, .28, d], [w + .4, 1.2, d], [.12, 0, 0]);
    dimensionLabel.textContent = station === 'generac' ? 'PUBLISHED ENVELOPE: 376 x 255 x 57 mm | Type 6 | Illustrative geometry' : 'SCHEMATIC EXTENTS | NOT TO SCALE';
    calipers.visible = dimensions;dimensionLabel.hidden = !dimensions;
  }
  const views = {
    generac: {pos: [8, 6.8, 9], target: [0, 1.1, 0]},
    usc: {pos: [12.4, 10.1, 13.5], target: [0, 1.6, 0]},
    lt: {pos: [10.8, 8.4, 12.4], target: [0, 1.7, 0]},
    banco: {pos: [12.8, 7.6, 12.5], target: [0, 1.2, 0]},
    ontology: {pos: [11.8, 9.8, 12.8], target: [0, 1.5, 0]}
  };
  const selectionBox = new THREE.BoxHelper(base, 0xff3b30);selectionBox.visible = false;scene.add(selectionBox);
  selectionBox.material.depthTest = false;selectionBox.renderOrder = 5;
  const sourceSweep = new THREE.Mesh(new THREE.BoxGeometry(7.1, .035, 5), new THREE.MeshBasicMaterial({color: 0x00e676, transparent: true, opacity: .14, depthWrite: false}));
  sourceSweep.visible = false;gen.add(sourceSweep);
  const sourceOutline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(7.3, .04, 5.1)), new THREE.LineBasicMaterial({color: 0x00e676, transparent: true, opacity: .8}));
  sourceOutline.position.y = .22;sourceOutline.visible = false;gen.add(sourceOutline);
  const sourceLight = new THREE.PointLight(0x00e676, 0, 10);sourceLight.position.set(0, 2.8, 0);gen.add(sourceLight);
  function highlight(mesh) {focusedMesh = mesh;selectionBox.setFromObject(mesh);selectionBox.visible = visible(mesh);}
  function showFocusPin(mesh, partId) {
    if (!partId) {if (focusPin) focusPin.disabled = true;return;}
    if (!focusPin) {pin(mesh, partId, 'Linked CBOM component | Illustrative placement', [1.1, 1.1, 0], 'selected');focusPin = pins.at(-1);focusPin.button.style.borderLeftWidth = '3px';focusPin.leader.setAttribute('stroke', '#ff3b30');focusPin.leader.setAttribute('stroke-width', '1.3');}
    focusPin.mesh = mesh;focusPin.disabled = false;focusPin.title.textContent = partId;focusPin.layoutWidth = null;
    focusPin.button.setAttribute('aria-label', `Inspect ${partId}: ${mesh.userData.name || 'linked CBOM component'}`);
  }
  function selectMesh(mesh) {highlight(mesh);focusedPart = mesh.userData.partId || null;showFocusPin(mesh, focusedPart);renderer.domElement.dataset.focusedPart = focusedPart || mesh.userData.id || '';onSelect(mesh.userData);}
  function focusPart(partId, notify = true, options = {}) {
    const list = partMeshes.get(partId) || [], mesh = list.find(visible) || (imported ? partMeshes.get('ENCL-AL-DIECAST')?.find(visible) : base);
    station = 'generac';for (const [key, value] of Object.entries(groups)) value.visible = key === station;
    focusedPart = partId;view = 'iso';renderer.domElement.dataset.view=view;updateCalipers();paintBadge();
    const found = Boolean(list.find(visible));
    const selected = list.find(visible) || mesh || base;
    const internal = found && partId !== 'ENCL-AL-DIECAST';
    if (internal && options.autoExplode !== false) explodeTarget = .82;
    if (!motion) explode = explodeTarget;
    scene.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(selected).getCenter(new THREE.Vector3());
    if (internal) center.y += Math.max(0, explodeTarget - explode);
    if (!options.preserveCamera) {desiredTarget.copy(center);desiredPosition.copy(center).add(new THREE.Vector3(5, 4.5, 6).multiplyScalar(Math.max(1, .9 / camera.aspect)));
      moving = motion;if (!moving) {camera.position.copy(desiredPosition);target.copy(desiredTarget);camera.lookAt(target);}}
    highlight(selected);showFocusPin(selected, partId);renderer.domElement.dataset.focusedPart = partId;renderer.domElement.dataset.focusFound = String(found);
    if (notify) onSelect({...selected.userData, partId, focusFound: found});
    return {partId, found, explodeTarget};
  }
  const actionDurations = {sourcing: 2.6, slotting: 3.2, ndt: 5.5};
  function getActionState() {return {active: activeAction, ...Object.fromEntries(Object.entries(actions).map(([id, value]) => [id, {...value}]))};}
  function paintActionData() {
    const current = activeAction ? actions[activeAction] : null;
    renderer.domElement.dataset.action = activeAction || 'none';renderer.domElement.dataset.actionStatus = current?.status || 'idle';
    renderer.domElement.dataset.actionProgress = (current?.progress || 0).toFixed(3);
    for (const [id, value] of Object.entries(actions)) renderer.domElement.dataset[id + 'Status'] = value.status;
  }
  function robotPose(points) {
    for (let i = 0; i < armLinks.length; i++) {
      const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]), link = armLinks[i];
      link.mesh.position.copy(a).add(b).multiplyScalar(.5);link.mesh.scale.y = a.distanceTo(b) / link.length;
      link.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    }
    armJoints.forEach((joint, index) => joint.position.set(...points[index]));head.position.set(...points.at(-1));
  }
  function applyActionVisuals(id, progress) {
    if (id === 'sourcing') {
      sourceSweep.visible = progress < 1;sourceSweep.position.y = .3 + progress * (1.8 + explode * 2.2);
      sourceSweep.material.opacity = .08 + Math.sin(progress * Math.PI) * .17;sourceLight.intensity = progress < 1 ? Math.sin(progress * Math.PI) * 2 : 0;
      sourceOutline.visible = progress > 0;sourceOutline.material.opacity = progress === 1 ? .8 : .4 + Math.sin(progress * Math.PI * 4) * .2;
    }
    if (id === 'slotting') {
      const eased = progress * progress * (3 - 2 * progress);
      for (const bin of slotBins) {bin.mesh.position.copy(bin.origin);bin.mesh.position.y = THREE.MathUtils.lerp(bin.origin.y, bin.targetY, eased);bin.mesh.position.z += Math.sin(progress * Math.PI) * bin.direction * (bin.origin.y < 2 ? .65 : 1.25);}
    }
    if (id === 'ndt') {
      const angle = -.12 + progress * 1.65, y = 2.25 + Math.cos(angle) * 1.2, z = Math.sin(angle) * 1.2;
      robotPose([[2.7, .6, 2.2], [2.7, 1.7, 2.2], [1.75, 3.55, 1.95], [.7, y + .5, z + .35], [.15, y + .22, z + .08], [0, y, z]]);
      const origin = head.position.clone(), destination = new THREE.Vector3(0, 2.25, 0), direction = destination.clone().sub(origin).normalize();
      scanCone.position.copy(origin).addScaledVector(direction, .43);scanCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().negate());
      scanCone.visible = progress < 1;scanCone.material.opacity = .18 + Math.sin(actionClock * 16) * .1;scan.visible = progress > 0;
    }
  }
  function runAction(id, state = {}) {
    const normalized = /sourc|rfq/i.test(id) ? 'sourcing' : /slott|rebal/i.test(id) ? 'slotting' : /ndt|scan/i.test(id) ? 'ndt' : null;
    if (!normalized || disposed) return false;
    const immediate = !motion || state.phase === 'complete' || state.phase === 'completed' || state.status === 'complete';
    activeAction = normalized;actions[normalized] = {status: immediate ? 'complete' : 'running', progress: immediate ? 1 : 0, elapsed: immediate ? actionDurations[normalized] : 0};
    applyActionVisuals(normalized, immediate ? 1 : 0);paintActionData();onState(getActionState());return true;
  }
  function resetActionState() {
    for (const id of Object.keys(actions)) actions[id] = {status: 'idle', progress: 0, elapsed: 0};
    activeAction = null;sourceSweep.visible = sourceOutline.visible = false;sourceLight.intensity = 0;
    slotBins.forEach(bin => bin.mesh.position.copy(bin.origin));robotPose(joints);scan.visible = scanCone.visible = false;
    focusedPart = null;focusedMesh = null;selectionBox.visible = false;renderer.domElement.dataset.focusedPart = '';
    if (focusPin) focusPin.disabled = true;
    paintActionData();onState(getActionState());
  }
  function tickActions(delta) {
    actionClock += delta;
    for (const [id, state] of Object.entries(actions)) {
      if (state.status !== 'running') continue;
      state.elapsed += delta;state.progress = motion ? Math.min(1, state.elapsed / actionDurations[id]) : 1;
      applyActionVisuals(id, state.progress);
      if (state.progress === 1) {state.status = 'complete';onState(getActionState());}
    }
    paintActionData();
  }
  function frameStation(glide = true) {
    renderer.domElement.dataset.station=station;renderer.domElement.dataset.view=view;
    const data = views[station], t = new THREE.Vector3(...data.target), offset = new THREE.Vector3(...data.pos).sub(t);
    const radius = offset.length() * .9 * Math.max(1, .93 / camera.aspect);
    if (view === 'front') offset.set(0, radius * .08, radius);else if (view === 'top') offset.set(.001, radius, .001);else offset.setLength(radius);
    desiredPosition.copy(t).add(offset);desiredTarget.copy(t);moving = motion && glide;
    if (!moving) {camera.position.copy(desiredPosition);target.copy(desiredTarget);camera.lookAt(target);}
  }
  function visible(mesh) {for (let node = mesh; node; node = node.parent) if (!node.visible) return false;return true;}
  let dragging = false, start = {x: 0, y: 0}, previous = {x: 0, y: 0}, dragged = false;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  listen(renderer.domElement, 'pointerdown', event => {dragging = true;dragged = false;moving = false;start = previous = {x: event.clientX, y: event.clientY};renderer.domElement.setPointerCapture(event.pointerId);});
  listen(renderer.domElement, 'pointermove', event => {
    if (!dragging) return;if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) dragged = true;
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    spherical.theta -= (event.clientX - previous.x) * .007;spherical.phi -= (event.clientY - previous.y) * .007;spherical.phi = Math.max(.045, Math.min(Math.PI / 2 - .03, spherical.phi));
    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));camera.lookAt(target);previous = {x: event.clientX, y: event.clientY};
  });
  listen(renderer.domElement, 'pointerup', event => {
    dragging = false;if (dragged) return;const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(objects.filter(visible), false)[0];if (hit) selectMesh(hit.object);
  });
  listen(renderer.domElement, 'pointercancel', () => {dragging = false;});
  listen(renderer.domElement, 'wheel', event => {event.preventDefault();moving = false;const offset = camera.position.clone().sub(target);offset.multiplyScalar(Math.exp(event.deltaY * .001));offset.clampLength(5, 35);camera.position.copy(target).add(offset);camera.lookAt(target);}, {passive: false});
  listen(renderer.domElement, 'webglcontextlost', event => {event.preventDefault();assemblyBadge = 'Graphics paused | Use text controls';paintBadge();});
  const projected = new THREE.Vector3();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let lastPinLayout = [];
  function overlapRect(a, b, gap = 0) {
    return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
  }
  function layoutPins(width, height) {
    const compact = width < 560 || height < 280, pending = [];
    const insetX = 12, insetTop = Math.min(44, Math.max(30, height * .14)), gap = 7;
    const insetBottom = dimensions ? 36 + dimensionLabel.offsetHeight + gap : 34;
    const availableHeight = Math.max(1, height - insetBottom - insetTop);
    for (const p of pins) {
      const closedInterior = station === 'generac' && p.role === 'context' && explode < .15 && /motherboard|^pcb$/.test((p.mesh.userData.id || '').toLowerCase());
      if (p.disabled || !visible(p.mesh) || closedInterior) {p.button.hidden = true;p.leader.style.display = p.dot.style.display = 'none';continue;}
      p.mesh.getWorldPosition(projected);
      const anchor = projected.clone().project(camera);
      projected.add(p.offset).project(camera);
      if (anchor.z > 1 || anchor.z < -1) {p.button.hidden = true;p.leader.style.display = p.dot.style.display = 'none';continue;}
      p.button.hidden = false;
      const layoutKey = `${width}:${height}:${compact}:${p.title.textContent}`;
      if (p.layoutWidth !== layoutKey) {
        p.secondary.hidden = compact;
        p.button.style.fontSize = compact ? '9px' : '10px';
        p.button.style.padding = compact ? '4px 6px' : '5px 7px';
        p.button.style.maxWidth = `${compact ? Math.max(60, (width - insetX * 2 - gap) / 2) : Math.min(275, width - insetX * 2)}px`;
        p.button.style.overflow = 'hidden';
        p.button.style.textOverflow = 'ellipsis';
        p.width = p.button.offsetWidth;p.height = p.button.offsetHeight;p.layoutWidth = layoutKey;
      }
      const maxX = Math.max(insetX, width - insetX - p.width), maxY = Math.max(insetTop, height - insetBottom - p.height);
      let x = clamp((projected.x * .5 + .5) * width - p.width / 2, insetX, maxX);
      let y = clamp((-projected.y * .5 + .5) * height - p.height, insetTop, maxY);
      // Semantic screen lanes remain separate when projection flattens in front/top views.
      if (p.role === 'assembly') {x = (width - p.width) / 2;y = insetTop;}
      if (p.role === 'cbom') {x = insetX;y = insetTop + (availableHeight - p.height) * .43;}
      if (p.role === 'enclosure') {x = maxX;y = maxY;}
      if (p.role === 'selected') {x = maxX;y = insetTop + (availableHeight - p.height) * .24;}
      pending.push({p, x, y, maxX, maxY, anchorX: (anchor.x * .5 + .5) * width, anchorY: (-anchor.y * .5 + .5) * height});
    }
    const priorities = {assembly: 0, cbom: 1, enclosure: 2, selected: 3, context: 4};
    pending.sort((a, b) => priorities[a.p.role] - priorities[b.p.role] || a.y - b.y || a.x - b.x);
    let placed = [], needsPacking = false;
    const rowHeight = Math.max(0, ...pending.map(item => item.p.height)) + gap;
    for (const candidate of pending) {
      const {p, x, y, maxX, maxY} = candidate;
      const options = [{x, y}];
      for (let lane = 1; lane <= pending.length; lane++) {
        options.push({x, y: clamp(y - lane * rowHeight, insetTop, maxY)}, {x, y: clamp(y + lane * rowHeight, insetTop, maxY)});
      }
      for (const left of [insetX, maxX, clamp((width - p.width) / 2, insetX, maxX)]) {
        options.push({x: left, y});
        for (let top = insetTop; top <= maxY; top += rowHeight) options.push({x: left, y: top});
      }
      let best = null, bestScore = Infinity;
      for (const option of options) {
        const rect = {...option, width: p.width, height: p.height};
        if (placed.some(other => overlapRect(rect, other, gap))) continue;
        const score = (option.x - x) ** 2 + (option.y - y) ** 2;
        if (score < bestScore) {best = option;bestScore = score;}
      }
      if (!best) {needsPacking = true;break;}
      candidate.rect = {...best, width: p.width, height: p.height};placed.push(candidate.rect);
    }
    // A two-column title-only rack is a strict non-overlap fallback, never an overlap penalty.
    if (needsPacking) {
      const hasAssembly = pending.some(item => item.p.role === 'assembly');
      const columnWidth = Math.max(1, (width - insetX * 2 - gap) / 2);
      const rows = hasAssembly ? 1 + Math.ceil((pending.length - 1) / 2) : Math.ceil(pending.length / 2);
      const fontSize = Math.min(9, Math.max(7, (availableHeight / Math.max(1, rows) - gap - 8) / 1.45));
      for (const item of pending) {
        item.p.secondary.hidden = true;item.p.button.style.fontSize = `${fontSize}px`;item.p.button.style.padding = '3px 6px';
        item.p.button.style.maxWidth = `${columnWidth}px`;item.p.width = item.p.button.offsetWidth;item.p.height = item.p.button.offsetHeight;
      }
      const cellHeight = Math.max(0, ...pending.map(item => item.p.height)) + gap;
      let cursor = 0;
      for (const item of pending) {
        const isAssembly = hasAssembly && item.p.role === 'assembly';
        const slot = cursor;
        let row = isAssembly ? 0 : (hasAssembly ? 1 : 0) + Math.floor(slot / 2), column = slot % 2;
        if (hasAssembly && item.p.role === 'cbom') {row = 1;column = 0;}
        if (hasAssembly && item.p.role === 'selected') {row = 1;column = 1;}
        if (hasAssembly && item.p.role === 'enclosure') {row = rows - 1;column = 1;}
        const x = isAssembly ? (width - item.p.width) / 2 : column === 0 ? insetX : width - insetX - item.p.width;
        item.rect = {x, y: insetTop + row * cellHeight, width: item.p.width, height: item.p.height};
        if (!isAssembly) cursor++;
      }
      placed = pending.map(item => item.rect);
    }
    for (const candidate of pending) {
      const {p, rect} = candidate;
      p.button.style.left = `${rect.x}px`;p.button.style.top = `${rect.y}px`;
      let endX=clamp(candidate.anchorX,rect.x,rect.x+p.width),endY=clamp(candidate.anchorY,rect.y,rect.y+p.height);
      if(p.role==='selected'){
        endX=candidate.anchorX<rect.x+p.width/2?rect.x+3:rect.x+p.width-3;
        endY=candidate.anchorY<rect.y+p.height/2?rect.y+p.height-3:rect.y+3;
      }
      const hasLeader = Math.hypot(candidate.anchorX - endX, candidate.anchorY - endY) > 4;
      p.leader.style.display = p.dot.style.display = hasLeader ? '' : 'none';
      p.leader.setAttribute('x1', String(candidate.anchorX));p.leader.setAttribute('y1', String(candidate.anchorY));
      p.leader.setAttribute('x2', String(endX));p.leader.setAttribute('y2', String(endY));
      p.dot.setAttribute('cx', String(candidate.anchorX));p.dot.setAttribute('cy', String(candidate.anchorY));
    }
    const collisions = placed.reduce((count, rect, index) => count + placed.slice(index + 1).filter(other => overlapRect(rect, other)).length, 0);
    renderer.domElement.dataset.pinCollisions = String(collisions);renderer.domElement.dataset.pinCount = String(pending.length);
    renderer.domElement.dataset.pinLayout = needsPacking ? 'packed' : 'role-lanes';
    lastPinLayout = pending.map(item => ({role: item.p.role, text: item.p.title.textContent, partId: item.p.mesh.userData.partId || null, ...item.rect, anchorX: item.anchorX, anchorY: item.anchorY}));
  }
  function animate() {
    if (disposed) return;frame = requestAnimationFrame(animate);
    const now = performance.now(), delta = Math.min(.1, Math.max(0, (now - lastFrameTime) / 1000));lastFrameTime = now;
    explode = motion ? THREE.MathUtils.lerp(explode, explodeTarget, 1 - Math.exp(-delta * 10)) : explodeTarget;
    if (Math.abs(explode - explodeTarget) < .0005) explode = explodeTarget;
    for (const part of explodeParts) part.mesh.position.y = part.y + part.amount * explode;
    if (moving) {const factor = 1 - Math.exp(-delta * 6);camera.position.lerp(desiredPosition, factor);target.lerp(desiredTarget, factor);camera.lookAt(target);if (camera.position.distanceTo(desiredPosition) < .005) moving = false;}
    tickActions(delta);renderer.domElement.dataset.explode = explode.toFixed(3);renderer.domElement.dataset.explodeTarget = explodeTarget.toFixed(3);
    if (focusedMesh) {selectionBox.visible = visible(focusedMesh);if (selectionBox.visible) selectionBox.setFromObject(focusedMesh);}
    renderer.render(scene, camera);layoutPins(container.clientWidth, container.clientHeight);
  }
  const resize = () => {if (disposed) return;const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);camera.aspect = w / h;camera.updateProjectionMatrix();renderer.setSize(w, h);frameStation(false);};
  const observer = new ResizeObserver(resize);observer.observe(container);resize();updateCalipers();animate();
  function disposeTree(root) {const geometries = new Set(), materials = new Set();root.traverse(child => {if(child.geometry)geometries.add(child.geometry);for(const m of Array.isArray(child.material)?child.material:[child.material])if(m)materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  return {
    switchStation(id) {station = id === 'intro' ? 'generac' : id === 'advanced' ? 'lt' : groups[id] ? id : 'generac';for (const [key, value] of Object.entries(groups)) value.visible = key === station;view = 'iso';updateCalipers();frameStation();paintBadge();},
    getObjects() {return objects.filter(visible).map(mesh => mesh.userData);},
    setExplode(value) {explodeTarget = Math.max(0, Math.min(1, Number(value) || 0));if (!motion) explode = explodeTarget;},
    setMotion(value) {motion = Boolean(value);if (!motion) {explode = explodeTarget;frameStation(false);tickActions(0);}},
    setView(value) {view = ['iso', 'front', 'top'].includes(value) ? value : 'iso';frameStation();},
    setDimensions(value) {dimensions = Boolean(value);calipers.visible = dimensions;dimensionLabel.hidden = !dimensions;},
    resetCamera() {view = 'iso';frameStation(false);},
    focusPart,
    runAction,
    resetActionState,
    getActionState,
    getPinLayout() {return lastPinLayout.map(item => ({...item}));},
    toggleOrbit() {},
    dispose() {if(disposed)return;disposed = true;abort.abort();observer.disconnect();cancelAnimationFrame(frame);disposeTree(scene);contactTexture.dispose();environment.dispose();renderer.dispose();pinLayer.remove();},
    getState() {return {station, view, imported, explode, explodeTarget, dimensions, focusedPart, actionState: getActionState()};}
  };
}
