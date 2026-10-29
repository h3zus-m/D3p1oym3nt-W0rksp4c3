import { initBriefing3D } from './briefing-3d.js';
import { objects, cbomLines, sortCbomLines, variancePercent, executiveTourSteps as steps } from './briefing-director.js';
import { initBriefingChatbot } from './briefing-chatbot.js';
import { durationsFor } from './tour-timing.js';
import { createActionPreview, executeAction } from './operations.js';
import { createWorkspaceState, beginWorkspaceAction, completeWorkspaceAction } from './briefing-actions.js';
import {assemblyControlState,nextAssemblyTarget} from './assembly-controls.js';

const $ = id => document.getElementById(id);
const scope = new AbortController();
const listen = (target, event, handler, options = {}) => target?.addEventListener(event, handler, { ...options, signal: scope.signal });
const on = (id, event, handler) => listen($(id), event, handler);
const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = String(text);
  return element;
};
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const durations = durationsFor(5);
const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
const starts = durations.map((_, index) => durations.slice(0, index).reduce((sum, duration) => sum + duration, 0));
const chapterLabels = ['Sourcing', 'Logistics', 'Inspection', 'Process', 'Ontology'];
const displayTitles = ['PM-820 sourcing bridge', 'Inventory in transition', 'Robotic weld inspection', 'CAB brazing process control', 'Enterprise object-action architecture'];
const objectCodes = ['GEN-01', 'USC-01', 'LT-01', 'CAB-01', 'ONT-01'];
const treeStats = ['20 CBOM parts | $1.25M opportunity', '1,200 fast-pick SKUs | >98% accuracy', '6-axis ultrasonic NDT | 0.8 mm', '595 ± 3°C | 12.5% scrap reduction', 'PostgreSQL | MCP | Vector RAG'];

let engine = null;
let textMode = false;
let selectedId = 'generac';
let componentItems = [];
let elapsed = 0;
let playing = false;
let speed = 1;
let lastTick = performance.now();
let activeAct = 0;
let lastCueKey = '';
let isSeeking = false;
let pendingAction = null;
let voiceToken = 0;
let workspaceState = createWorkspaceState();
let gridSort = {key:'line',direction:'asc'};
let selectedPartId = '';
const expandedObjects = new Set(['generac']);
const runningActions = new Map();
const hiddenRunIds = new Set();
let selectedDetailTab = 'cbom';
const speechAvailable = Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
const reducePreference = matchMedia('(prefers-reduced-motion: reduce)');
$('reduce-motion').checked = reducePreference.matches;

function currentObject() { return objects.find(object => object.id === selectedId) || objects[0]; }
function getActIndex(time = elapsed) {
  for (let index = starts.length - 1; index >= 0; index--) if (time >= starts[index]) return index;
  return 0;
}
function setSession(text) { $('session-status').textContent = text; }

