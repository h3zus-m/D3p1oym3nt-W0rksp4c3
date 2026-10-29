import { objects, cbomLines, productSpecification, variancePercent } from './briefing-director.js';

// Synchronous, local answer selection. No remote generation or hidden data source.
const answers = {
  generac: 'Generac: 20 priority CBOM components at 200,000 annual units form a sourcing bridge from $4,471,763.97 baseline to $3,224,225.86 in target quotations. The annualized opportunity is $1,247,538.11, approximately 27.90%. Model each component, quotation, supplier, and qualification as linked Foundry Objects. The Action then turns a ranked cost opportunity into an RFQ with an owner and an engineering gate. The bridge is a quotation opportunity, not booked savings.',
  usc: 'USC Logistics: 1,200 fast-pick SKUs were relocated during a three-month transition for a 45 to 60-day turnover window. Cycle-count accuracy remained above 98% through peak fall intake. In a Foundry deployment, SKU, bin, relocation, and count records belong to one linked operating model. A rebalance Action updates location state while preserving the count evidence. That is how a layout change becomes a controlled operational decision.',
  lt: 'Larsen & Toubro: an automated six-axis robotic ultrasonic weld scanner delivered 0.8 mm defect resolution and eliminated dangerous manual scaffolding climbs across offshore platform tubulars. Model the tubular, weld seam, scan run, and engineering disposition as linked Objects. A dispatch Action creates the next scan record; the result stays attached to the weld so each inspection adds operational memory.',
  banco: 'Banco Products: the CAB furnace peak window was 595 ± 3°C, or 592 to 598°C. Scrap fell from 4.8% to 4.2%, a 0.6 percentage point decrease and 12.5% relative reduction. FMEA priority moved from RPN 288 to 72. In Foundry terms, the furnace is an Object, the thermal window is a constraint, and an exception triggers an accountable process Action. Keep the process settings and quality outcomes linked so the next investigation starts with prior evidence. RPN ranks priority; it is not a failure probability.',
  ontology: 'Academic architecture: PostgreSQL holds the object-action ontology linking PLM engineering context to ERP decisions. Vector RAG retrieves ECO change notes; an MCP server exposes deterministic business-rule validation. Context explains the proposed change, rules test whether it can proceed, and an authorized approval records the Action. This academic model follows the Foundry principle of putting objects, business logic, and decisions in the same operational workflow.'
};

const topicPatterns = {
  generac: /\bgenerac\b|sourc|\bpm[ _-]?820\b|microinverter|\bcbom\b|supplier|quotation|\$?1[.,]2[45]|\b27[.,]9/,
  usc: /\busc\b|logistic|warehouse|bookstore|inventory|\bsku|slott|cycle[ -]?count|fast[ -]?pick|turnover|\b98\s*%/,
  lt: /\bl\s*&\s*t\b|larsen|toubro|robot|\bndt\b|ultrasonic|weld|tubular|scaffold|\b0[.,]8\s*mm|\bsix.axis|\b6.axis/,
  banco: /\bbanco\b|braz|\bcab\b|furnace|scrap|\brpn\b|\bfmea\b|\b595\b|\b288\b|\b12[.,]5\s*%/,
  ontology: /ontolog|\bplm\b|\berp\b|\bmcp\b|\brag\b|postgres|\beco\b|academic|architecture|business.rule|revision|engineering.change/
};

const fit = 'My fit for Deployment Strategy starts with the physical operating decision. At Generac, it is which component and supplier deserve action. At USC, it is which SKU moves while inventory control stays reliable. At L&T, it is which weld needs inspection without a scaffolding climb. At Banco, it is which process condition deserves intervention. I would bring those constraints into a Foundry object model, build the permitted Actions with the team, and measure adoption against the actual operating outcome. The academic PLM-ERP architecture adds deterministic validation and retrieved engineering context to that approach.';

