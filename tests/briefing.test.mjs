import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {durationsFor, advanceTimeline, totalElapsed} from '../tour-timing.js';
import {objects, executiveTourSteps, cbomLines, cbomScope, productSpecification, variancePercent, sortCbomLines} from '../briefing-director.js';
import {matchAnswer} from '../briefing-chatbot.js';
import {createActionPreview, executeAction} from '../operations.js';
import {createWorkspaceState, beginWorkspaceAction, completeWorkspaceAction, applyWorkspaceAction} from '../briefing-actions.js';
import {assemblyControlState, nextAssemblyTarget} from '../assembly-controls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const names = ['PM820_Microinverter', 'USC_Logistics_DC', 'LT_Robotic_Weld', 'Banco_CAB_Brazing', 'Enterprise_Ontology'];
const stations = ['generac', 'usc', 'lt', 'banco', 'ontology'];
const prohibited = String.fromCodePoint(0x2014);

function filesAt(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesAt(full) : [full];
  });
}

test('five-minute briefing covers every object and finishes at 300 seconds', () => {
  assert.deepEqual(objects.map(object => object.id), stations);
  assert.deepEqual(objects.map(object => object.name), names);
  assert.deepEqual(executiveTourSteps.map(step => step.station), stations);
  const durations = durationsFor(5);
  assert.equal(durations.length, 5);
  assert.equal(durations.reduce((sum, duration) => sum + duration, 0), 300);
  let state = {index: 0, elapsed: 0, playing: true, complete: false};
  state = advanceTimeline(state, 299, durations);
  assert.equal(totalElapsed(state, durations), 299);
  assert.equal(state.complete, false);
  state = advanceTimeline(state, 1, durations);
  assert.equal(totalElapsed(state, durations), 300);
  assert.equal(state.complete, true);
  assert.equal(state.playing, false);
});

test('pause preserves position and delayed frames cross multiple acts', () => {
  const durations = durationsFor(5);
  const paused = {index: 1, elapsed: 12, playing: false, complete: false};
  assert.deepEqual(advanceTimeline(paused, 100, durations), paused);
  const running = {...paused, playing: true};
  const advanced = advanceTimeline(running, 150, durations);
  assert.equal(totalElapsed(advanced, durations), totalElapsed(running, durations) + 150);
  assert.ok(advanced.index > running.index);
  assert.equal(totalElapsed(advanceTimeline(running, -10, durations), durations), totalElapsed(running, durations));
});

test('sourcing arithmetic is exact in cents and remains an opportunity', () => {
  const baselineCents = 447176397, targetCents = 322422586;
  assert.equal(baselineCents - targetCents, 124753811);
  assert.equal(((baselineCents - targetCents) / baselineCents * 100).toFixed(2), '27.90');
  const content = JSON.stringify(objects[0]);
  for (const amount of ['4,471,763.97', '3,224,225.86', '1,247,538.11', '200,000']) assert.ok(content.includes(amount), amount);
  assert.match(content, /20/);
  assert.match(content, /opportunity/i);
  assert.match(matchAnswer('What is the Generac sourcing bridge?'), /opportunity/i);
});

test('USC, L&T, Banco and academic metrics keep their exact meaning', () => {
  const usc = JSON.stringify(objects[1]);
  for (const value of ['1,200', '98', '45', '60']) assert.ok(usc.includes(value), value);
  assert.match(usc, /maintain/i);
  const lt = JSON.stringify(objects[2]);
  assert.match(lt, /0\.8\s*mm/);
  assert.match(lt, /ultrasonic/i);
  const banco = JSON.stringify(objects[3]);
  for (const value of ['4.8%', '4.2%', '12.5%', '595', '288', '72']) assert.ok(banco.includes(value), value);
  assert.equal(((48 - 42) / 48 * 100).toFixed(1), '12.5');
  const academic = JSON.stringify(objects[4]);
  for (const pattern of [/academic/i, /PostgreSQL/, /MCP/, /RAG/]) assert.match(academic, pattern);
});