function buildTree() {
  const fragment = make('ul','ontology-hierarchy');
  objects.forEach((object, index) => {
    const branch = make('li','object-branch');
    branch.dataset.branch = object.id;
    const header = make('div','object-branch-header');
    const toggle = make('button','branch-toggle',expandedObjects.has(object.id)?'⌄':'›');
    toggle.type = 'button';
    toggle.setAttribute('aria-label',`Expand relationships for ${object.name}`);
    toggle.setAttribute('aria-expanded',String(expandedObjects.has(object.id)));
    toggle.setAttribute('aria-controls',`relations-${object.id}`);
    listen(toggle,'click',()=>{
      const open = !expandedObjects.has(object.id);
      if(open) expandedObjects.add(object.id); else expandedObjects.delete(object.id);
      toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'⌄':'›';
      $(`relations-${object.id}`).hidden=!open;
    });
    const button = make('button', 'object-row');
    button.type = 'button';
    button.dataset.object = object.id;
    button.setAttribute('aria-pressed', String(object.id === selectedId));
    const icon = make('span', 'object-row-icon', '◇');
    icon.setAttribute('aria-hidden', 'true');
    const name = make('span', 'object-row-name');
    name.append(icon, make('span', '', object.displayName||object.name));
    button.append(name, make('span', 'object-row-kind', object.kind), make('span', 'object-row-stat', treeStats[index]));
    const status = make('span','object-row-status');status.dataset.treeStatus=object.id;status.hidden=true;button.append(status);
    listen(button, 'click', () => selectObject(object.id));
    header.append(toggle,button);
    const relations = make('ul','relation-list');relations.id=`relations-${object.id}`;relations.hidden=!expandedObjects.has(object.id);
    function appendRelation(relation,parent,depth=0){
      const li=make('li','relation-node');
      const child=make('button','relation-button');child.type='button';child.dataset.relation=relation.id;
      child.append(make('span','relation-type',relation.type==='action'?'ƒ':relation.type==='property'?'·':'↗'),make('span','relation-name',relation.name||relation.label),make('small','relation-value',relation.label||''));
      listen(child,'click',()=>{
        selectObject(object.id);
        document.querySelectorAll('[data-relation]').forEach(e=>e.classList.toggle('active',e===child));
        $('relationship-detail').hidden=false;
        $('relationship-kind').textContent=(relation.type||'relationship').toUpperCase();
        $('relationship-title').textContent=relation.name||relation.label;
        $('relationship-description').textContent=relation.detail||relation.label;
        if(relation.partId) selectCbomLine(cbomLines.find(line=>line.id===relation.partId||line.partId===relation.partId));
        else if(/cbom|component/i.test(relation.id+' '+relation.name))selectEvidenceTab('cbom');
        else if(relation.actionId)previewAction(relation.actionId);
        else selectEvidenceTab('evidence');
      });
      const relationHeader=make('div','relation-header');relationHeader.append(child);li.append(relationHeader);
      if(relation.children?.length && depth<2){
        const children=make('ul','relation-list relation-sublist');
        children.hidden=true;children.id=`relation-children-${relation.id}`;
        const expand=make('button','relation-expander',`+${relation.children.length}`);expand.type='button';
        expand.setAttribute('aria-label',`Expand child objects in ${relation.name}`);expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-controls',children.id);
        listen(expand,'click',()=>{const open=children.hidden;children.hidden=!open;expand.textContent=open?'−':`+${relation.children.length}`;expand.setAttribute('aria-expanded',String(open));});
        relationHeader.append(expand);relation.children.forEach(item=>appendRelation(item,children,depth+1));li.append(children);
      }
      parent.append(li);
    }
    (object.relationships||[]).forEach(relation=>appendRelation(relation,relations));
    branch.append(header,relations);fragment.append(branch);
  });
  $('object-tree').replaceChildren(fragment);
}

function filterTree() {
  const query = $('object-search').value.toLowerCase().trim();
  let visible = 0;
  document.querySelectorAll('[data-branch]').forEach(branch => {
    const object = objects.find(item => item.id === branch.dataset.branch);
    const searchable = `${object.name} ${object.kind} ${object.subtitle} ${object.description} ${JSON.stringify(object.relationships||[])}`.toLowerCase();
    branch.hidden = Boolean(query) && !searchable.includes(query);
    if (!branch.hidden) visible++;
    if(query && !branch.hidden){branch.querySelector('.relation-list').hidden=false;branch.querySelector('.branch-toggle').setAttribute('aria-expanded','true');}
    else if(!query){const open=expandedObjects.has(object.id);branch.querySelector('.relation-list').hidden=!open;branch.querySelector('.branch-toggle').setAttribute('aria-expanded',String(open));}
  });
  $('search-empty').hidden = visible > 0;
}

const currency = value => value === null || value === undefined ? 'Pending' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
function renderCbomGrid(){
  const pricedOnly=$('cbom-priced-only').checked;
  const lines=sortCbomLines(cbomLines.filter(line=>!pricedOnly||(line.baseline!==null&&line.target!==null)),gridSort.key,gridSort.direction);
  const fragment=document.createDocumentFragment();
  for(const line of lines){
    const row=make('tr',line.id===selectedPartId?'selected':'');row.dataset.part=line.id;
    const part=make('td','part-cell'), select=make('button','cbom-part-button');
    select.type='button';select.setAttribute('aria-pressed',String(line.id===selectedPartId));
    select.append(make('strong','mono',line.id),make('span','part-description',line.name));part.append(select);row.append(part);
    row.append(make('td','money-cell mono',currency(line.baseline)),make('td','money-cell mono',currency(line.target)));
    const variance=variancePercent(line);
    row.append(make('td','variance-cell mono',variance===null?'Pending':`${variance.toFixed(1)}%`));
    const basis=line.volumeTier||(line.unitBasis?.includes('kg')?'USD / kg':line.unitBasis?.includes('per piece')?'USD / piece':'Supplied line quote');
    const status=make('td',/Dual-Source|NRE Review/i.test(line.status)?'quote-status quote-status-risk':'quote-status');status.append(make('span','quote-status-label',line.status),make('small','mono',basis));
    row.append(status);
    listen(row,'click',()=>selectCbomLine(line));
    fragment.append(row);
  }
  $('cbom-rows').replaceChildren(fragment);
  document.querySelectorAll('[data-sort]').forEach(button=>{
    const active=button.dataset.sort===gridSort.key;
    button.closest('th').setAttribute('aria-sort',active?(gridSort.direction==='asc'?'ascending':'descending'):'none');
    let indicator=button.querySelector('span');
    if(!indicator){indicator=make('span');button.append(indicator)}
    indicator.textContent=active?(gridSort.direction==='asc'?' ↑':' ↓'):'';
  });
  const priced=cbomLines.filter(line=>line.baseline!==null&&line.target!==null).length;
  $('grid-row-count').textContent=`${lines.length} / 20 scope lines`;
  $('grid-provenance').textContent=`${priced} priced references | Separate annual bridge basis`;
  if(selectedId==='generac')$('evidence-status').textContent=`${priced} PRICED / 20 SCOPE`;
}