function normalize(text) {
  return String(text ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function scenarioAnswer(q, context) {
  const state = context.workspaceState || context.state || context;
  const records = state?.objects;
  if (/18[.,]4|pick.path|travel.reduction|golden.zone/.test(q)) {
    const record = records?.usc;
    if (record?.phase === 'complete') return `LOCAL SCENARIO | ${record.travelReductionBadge}. The bins have moved to the golden zone in this session. The historical account remains 1,200 relocated SKUs and >98% cycle-count accuracy maintained during the three-month transition.`;
    if (record?.phase === 'running') return 'LOCAL SCENARIO | Slotting rebalance is running. The bin positions and travel KPI will update when the scene transition completes.';
    return 'The -18.4% pick-path result belongs to the local slotting scenario. Run Trigger Slotting Rebalance to update the bins and scenario KPI. The verified historical outcome is >98% accuracy maintained while 1,200 fast-pick SKUs were relocated.';
  }
  if (/zero.defect|scan.status|scan.result|scan.complete|defects.*detected/.test(q)) {
    const record = records?.lt;
    if (record?.phase === 'complete') return `LOCAL SCENARIO | ${record.scanOutput}. The result is attached to this simulated scan run. The historical engineering capability is automated six-axis ultrasonic inspection with 0.8 mm defect resolution.`;
    if (record?.phase === 'running') return 'LOCAL SCENARIO | The robotic ultrasonic seam scan is running. The scan record will receive its result when the arm sweep finishes.';
    return 'The zero-defect output is the result of the local NDT scenario after its scan completes. The verified history establishes six-axis ultrasonic inspection, 0.8 mm defect resolution, and elimination of dangerous manual scaffolding climbs.';
  }
  if (/rfq.*(?:issued|status)|(?:locked|committed).*opportun|opportun.*(?:locked|committed)|tier.2.rfq/.test(q)) {
    const record = records?.generac;
    if (record?.phase === 'complete') return `LOCAL SCENARIO | ${record.status}. ${record.opportunityBadge}. The session has committed the RFQ workflow state; the annualized sourcing opportunity remains $1,247,538.11.`;
    if (record?.phase === 'running') return 'LOCAL SCENARIO | The Tier 2 RFQ action is running. Its opportunity status will lock when the sourcing transition completes.';
    return 'Execute Sourcing Bridge commits the local RFQ workflow and locks the $1,247,538.11 opportunity badge. It preserves the original quotation amount and adds an auditable object-state transition.';
  }
  if (/what.changed|action.history|session.status|workspace.state/.test(q)) {
    if (!records || !state.history?.length) return 'No scenario action is recorded yet. Execute a sourcing, slotting, or NDT Action to see the object status, KPI, and digital twin change together.';
    return 'LOCAL SCENARIO HISTORY\n' + state.history.map(run => `${run.id} | ${run.title} | ${run.phase.toUpperCase()} | ${run.after}`).join('\n');
  }
  return null;
}

function partAnswer(q) {
  const aliases = [
    ['transformer|xfmr', 'PWR-XFMR-01'],
    ['\\bsic\\b|silicon.carbide|650v', 'MOSFET-SIC-650V'],
    ['film.capacitor|dc.link|bulk.cap', 'CAP-BULK-450V'],
    ['enclosure|heatsink|die.cast', 'ENCL-AL-DIECAST'],
    ['gate.driver|gate.drv', 'MCU-GATE-DRV'],
    ['100v|boost.fet|boost.mosfet', 'CBOM-06'],
    ['real.time.mcu|digital.signal|\\bdsp\\b|\\bmppt\\b', 'CBOM-07'],
    ['\\bmc4\\b|solar.input.connector', 'CBOM-08'],
    ['ac.trunk|drop.connector', 'CBOM-09'],
    ['grid.disconnect|safety.relay|power.relay', 'CBOM-10'],
    ['toroid|boost.inductor|sendust', 'CBOM-11'],
    ['\\brf\\b|transceiver|wireless', 'CBOM-12'],
    ['\\bhall\\b|isolated.current.sensor', 'CBOM-13'],
    ['common.mode|line.choke|line.filter', 'CBOM-14'],
    ['\\bmlcc\\b|\\bx7r\\b|ceramic.capacitor', 'CBOM-15'],
    ['potting|polyurethane|encapsulat', 'CBOM-16'],
    ['flyback|auxiliary.bias', 'CBOM-17'],
    ['gap.pad|thermal.interface|\\btim\\b', 'CBOM-18'],
    ['varistor|\\bmov\\b|surge.protect', 'CBOM-19'],
    ['shunt|precision.resistor', 'CBOM-20']
  ];
  const matches = new Set(cbomLines.filter(line => q.includes(line.id.toLowerCase())).map(line => line.id));
  aliases.filter(([pattern])=>new RegExp(pattern).test(q)).forEach(([,id])=>matches.add(id));
  const lines=cbomLines.filter(line=>matches.has(line.id));
  if(!lines.length)return null;
  const explanations=lines.map(line=>{
    const price=line.baseline===null?'Quotation source pending.':`Quoted baseline $${line.baseline.toFixed(2)} | target $${line.target.toFixed(2)} | variance ${variancePercent(line).toFixed(1)}%.`;
    const details=[line.engineeringFunction,/formula|equation|physics|math|loss|heat/.test(q)?line.governingFormula:null,line.qualificationRationale].filter(Boolean).join('\n');
    return `${line.id} | ${line.name}\n${price}\nStatus: ${line.status}.${details?`\n${details}`:''}`;
  });
  return explanations.join('\n\n')+'\n\nLink each component to its quotation, engineering specification, and qualification Action. Item quotations retain their own basis alongside the aggregate annualized bridge.';
}

export function matchAnswer(text, context = {}) {
  const q = normalize(text);
  if (!q) return 'Ask about Generac sourcing, USC inventory, robotic ultrasonic inspection, Banco brazing, or the academic ontology.';

  if (/ignore.*instruction|system.prompt|reveal.*prompt|invent.*(?:metric|number|result)|make.up.*(?:metric|number|result)/.test(q)) {
    return 'This advisor uses the supplied operational account. It cannot invent metrics, execute enterprise actions, or change its source data.';
  }

  if (/work.authorization|\bcpt\b|\bopt\b|\bvisa\b|sponsor|graduat|start.date|availab|salary|compensation|\bgpa\b|citizenship|contact.detail|phone.number|email.address/.test(q)) {
    return 'The verified briefing data does not include current availability, graduation dates, work authorization, sponsorship requirements, compensation, or personal contact details. Confirm those details directly with Harsh using current records.';
  }

  const scenario = scenarioAnswer(q, context);
  if (scenario) return scenario;
  if (/tanmay|bansal/.test(q)) return 'Harsh supplied Tanmay Bansal as a practitioner reference for this briefing. The operational-memory thesis applied here is concrete: retain linked object state, operating evidence, and Action history so each decision informs the next. A sourcing qualification, slotting move, or scan disposition then becomes reusable context for the next operator. Practitioner reference supplied by Harsh: https://www.linkedin.com/in/tanmaybansal1/';
  if (/dimension|warranty|certif|nema|\bip67\b|ul1741|ieee1547/.test(q)) return `${productSpecification.name}: published dimensions ${productSpecification.publishedDimensions}; ${productSpecification.enclosure}; ${productSpecification.warrantyYears}-year warranty; listed standards ${productSpecification.standards.join(' and ')}. The source sheet does not list IP67. Product specifications come from the Generac sheet and are separate from Harsh's sourcing outcomes.`;
  const part = partAnswer(q);
  if (part) return part;

  const topics = Object.entries(topicPatterns).filter(([, pattern]) => pattern.test(q)).map(([id]) => id);

  if (/what.*(?:not|unverified)|limitation|ground.truth|verified|source|proof|evidence/.test(q) && !topics.length) {
    return 'Source: Harsh\'s confirmed operational account and supplied quotation records, plus the published Generac product specification. Historical outcomes are kept in the experience record. Local Action runs have their own scenario state and history. The architecture work is labeled academic.';
  }

  if (/speech|narrat|\b3d\b|\bcad\b|blender|digital.twin|live.data|real.time|simulat|execute|write.?back|\bchatbot\b|\badvisor\b/.test(q) && !topics.length) {
    return 'Each local Action changes the selected Object, updates a scenario KPI, animates the digital twin, and records the transition. Sourcing issues the scenario RFQ, slotting repositions the fast-pick bins, and NDT sweeps the weld seam. The advisor reads the operating account and current session state synchronously.';
  }

  if (/why.*palantir|why.*(?:strateg|role)|deployment.strateg|\bfdse\b|\bfit\b|motivat|culture|forward.deployed/.test(q) && !topics.length) return fit;

  if (/it\s*[/ -]?\s*ot|operational.memory|compound/.test(q) && !topics.length) {
    return 'The IT/OT boundary is where physical operating conditions and enterprise records diverge. Connect the asset, observation, constraint, owner, and Action in one object model. Operational memory compounds when the next operator can inspect both the changed state and the evidence behind the earlier decision. A thermal exception, relocation, or scan result then becomes reusable operating context.';
  }

  if (/\bsummary\b|summari|overview|all.*experience|background|tell.me.about|walk.*experience/.test(q) && !topics.length) {
    return Object.values(answers).join('\n\n');
  }

  if (/compare|difference|across|connect|common|map.*foundry/.test(q) && topics.length > 1) {
    return topics.map(id => answers[id]).join('\n\n') + '\n\nShared decision pattern: connect the physical object, supporting evidence, operating constraint, responsible owner, and permitted next action.';
  }

  if (/math|formula|equation|calculat|how.*(?:27|12)|percentage|percent|relative|absolute|window|temperature/.test(q) && topics.length) {
    return topics.map(id => {
      const object = objects.find(item => item.id === id);
      return object.name + '\n' + object.formula + '\n\n' + object.boundary;
    }).join('\n\n');
  }

  if (topics.length) return topics.map(id => answers[id]).join('\n\n');

  if (/\bfoundry\b|\baip\b|palantir|deterministic|approval|human.in.the.loop/.test(q)) {
    return answers.ontology + '\n\nThe interface follows an object-context-action pattern: inspect an object, review its evidence and constraints, then select a permitted action. The action simulation keeps that decision history visible.';
  }

  if (/\bcost\b|\bsaving|\bfinancial|\bimpact\b|\broi\b|opportun/.test(q)) return answers.generac;
  if (/\baccuracy\b|relocat|transition/.test(q)) return answers.usc;
  if (/\bsafe|defect|resolution|inspection/.test(q)) return answers.lt;
  if (/quality|risk.priority|process.control/.test(q)) return answers.banco;

  return 'That detail is not established in the verified briefing data. I can explain Generac\'s sourcing bridge, USC\'s slotting transition, L&T\'s ultrasonic robotic inspection, Banco\'s brazing metrics, or the academic PLM-ERP architecture.';
}

export function initBriefingChatbot(options = {}) {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const stream = document.getElementById('chat-stream');
  if (!form || !input || !stream) return { ask: () => {}, dispose: () => {} };

  const scope = new AbortController();

  function appendMessage(sender, content) {
    const row = document.createElement('div');
    row.className = `chat-msg ${sender}`;
    const label = document.createElement('span');
    label.className = 'chat-role';
    label.textContent = sender === 'user' ? 'YOU' : 'OPERATIONS ADVISOR';
    const body = document.createElement('p');
    body.textContent = content;
    row.append(label, body);
    if (sender === 'bot') {
      const source = document.createElement('small');
      source.className = 'chat-source';
      source.textContent = 'SOURCE | Operational record and session context';
      row.append(source);
    }
    stream.append(row);
    stream.scrollTop = stream.scrollHeight;
  }

  function ask(question) {
    const value = String(question ?? '').trim().slice(0, 1500);
    if (!value) return;
    appendMessage('user', value);
    const context = typeof options.getContext === 'function' ? options.getContext() : options.context || {};
    appendMessage('bot', matchAnswer(value, context));
    options.onQuestion?.(value);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value;
    input.value = '';
    ask(question);
  }, { signal: scope.signal });

  document.querySelectorAll('[data-q]').forEach(button => {
    button.addEventListener('click', () => ask(button.dataset.q), { signal: scope.signal });
  });

  return { ask, dispose: () => scope.abort() };
}