test('advisor is immediate, deterministic, comparative and grounded', () => {
  const cases = [
    ['Explain the Generac baseline and target', /4,471,763\.97/],
    ['How was USC accuracy maintained?', /98/],
    ['Explain the L&T ultrasonic scanner', /0\.8/],
    ['Explain Banco scrap reduction', /12\.5/],
    ['Explain the academic ontology and MCP', /academic/i]
  ];
  for (const [question, expected] of cases) {
    const answer = matchAnswer(question);
    assert.equal(typeof answer, 'string');
    assert.match(answer, expected);
    assert.equal(answer, matchAnswer(question));
    assert.ok(!answer.includes(prohibited));
  }
  const comparison = matchAnswer('Compare Generac sourcing with Banco scrap reduction');
  assert.match(comparison, /Generac/i);
  assert.match(comparison, /Banco/i);
  const unknown = matchAnswer('What is your work authorization and start date?');
  assert.match(unknown, /not|missing|confirm|unavailable|provided|record/i);
  assert.doesNotMatch(unknown, /eligible for standard|24-month STEM|December 2026/);
  assert.doesNotMatch(matchAnswer('What did the L&T scanner cost?'), /18,500|2,000|saved \$/);
});

test('twenty CBOM lines preserve current quotes and the user-confirmed component snapshot', () => {
  assert.equal(cbomLines.length, 20);
  assert.equal(new Set(cbomLines.map(line => line.id)).size, 20);
  assert.ok(cbomLines.every(line => line.available));
  assert.equal(cbomScope.currentQuoteLines, 5);
  assert.equal(cbomScope.sourceSnapshotLines, 15);
  assert.equal(cbomScope.sourcePendingLines, 0);
  const expected = [
    ['PWR-XFMR-01', 14.20, 9.80, '-31.0'],
    ['MOSFET-SIC-650V', 22.40, 16.10, '-28.1'],
    ['CAP-BULK-450V', 8.50, 6.20, '-27.1'],
    ['ENCL-AL-DIECAST', 18.50, 13.40, '-27.6'],
    ['MCU-GATE-DRV', 6.80, 4.90, '-27.9']
  ];
  for (const [partId, baseline, target, variance] of expected) {
    const line = cbomLines.find(line => line.partId === partId);
    assert.ok(line, partId);
    assert.equal(line.baseline, baseline);
    assert.equal(line.target, target);
    assert.equal(line.variance.toFixed(1), variance);
    assert.ok(Math.abs(line.variance - (target - baseline) / baseline * 100) < 1e-9);
    assert.match(line.source, /supplied|brief|representative/i);
  }
  const sourceRows = JSON.parse(read('research/cbom-source-snapshot.json')).rows;
  for (const line of cbomLines.slice(5)) {
    const source = sourceRows.find(row => row.line === line.sourceLine);
    assert.ok(source, `Source row ${line.sourceLine}`);
    assert.equal(line.baseline, source.baselineUnitPrice);
    assert.equal(line.target, source.targetUnitPrice);
    assert.equal(line.usagePerUnit, source.usagePerUnit);
    assert.equal(line.annualDemand, source.annualDemand);
    assert.match(line.source, /User-confirmed/);
    assert.ok(line.unitBasis);
  }
  assert.equal(cbomScope.aggregateBaseline, 4471763.97);
  assert.equal(cbomScope.aggregateTarget, 3224225.86);
  assert.equal(cbomScope.annualizedOpportunity, 1247538.11);
});