function selectCbomLine(line){
  if(!line)return;
  if(selectedId!=='generac')selectObject('generac');
  selectedPartId=line.id;
  renderCbomGrid();selectEvidenceTab('cbom');
  $('grid-selection').textContent=line.id;
  $('cbom-part-detail').hidden=false;
  const role=line.engineeringFunction||'Component function linked to the power conversion assembly.';
  const gate=line.qualificationRationale||'Compare engineering requirements, supplier capability, and quotation basis before release.';
  const content=[make('strong','mono',line.name),make('p','',role)];
  if(line.governingFormula)content.push(make('pre','',line.governingFormula));
  content.push(make('p','',`Qualification: ${gate}`));
  if(line.sourcingRationale)content.push(make('p','',`Sourcing decision: ${line.sourcingRationale}`));
  content.push(make('p','quote-basis-note',`Quote basis: ${line.unitBasis||'Supplied reference line'}. Source record: ${line.sourceLine||line.line}.`));
  if(Number.isFinite(line.annualDemand))content.push(make('p','quote-basis-note',`Source demand: ${line.annualDemand.toLocaleString('en-US')} ${line.quantityUnit||'pieces'} / year | Usage: ${line.usagePerUnit} per finished unit.`));
  const references=make('div','part-references');
  for(const reference of line.engineeringReferences||[]){const link=make('a','',`${reference.title} ↗`);link.href=reference.url;link.target='_blank';link.rel='noopener noreferrer';references.append(link)}
  content.push(references);$('cbom-part-detail').replaceChildren(...content);
  const focused=engine?.focusPart?.(line.partId||line.id);
  if(engine)paintViewButtons('iso');
  const explode=engine?.getState?.().explodeTarget;
  if(typeof explode==='number')paintExplodeControl(explode);
  if(!engine)$('inspect-body').textContent=`${line.name} | ${role} | ${gate}`;
  setSession(`CBOM line selected | ${line.id}${focused?.found===false?' | Assembly context':''}`);
}

function paintExplodeControl(value){
  const state=assemblyControlState(value);
  $('explode-slider').value=String(state.value);
  $('explode-slider').setAttribute('aria-valuetext',state.ariaValueText);
  $('explode-value').textContent=state.label;
  $('explode-toggle').textContent=state.buttonLabel;
}

function displayMetrics(object){
  const state=workspaceState.objects[object.id];
  const metrics=object.id==='generac'?[object.metrics[2],{label:'Priority CBOM components',value:'20'},object.metrics[3]]:object.metrics.slice(0,3).map(item=>({...item}));
  if(state.simulation){
    if(object.id==='generac'&&state.phase==='complete')metrics[0]={label:'LOCKED | Annualized opportunity',value:'$1,247,538.11'};
    if(object.id==='usc'&&state.phase==='complete')metrics[2]={label:'Simulated pick path travel',value:'-18.4%'};
    if(object.id==='lt')metrics[2]=state.phase==='complete'?{label:'Simulated defects >0.8 mm',value:'0'}:{label:'Simulated scan output',value:'SCANNING'};
  }
  return metrics;
}

function paintObjectState(){
  const state=workspaceState.objects[selectedId];
  $('action-progress').hidden=state.phase!=='running';
  $('object-state-badge').textContent=state.opportunityBadge||state.status;
  $('object-state-scope').textContent=state.simulation?`SIMULATED / ${state.phase.toUpperCase()}`:'SOURCE RECORD';
  $('object-state-badge').closest('.object-state-strip').classList.toggle('state-mutated',state.simulation);
  $('object-state-badge').closest('.object-state-strip').dataset.phase=state.phase;
  $('stage-metrics').replaceChildren(...displayMetrics(currentObject()).map(metric=>{
    const card=make('div','metric-card'),value=make('div','metric-card-value',metric.value);
    if(!/[0-9]/.test(metric.value)||metric.value.length>10)value.classList.add('compact');
    card.append(value,make('div','metric-card-label',metric.label));return card;
  }));
  document.querySelectorAll('[data-tree-status]').forEach(element=>{
    const objectState=workspaceState.objects[element.dataset.treeStatus];
    element.hidden=!objectState.simulation;element.textContent=objectState.simulation?`SIM | ${objectState.phase==='running'?'RUNNING':objectState.status}`:'';
  });
  document.documentElement.dataset.stateVersion=String(workspaceState.sequence);
  $('workspace').dataset.objectStatus=state.status;
  $('object-state-badge').textContent=state.phase==='complete'&&state.opportunityBadge?state.opportunityBadge:state.status;
  const output=$('scene-action-status');output.hidden=!state.simulation;
  output.textContent=state.simulation?`SIMULATED | ${state.scanOutput||state.travelReductionBadge||state.status}`:'';
  document.querySelectorAll('.action-list button[data-action]').forEach(button=>{const objectId={sourcing:'generac',slotting:'usc',ndt:'lt'}[button.dataset.action];button.disabled=workspaceState.objects[objectId].phase==='running';});
  if(textMode)renderTextView();
}

function renderEvidence(object) {
  const container = $('evidence-body');
  const fragment = document.createDocumentFragment();
  if (object.id === 'generac') {
    const comparison = make('div', 'bridge-comparison');
    const baseline = make('dl', 'evidence-rows');
    const baselineRow = make('div');
    baselineRow.append(make('dt', '', 'Annual baseline'), make('dd', '', '$4,471,763.97'));
    baseline.append(baselineRow);
    const target = make('dl', 'evidence-rows');
    const targetRow = make('div');
    targetRow.append(make('dt', '', 'Target quotations'), make('dd', '', '$3,224,225.86'));
    target.append(targetRow);
    const targetBar = make('div', 'bridge-bar target');
    targetBar.style.width = `${3224225.86 / 4471763.97 * 100}%`;
    comparison.append(baseline, make('div', 'bridge-bar'), target, targetBar);
    fragment.append(comparison);
  } else {
    const details = make('dl', 'evidence-rows');
    object.metrics.slice(0, 3).forEach(metric => {
      const row = make('div');
      row.append(make('dt', '', metric.label), make('dd', 'mono', metric.value));
      details.append(row);
    });
    fragment.append(details);
  }
  const captions = {generac: 'Quotation opportunity | qualification required.', usc: 'Maintained through peak fall intake.', lt: 'Manual scaffolding climbs eliminated.', banco: 'FMEA priority: RPN 288 → 72.', ontology: 'Academic architecture | PLM-ERP bridge.'};
  fragment.append(make('p', 'evidence-caption', captions[object.id]));
  container.replaceChildren(fragment);
}

function inspectComponent(data) {
  if (!data) return;
  const parts = [data.name, data.specs, data.metric].filter(Boolean);
  $('inspect-body').textContent = parts.join(' | ');
  const index = componentItems.findIndex(item => item.id === data.id || item.name === data.name);
  $('component-picker').value = index >= 0 ? String(index) : '';
  setSession(`Component selected | ${data.name || currentObject().name}`);
  if(data.partId){
    const line=cbomLines.find(item=>item.partId===data.partId||item.id===data.partId);
    if(line){selectedPartId=line.id;renderCbomGrid();$('grid-selection').textContent=line.id;}
  }
}

function refreshComponents({preserve = false} = {}) {
  const previous = preserve && $('component-picker').value !== '' ? componentItems[Number($('component-picker').value)] : null;
  componentItems = engine?.getObjects() || [];
  const select = $('component-picker');
  const fragment = document.createDocumentFragment();
  const placeholder = make('option', '', engine ? 'Select component' : 'Text view | object evidence available');
  placeholder.value = '';
  fragment.append(placeholder);
  componentItems.forEach((component, index) => {
    const option = make('option', '', component.name);
    option.value = String(index);
    fragment.append(option);
  });
  select.replaceChildren(fragment);
  select.disabled = !engine;
  const retained = previous && componentItems.find(item => item.id === previous.id);
  if (retained) inspectComponent(retained);
  else $('inspect-body').textContent = engine ? 'Select a mesh, pinned tag, or component to inspect its context.' : currentObject().decision;
}

function renderTextView(message = 'TEXT VIEW | OBJECT CONTEXT') {
  const container = $('canvas-container');
  const fallback = make('div', 'graphics-fallback');
  fallback.append(make('span', 'eyebrow', message), make('h2', '', currentObject().name), make('p', '', currentObject().description), make('p', 'mono', currentObject().metrics.map(item => `${item.label}: ${item.value}`).join('\n')));
  container.replaceChildren(fallback);
  container.dataset.graphicsState = 'text';
  $('cad-mesh-badge').textContent = 'Text view';
}

function paintViewButtons(view = 'iso') {
  document.querySelectorAll('.view-buttons button[data-view]').forEach(button => {
    const selected = button.dataset.view === view;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.disabled = !engine;
  });
}