test('PM-820 specifications use the manufacturer overall dimensions and certifications', () => {
  assert.deepEqual(productSpecification.dimensions, {lengthMm: 376, widthMm: 255, heightMm: 57});
  assert.match(productSpecification.publishedDimensions, /376.*255.*57.*W.*H.*D/);
  assert.match(productSpecification.enclosure, /Type 6/);
  assert.equal(productSpecification.warrantyYears, 25);
  assert.match(productSpecification.standards.join(' ').replaceAll(' ', ''), /UL1741-SB/);
  assert.match(productSpecification.standards.join(' ').replaceAll(' ', ''), /IEEE1547/);
  assert.match(productSpecification.source.url, /^https:\/\/www\.generac\.com\//);
  assert.doesNotMatch(JSON.stringify(productSpecification), /IP67/);
});

test('CBOM sorting compares numeric prices correctly and keeps unknown prices last', () => {
  const before = JSON.stringify(cbomLines);
  const ascending = sortCbomLines(cbomLines, 'baseline', 'asc');
  assert.deepEqual(ascending.slice(0, 5).map(line => line.baseline), [0.12, 0.18, 0.22, 0.32, 0.54]);
  const descending = sortCbomLines(cbomLines, 'target', 'desc');
  assert.deepEqual(descending.slice(0, 5).map(line => line.target), [16.1, 13.4, 9.8, 6.2, 4.9]);
  const missing = {id:'missing', baseline:null, target:null};
  for (const direction of ['asc', 'desc']) {
    const sorted = sortCbomLines([missing, ...cbomLines], 'baseline', direction);
    assert.equal(sorted.at(-1).id, 'missing');
  }
  assert.equal(variancePercent(missing), null);
  assert.equal(variancePercent({baseline: 0, target: 1}), null);
  assert.equal(variancePercent({baseline: 10, target: null}), null);
  assert.equal(variancePercent({baseline: null, target: 10}), null);
  assert.equal(JSON.stringify(cbomLines), before);
});

test('workspace actions change linked object state and preserve the experience record', () => {
  const historical = JSON.stringify(objects);
  const freeze = value => {
    if (value && typeof value === 'object') {Object.freeze(value);Object.values(value).forEach(freeze);}
    return value;
  };
  const initial = freeze(createWorkspaceState());
  assert.equal(initial.objects.generac.phase, 'ready');
  assert.equal(initial.objects.usc.pickPathTravelReduction, null);
  assert.equal(initial.objects.lt.defectsAboveThreshold, null);
  const running = freeze(beginWorkspaceAction(initial, 'sourcing'));
  assert.equal(running.objects.generac.phase, 'running');
  assert.equal(running.objects.generac.actionCount, 1);
  assert.deepEqual(beginWorkspaceAction(running, 'sourcing'), running);
  assert.equal(initial.objects.generac.status, 'QUOTATION OPPORTUNITY');
  const sourcing = completeWorkspaceAction(running, 'sourcing');
  assert.equal(sourcing.objects.generac.status, 'COMMITTED: TIER 2 RFQ ISSUED');
  assert.equal(sourcing.objects.generac.opportunityStatus, 'LOCKED');
  assert.equal(sourcing.objects.generac.annualizedOpportunity, 1247538.11);
  assert.equal(sourcing.objects.generac.phase, 'complete');
  assert.deepEqual(sourcing.objects.usc, initial.objects.usc);
  assert.deepEqual(completeWorkspaceAction(sourcing, 'sourcing'), sourcing);
  const slotting = applyWorkspaceAction(sourcing, 'slotting');
  assert.equal(slotting.objects.usc.pickPathTravelReduction, -18.4);
  assert.equal(slotting.objects.usc.slottingState, 'GOLDEN_ZONE');
  assert.equal(slotting.objects.usc.maintainedAccuracy, '>98%');
  const scanned = applyWorkspaceAction(slotting, 'ndt');
  assert.equal(scanned.objects.lt.scanStatus, 'COMPLETE');
  assert.equal(scanned.objects.lt.defectsAboveThreshold, 0);
  assert.equal(scanned.objects.lt.defectThresholdMm, 0.8);
  assert.equal(scanned.history.length, 3);
  for (const entry of scanned.history) {
    assert.equal(entry.phase, 'complete');
    assert.equal(entry.simulation, true);
    assert.equal(entry.scope, 'browser-local');
    assert.ok(entry.before !== entry.after);
    assert.ok(entry.scenarioOutput);
  }
  for (const id of ['generac', 'usc', 'lt']) {
    assert.equal(scanned.objects[id].simulation, true);
    assert.ok(scanned.objects[id].kpis.every(kpi => kpi.simulation));
  }
  assert.equal(applyWorkspaceAction(scanned, 'sourcing').objects.generac.actionCount, 2);
  assert.equal(createWorkspaceState().objects.generac.actionCount, 0);
  assert.equal(JSON.stringify(objects), historical);
  assert.throws(() => completeWorkspaceAction(initial, 'ndt'), /running/);
  assert.throws(() => beginWorkspaceAction(initial, '__proto__'), RangeError);
});

test('assembly starts closed and each object exposes typed graph relationships', () => {
  const slider = read('index.html').match(/<input\b[^>]*>/g).find(tag => /id=["']explode-slider["']/.test(tag));
  assert.ok(slider, 'Assembly slider exists');
  const value = slider.match(/\bvalue=["']([^"']+)["']/);
  assert.ok(value);
  assert.equal(Number(value[1]), 0);
  for (const object of objects) {
    assert.ok(object.relationships.length >= 2, `${object.id} linked children`);
    for (const relation of object.relationships) assert.ok(relation.label || relation.name || relation.id);
  }
});

test('assembly control labels and collapse targets stay correct throughout expansion', () => {
  const endpoints = [
    [0, 0, '0% [SEALED ENCLOSURE]', 'Explode Assembly'],
    [1, 100, '100% [EXPANDED CBOM]', 'Collapse Assembly']
  ];
  for (const [value, percent, label, buttonLabel] of endpoints) {
    const control = assemblyControlState(value);
    assert.equal(control.value, value);
    assert.equal(control.percent, percent);
    assert.equal(control.label, label);
    assert.equal(control.buttonLabel, buttonLabel);
    assert.ok(control.ariaValueText.includes(String(percent)));
  }
  for (const value of [.25, .82]) {
    const control = assemblyControlState(value);
    assert.equal(control.value, value);
    assert.equal(control.percent, Math.round(value * 100));
    assert.equal(control.label, `${Math.round(value * 100)}% [PARTIAL EXPANSION]`);
    assert.equal(control.buttonLabel, 'Collapse Assembly');
    assert.equal(nextAssemblyTarget(value), 0);
  }
  assert.deepEqual(assemblyControlState(-1), assemblyControlState(0));
  assert.deepEqual(assemblyControlState(2), assemblyControlState(1));
  assert.deepEqual(assemblyControlState(Number.NaN), assemblyControlState(0));
  const first = nextAssemblyTarget(0);
  const reverse = nextAssemblyTarget(first);
  const resume = nextAssemblyTarget(reverse);
  assert.deepEqual([first, reverse, resume], [1, 0, 1]);
  assert.equal(assemblyControlState(reverse).buttonLabel, 'Explode Assembly');
});

test('all deployed text is free of prohibited punctuation, filler and old palette', () => {
  const textExtensions = new Set(['.html', '.css', '.js', '.json', '.txt', '.svg']);
  for (const file of filesAt(path.join(root, 'dist'))) {
    if (!textExtensions.has(path.extname(file))) continue;
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(!content.includes(prohibited), path.relative(root, file));
    if (!file.includes(`${path.sep}vendor${path.sep}`)) {
      assert.doesNotMatch(content, /\b(?:delve|testament)\b|orchestrating a symphony|standing at the nexus/i, file);
      assert.doesNotMatch(content, /#(?:080d0a|0f1813|257048|678473)\b/i, file);
    }
  }
});

test('project code, documentation and source data contain no prohibited punctuation', () => {
  const textExtensions = new Set(['.html','.css','.js','.mjs','.json','.md','.txt','.svg','.py','.ps1']);
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      if (['.git','.runtime','node_modules'].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (textExtensions.has(path.extname(file))) {
        assert.ok(!fs.readFileSync(file,'utf8').includes(prohibited), path.relative(root,file));
      }
    }
  };
  visit(root);
});

test('operational actions stage validated browser-local simulations without changing ground truth', () => {
  const groundTruthBefore = JSON.stringify(objects);
  const expected = {sourcing: 'generac', slotting: 'usc', ndt: 'lt'};
  for (const [action, objectId] of Object.entries(expected)) {
    const preview = createActionPreview(action);
    assert.equal(preview.objectId, objectId);
    assert.equal(preview.simulation, true);
    assert.ok(preview.checks.length > 0);
    assert.ok(preview.checks.every(check => check.passed));
    assert.ok(preview.before && preview.after && preview.note);
    const result = executeAction(action);
    assert.equal(result.status, 'simulated');
    assert.equal(result.scope, 'browser-local');
    assert.equal(result.objectId, objectId);
    assert.deepEqual(executeAction(action), result);
    // Caller edits to a preview must not poison a future validation result.
    preview.checks[0].passed = false;
    assert.equal(createActionPreview(action).checks[0].passed, true);
  }
  assert.equal(JSON.stringify(objects), groundTruthBefore);
  assert.throws(() => createActionPreview('unknown'), RangeError);
  assert.throws(() => executeAction('__proto__'), RangeError);
});

test('deployment mirrors source and entry references resolve', () => {
  for (const file of filesAt(path.join(root, 'dist'))) {
    const relative = path.relative(path.join(root, 'dist'), file);
    const source = path.join(root, relative);
    assert.ok(fs.existsSync(source), `Missing source: ${relative}`);
    assert.ok(fs.readFileSync(file).equals(fs.readFileSync(source)), `Stale deployment: ${relative}`);
  }
  const html = read('dist/index.html');
  assert.match(html, /<title>Sovereign Deployment Workspace \| Harsh Mistry<\/title>/);
  for (const [, reference] of html.matchAll(/(?:href|src)=["'](\.[^"']+)["']/g)) {
    assert.ok(fs.existsSync(path.resolve(root, 'dist', reference.split(/[?#]/)[0])), `Unresolved entry reference: ${reference}`);
  }
  for (const file of filesAt(path.join(root, 'dist')).filter(file => file.endsWith('.js'))) {
    for (const [, reference] of fs.readFileSync(file, 'utf8').matchAll(/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["'](\.[^"']+)["']/g)) {
      assert.ok(fs.existsSync(path.resolve(path.dirname(file), reference)), `Unresolved module reference: ${reference}`);
    }
  }
});

test('local GLB is complete and contains a renderable assembly', () => {
  const glb = fs.readFileSync(path.join(root, 'dist/media/pm820-microinverter.glb'));
  assert.equal(glb.readUInt32LE(0), 0x46546c67);
  assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  assert.ok(gltf.meshes.length > 0);
  assert.ok(gltf.nodes.length > 0);
});

test('Sovereign primary and secondary text pass AAA and action labels pass AA', () => {
  const luminance = hex => {
    const channels = hex.match(/../g).map(channel => parseInt(channel, 16) / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const background of ['08080a', '0e1014', '15181e']) {
    for (const foreground of ['ffffff', '9ea3ae']) {
      const ratio = (luminance(foreground) + 0.05) / (luminance(background) + 0.05);
      assert.ok(ratio >= 7, `${foreground} on ${background}: ${ratio}`);
    }
  }
  const whiteOnActionRed = (luminance('ffffff') + 0.05) / (luminance('e02424') + 0.05);
  assert.ok(whiteOnActionRed >= 4.5);
});

test('authored UI declares Sovereign tokens and the Inter font without Arial', () => {
  const css = read('styles.css');
  const roots = [...css.matchAll(/:root\s*\{([^}]+)\}/g)].map(match => match[1]).join('\n').toLowerCase();
  const required = ['08080a','0e1014','15181e','22252c','3d1518','e02424','ff3b30','ffffff','9ea3ae','6c727e','00e676','ff9100'];
  for (const hex of required) assert.ok(roots.includes(`#${hex}`), `Missing Sovereign token ${hex}`);
  assert.match(css, /font-family\s*:\s*["']?Inter/i);
  for (const file of ['styles.css','briefing-app.js','briefing-3d.js','briefing-chatbot.js','briefing-director.js']) {
    assert.doesNotMatch(read(file), /\bArial\b/i, file);
  }
});

test('Inter is bundled as a valid local WOFF2 font with its redistribution license', () => {
  const font = fs.readFileSync(path.join(root, 'fonts/InterVariable.woff2'));
  assert.ok(font.length >= 48);
  assert.equal(font.subarray(0,4).toString(), 'wOF2');
  assert.equal(font.readUInt32BE(8), font.length);
  const license = read('fonts/OFL.txt');
  assert.match(license, /SIL\s+OPEN\s+FONT\s+LICENSE/i);
  assert.match(license, /Inter Project Authors/);
  assert.match(read('styles.css'), /fonts\/InterVariable\.woff2/);
});

test('advisor answers coupled component qualification questions', () => {
  const answer=matchAnswer('Compare qualification of the isolated gate driver and SiC power FET');
  assert.match(answer,/MCU-GATE-DRV/);
  assert.match(answer,/MOSFET-SIC-650V/);
  assert.match(answer,/gate|switching/i);
});