function initGraphics() {
  try {
    engine = initBriefing3D($('canvas-container'), inspectComponent, () => queueMicrotask(() => {
      if (engine && !textMode) {refreshComponents({preserve:true});paintExplodeControl(engine.getState().explodeTarget);}
    }));
    engine.setMotion(!$('reduce-motion').checked);
    engine.setExplode(Number($('explode-slider').value));
    paintExplodeControl(engine.getState().explodeTarget);
    engine.setDimensions?.($('show-dimensions').checked);
    engine.switchStation(selectedId);
    if(selectedId==='generac'&&selectedPartId)engine.focusPart?.(selectedPartId,false,{autoExplode:false,preserveCamera:true});
    for(const [id,objectId]of Object.entries({sourcing:'generac',slotting:'usc',ndt:'lt'})){
      const objectState=workspaceState.objects[objectId];
      if(objectState.simulation)engine.runAction?.(id,objectState);
    }
    $('canvas-container').dataset.graphicsState = 'ready';
    textMode = false;
  } catch {
    engine?.dispose();
    engine = null;
    textMode = true;
    renderTextView('GRAPHICS UNAVAILABLE | OBJECT CONTEXT');
  }
  $('view-text').textContent = textMode ? 'Restore 3D' : 'Text view';
  $('view-text').setAttribute('aria-pressed', String(textMode));
  paintViewButtons();
  refreshComponents();
}

function renderObject(id,{syncScene=true}={}) {
  const object = objects.find(item => item.id === id);
  if (!object) return;
  const changed=selectedId!==object.id;
  selectedId = object.id;
  const index = objects.indexOf(object);
  $('metadata-name').textContent = object.name;
  $('breadcrumb-object').textContent = object.name;
  $('object-kind').textContent = object.kind.toUpperCase();
  $('object-id').textContent = `OBJ / ${objectCodes[index]}`;
  $('stage-title').textContent = displayTitles[index];
  $('stage-lead').textContent = object.description;
  $('stage-lead').title=object.description;
  const properties = document.createDocumentFragment();
  object.properties.forEach(([label, value]) => {
    const row = make('div');
    row.append(make('dt', '', label), make('dd', '', value));
    properties.append(row);
  });
  const objectState=workspaceState.objects[id];
  if(objectState.simulation){
    const row=make('div','scenario-property');
    row.append(make('dt','','Scenario status'),make('dd','',objectState.status));properties.append(row);
  }
  $('object-properties').replaceChildren(properties);
  $('object-links').replaceChildren(...object.links.map(link => {
    const item = make('div', 'linked-item');
    item.textContent = link;
    return item;
  }));
  paintObjectState();
  $('model-formula').textContent = object.formula;
  $('model-boundary').textContent = object.boundary;
  document.querySelectorAll('[data-object]').forEach(button => {
    const selected = button.dataset.object === id;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('explode-box').hidden = id !== 'generac';
  $('tab-cbom').hidden=id!=='generac';
  if(id!=='generac'&&selectedDetailTab==='cbom')selectEvidenceTab('evidence');
  else if(id==='generac'&&changed)selectEvidenceTab('cbom');
  $('evidence-status').textContent=id==='generac'?`${cbomLines.filter(line=>line.baseline!==null&&line.target!==null).length} PRICED / 20 SCOPE`:'VERIFIED INPUTS';
  if(changed)$('relationship-detail').hidden=true;
  expandedObjects.add(id);
  const branch=document.querySelector(`[data-branch="${id}"]`);
  if(branch){branch.querySelector('.relation-list').hidden=false;branch.querySelector('.branch-toggle').textContent='⌄';branch.querySelector('.branch-toggle').setAttribute('aria-expanded','true');}
  renderEvidence(object);
  if (engine&&syncScene) engine.switchStation(id);
  if (textMode) renderTextView();
  if(syncScene){paintViewButtons();refreshComponents();}
}

function stopVoice() {
  voiceToken++;
  if (speechAvailable) window.speechSynthesis.cancel();
}

function buildCues(script) {
  const sentences = script.split(/(?<=[.!?])\s+(?=[A-Z])/u);
  const chunks = [];
  let pending = '';
  for (const sentence of sentences) {
    pending = pending ? `${pending} ${sentence}` : sentence;
    if (pending.split(/\s+/).length >= 23) { chunks.push(pending); pending = ''; }
  }
  if (pending) {
    if (chunks.length && pending.split(/\s+/).length < 10) chunks[chunks.length - 1] += ` ${pending}`;
    else chunks.push(pending);
  }
  return chunks.length ? chunks : [script];
}
const cues = steps.map(step => buildCues(step.script));

function getCueIndex() {
  const fraction = Math.min(.999999, Math.max(0, (elapsed - starts[activeAct]) / durations[activeAct]));
  return Math.min(cues[activeAct].length - 1, Math.floor(fraction * cues[activeAct].length));
}

function paintSpeechStatus() {
  if (elapsed >= totalDuration) $('speech-status').textContent = 'BRIEFING COMPLETE';
  else if (!speechAvailable) $('speech-status').textContent = 'TRANSCRIPT | DEVICE VOICE UNAVAILABLE';
  else if (!playing) $('speech-status').textContent = 'PAUSED | TRANSCRIPT';
  else if (!$('tour-narrate').checked) $('speech-status').textContent = 'LIVE TRANSCRIPT';
  else $('speech-status').textContent = 'VOICE ON | TIMED TRANSCRIPT';
}

function speakCurrentCue() {
  stopVoice();
  paintSpeechStatus();
  if (!speechAvailable || !playing || isSeeking || !$('tour-narrate').checked || elapsed >= totalDuration) return;
  const token = voiceToken;
  const utterance = new SpeechSynthesisUtterance(cues[activeAct][getCueIndex()]);
  utterance.rate = speed;
  utterance.lang = 'en-US';
  utterance.onstart = () => {
    if (token === voiceToken && playing) $('speech-status').textContent = 'NARRATING | DEVICE VOICE';
  };
  utterance.onend = () => { if (token === voiceToken) paintSpeechStatus(); };
  utterance.onerror = () => {
    if (token === voiceToken && playing) $('speech-status').textContent = 'DEVICE VOICE UNAVAILABLE | TRANSCRIPT ACTIVE';
  };
  window.speechSynthesis.speak(utterance);
}

function paintTimeline({ forceCue = false, speak = true } = {}) {
  activeAct = getActIndex();
  const step = steps[activeAct];
  if (selectedId !== step.station) renderObject(step.station);
  $('tour-clock').textContent = `${clock(elapsed)} / ${clock(totalDuration)}`;
  $('tour-scrubber').value = String(Math.floor(elapsed));
  $('tour-scrubber').setAttribute('aria-valuetext', `${clock(elapsed)} of five minutes. ${chapterLabels[activeAct]}`);
  $('tour-play').textContent = playing ? 'Ⅱ' : elapsed >= totalDuration ? '↺' : '▶';
  $('tour-play').setAttribute('aria-label', playing ? 'Pause briefing' : elapsed >= totalDuration ? 'Replay briefing' : 'Play briefing');
  $('tour-play').setAttribute('aria-pressed', String(playing));
  $('tour-act-title').textContent = step.title;
  document.querySelectorAll('[data-chapter]').forEach(button => {
    const current = Number(button.dataset.chapter) === activeAct;
    button.classList.toggle('active', current);
    button.setAttribute('aria-current', current ? 'step' : 'false');
  });
  const cueIndex = getCueIndex();
  const cueKey = `${activeAct}:${cueIndex}`;
  if (forceCue || cueKey !== lastCueKey) {
    lastCueKey = cueKey;
    $('hud-speech').textContent = cues[activeAct][cueIndex];
    $('hud-speech').dataset.cue = cueKey;
    if (speak) speakCurrentCue();
  }
}

function updateClockToNow() {
  const now = performance.now();
  if (playing) elapsed = Math.min(totalDuration, elapsed + Math.max(0, now - lastTick) / 1000 * speed);
  lastTick = now;
  if (elapsed >= totalDuration && playing) { playing = false; stopVoice(); paintSpeechStatus(); }
}

function pause() {
  updateClockToNow();
  playing = false;
  stopVoice();
  paintTimeline({ speak: false });
  paintSpeechStatus();
}

function seekTo(time, { continuePlaying = playing, narrate = true } = {}) {
  stopVoice();
  elapsed = Math.max(0, Math.min(totalDuration, Number(time) || 0));
  playing = Boolean(continuePlaying) && elapsed < totalDuration;
  lastTick = performance.now();
  paintTimeline({ forceCue: true, speak: narrate });
  paintSpeechStatus();
}

function selectObject(id) {
  const index = steps.findIndex(step => step.station === id);
  if (index < 0) return;
  seekTo(starts[index], { continuePlaying: false });
  setSession(`Object context synchronized | ${currentObject().name}`);
}

function togglePlayback() {
  if (playing) { pause(); return; }
  if (elapsed >= totalDuration) elapsed = 0;
  playing = true;
  lastTick = performance.now();
  paintTimeline({ forceCue: true });
  paintSpeechStatus();
  setSession('Five-minute guided briefing playing');
}

function buildChapters() {
  $('tour-chapters').replaceChildren(...steps.map((step, index) => {
    const button = make('button', 'chapter-button');
    button.type = 'button';
    button.dataset.chapter = String(index);
    button.setAttribute('aria-label', `${chapterLabels[index]}, ${clock(starts[index])}`);
    button.append(make('span', 'chapter-number', String(index + 1).padStart(2, '0')), make('span', '', chapterLabels[index]));
    listen(button, 'click', () => seekTo(starts[index]));
    return button;
  }));
}

function selectEvidenceTab(name, focus = false) {
  if(name==='cbom'&&selectedId!=='generac')name='evidence';
  selectedDetailTab=name;
  for (const tabName of ['cbom','evidence', 'model']) {
    const active = name === tabName;
    const tab = $(`tab-${tabName}`);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    $(`${tabName}-content`).hidden = !active;
    if (active && focus) tab.focus();
  }
}

function showDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function previewAction(id) {
  const preview = createActionPreview(id);
  selectObject(preview.objectId);
  pendingAction = id;
  $('action-title').textContent = preview.title;
  const checks = make('ul', 'action-checks');
  preview.checks.forEach(check => {
    const item = make('li', check.passed ? 'check-passed' : 'check-failed');
    item.textContent = check.label;
    checks.append(item);
  });
  const comparison = make('div', 'preview-comparison');
  for (const [label, value] of [[preview.beforeLabel, preview.before], [preview.afterLabel, preview.after]]) {
    const card = make('div');
    card.append(make('span', 'section-label', label), make('strong', 'mono', value));
    comparison.append(card);
  }
  $('action-preview').replaceChildren(checks, comparison, make('p', '', preview.note), make('p', 'action-scope', 'SIMULATION | Browser-local session. No enterprise system write.'));
  $('action-confirm').disabled = !preview.checks.every(check => check.passed);
  showDialog($('action-dialog'));
}

function confirmAction() {
  if (!pendingAction) return;
  try {
    const actionId=pendingAction;
    const result = executeAction(actionId);
    workspaceState=beginWorkspaceAction(workspaceState,actionId);
    runningActions.set(actionId,{started:performance.now(),objectId:result.objectId});
    engine?.runAction?.(actionId,workspaceState.objects[result.objectId]);
    renderObject(selectedId,{syncScene:false});renderActionLog();
    $('action-progress').hidden=false;$('action-progress').value=0;
    setSession(`${result.title} | Scenario state changed`);
    $('action-dialog').close();
    pendingAction = null;
  } catch (error) {
    setSession(`Action not recorded | ${error.message}`);
    $('action-confirm').disabled = true;
  }
}

function renderActionLog(){
  const entries=workspaceState.history.filter(item=>!hiddenRunIds.has(item.id)).slice().reverse();
  if(!entries.length){$('action-log').replaceChildren(make('p','log-empty','No simulated actions recorded.'));return;}
  $('action-log').replaceChildren(...entries.map(item=>{
    const entry=make('div','log-entry');entry.dataset.run=item.id;entry.dataset.phase=item.phase;
    const heading=make('div','log-entry-heading');heading.append(make('strong','',item.title),make('span','log-status',item.phase==='running'?'RUNNING':'SIMULATED'));
    entry.append(heading,make('p','',item.scenarioOutput||item.status),make('small','mono',`${item.id} | ${objects.find(o=>o.id===item.objectId).name}`));return entry;
  }));
}

function advanceScenarioActions(){
  const snapshot=engine?.getActionState?.();
  for(const [id,run]of runningActions){
    const animation=snapshot?.[id];
    const progress=animation?.progress??Math.min(1,(performance.now()-run.started)/700);
    if(selectedId===run.objectId){$('action-progress').hidden=false;$('action-progress').value=progress;}
    if(animation?.status==='complete'||(!animation&&progress>=1)){
      workspaceState=completeWorkspaceAction(workspaceState,id);runningActions.delete(id);
      renderObject(selectedId,{syncScene:false});renderActionLog();
      if(selectedId===run.objectId){$('action-progress').hidden=true;setSession(`${objects.find(o=>o.id===run.objectId).name} | Scenario action complete`);}
    }
  }
  if(!runningActions.size)$('action-progress').hidden=true;
}

buildTree();
buildChapters();
renderCbomGrid();
renderObject(selectedId);
initGraphics();
paintTimeline({ forceCue: true, speak: false });
paintSpeechStatus();
const advisor = initBriefingChatbot({getContext:()=>({workspaceState})});

on('object-search', 'input', filterTree);
on('component-picker', 'change', event => {
  if (event.target.value !== '') inspectComponent(componentItems[Number(event.target.value)]);
});
document.querySelectorAll('.view-buttons button[data-view]').forEach(button => listen(button, 'click', () => {
  engine?.setView?.(button.dataset.view);
  paintViewButtons(button.dataset.view);
}));
on('camera-reset', 'click', () => { engine?.resetCamera(); paintViewButtons(); });
on('stage-expand','click',()=>{const expanded=document.querySelector('.twin-workspace').classList.toggle('twin-expanded');$('stage-expand').setAttribute('aria-pressed',String(expanded));$('stage-expand').setAttribute('aria-label',expanded?'Restore workspace panels':'Expand digital twin');});
on('explode-slider', 'input', event => {
  const value = Number(event.target.value);
  paintExplodeControl(value);
  engine?.setExplode(value);
});
on('explode-toggle','click',()=>{const value=nextAssemblyTarget($('explode-slider').value);paintExplodeControl(value);engine?.setExplode(value);});
document.querySelectorAll('[data-sort]').forEach(button=>listen(button,'click',()=>{const key=button.dataset.sort;gridSort={key,direction:gridSort.key===key&&gridSort.direction==='asc'?'desc':'asc'};renderCbomGrid();}));
on('cbom-priced-only','change',renderCbomGrid);
on('show-dimensions', 'change', event => engine?.setDimensions?.(event.target.checked));
on('reduce-motion', 'change', event => engine?.setMotion(!event.target.checked));
listen(reducePreference, 'change', event => {
  $('reduce-motion').checked = event.matches;
  engine?.setMotion(!event.matches);
});
on('view-text', 'click', () => {
  if (textMode) { initGraphics(); return; }
  engine?.dispose();
  engine = null;
  textMode = true;
  renderTextView();
  refreshComponents();
  paintViewButtons();
  $('view-text').textContent = 'Restore 3D';
  $('view-text').setAttribute('aria-pressed', 'true');
});
for (const name of ['cbom','evidence', 'model']) {
  on(`tab-${name}`, 'click', () => selectEvidenceTab(name));
  on(`tab-${name}`, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const visibleTabs=['cbom','evidence','model'].filter(id=>!$(`tab-${id}`).hidden);
    const index=visibleTabs.indexOf(name),direction=event.key==='ArrowLeft'?-1:1;
    selectEvidenceTab(event.key==='Home'?visibleTabs[0]:event.key==='End'?visibleTabs.at(-1):visibleTabs[(index+direction+visibleTabs.length)%visibleTabs.length],true);
  });
}
on('tour-play', 'click', togglePlayback);
on('tour-scrubber', 'pointerdown', () => { isSeeking = true; stopVoice(); });
on('tour-scrubber', 'input', event => seekTo(event.target.value, { narrate: !isSeeking }));
listen(window, 'pointerup', () => {
  if (isSeeking) { isSeeking = false; speakCurrentCue(); }
});
on('tour-scrubber', 'pointercancel', () => { isSeeking = false; speakCurrentCue(); });
on('tour-speed', 'click', () => {
  updateClockToNow();
  speed = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 1;
  $('tour-speed').textContent = `${speed}×`;
  $('tour-speed').setAttribute('aria-label', `Playback speed ${speed} times. Change playback speed`);
  paintTimeline({ forceCue: true });
});
on('tour-narrate', 'change', speakCurrentCue);
if (!speechAvailable) {
  $('tour-narrate').disabled = true;
  $('tour-narrate').title = 'Device narration is unavailable. The timed transcript remains available.';
}
document.querySelectorAll('.action-list button[data-action]').forEach(button => listen(button, 'click', () => previewAction(button.dataset.action)));
on('action-confirm', 'click', confirmAction);
on('action-cancel', 'click', () => { pendingAction = null; $('action-dialog').close(); });
on('action-dialog', 'close', () => { pendingAction = null; });
on('clear-log', 'click', () => {
  workspaceState.history.forEach(item=>hiddenRunIds.add(item.id));renderActionLog();
  setSession('Local action log cleared');
});
on('reset-scenario','click',()=>{
  runningActions.clear();hiddenRunIds.clear();workspaceState=createWorkspaceState();
  engine?.resetActionState?.();engine?.setExplode(0);engine?.resetCamera();paintExplodeControl(0);paintViewButtons();
  selectedPartId='';$('cbom-part-detail').hidden=true;$('grid-selection').textContent='Select a line to inspect its mesh';renderCbomGrid();
  renderObject(selectedId,{syncScene:false});renderActionLog();
  $('action-progress').hidden=true;setSession('Scenario reset | Source object states restored');
});
on('about-open', 'click', () => showDialog($('about-dialog')));
on('sources-open', 'click', () => showDialog($('about-dialog')));

const ticker = setInterval(() => {
  updateClockToNow();
  paintTimeline();
  advanceScenarioActions();
}, 100);
listen(window, 'pagehide', event => {
  if (event.persisted) { pause(); return; }
  clearInterval(ticker);
  stopVoice();
  advisor.dispose();
  engine?.dispose();
  scope.abort();
});
document.documentElement.dataset.workspaceReady = 'true';
