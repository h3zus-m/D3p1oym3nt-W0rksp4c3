// Operational account supplied by Harsh for the operations workspace.
// All financial opportunity figures are annualized quotation comparisons.
export const productSpecification = {
  name: 'Generac PWRmicro PM820',
  dimensions: {lengthMm: 376, widthMm: 255, heightMm: 57},
  publishedDimensions: '376 × 255 × 57 mm (W × H × D)',
  publishedDimensionOrder: 'W × H × D',
  enclosure: 'NEMA Type 6',
  warrantyYears: 25,
  standards: ['UL1741-SB', 'IEEE1547'],
  source: {
    title: 'Generac PWRmicro PM820 specification sheet',
    url: 'https://www.generac.com/globalassets/residential/dealers--installers/generac-installer-programs/solar--battery-installer-support/pwrmicro_specsheet.pdf'
  }
};

export function variancePercent(line) {
  if (!Number.isFinite(line?.baseline) || !Number.isFinite(line?.target) || line.baseline <= 0) return null;
  return (line.target - line.baseline) / line.baseline * 100;
}

const suppliedQuotes = [
  ['PWR-XFMR-01', 'Planar Power Transformer', 14.20, 9.80, 'Negotiation Target'],
  ['MOSFET-SIC-650V', 'Silicon Carbide Power FET (4x)', 22.40, 16.10, 'Dual-Source Req'],
  ['CAP-BULK-450V', 'DC-Link Film Capacitor (2x)', 8.50, 6.20, 'Volume Tier 200k'],
  ['ENCL-AL-DIECAST', 'A380 Aluminum Heatsink Base', 18.50, 13.40, 'Tooling NRE Review'],
  ['MCU-GATE-DRV', 'Isolated Dual Gate Driver IC', 6.80, 4.90, 'Qualified Spec']
];
const priorQuoteSnapshot = [
  {
    "line": 1,
    "name": "100V Low-RDS(on) Power MOSFETs (DC-DC Boost)",
    "subsystem": "Power Silicon",
    "usagePerUnit": 8,
    "annualDemand": 1600000,
    "baselineUnitPrice": 0.62,
    "targetUnitPrice": 0.46,
    "annualBaselineSpend": 992000,
    "annualTargetSpend": 736000,
    "annualizedOpportunity": 256000
  },
  {
    "line": 5,
    "name": "Digital Signal Controller / Real-Time MCU (32-bit DSP)",
    "subsystem": "Control ICs",
    "usagePerUnit": 1,
    "annualDemand": 200000,
    "baselineUnitPrice": 2.4,
    "targetUnitPrice": 1.85,
    "annualBaselineSpend": 480000,
    "annualTargetSpend": 370000,
    "annualizedOpportunity": 110000
  },
  {
    "line": 8,
    "name": "MC4 DC Solar Input Connectors (IP68, Male/Female Pairs)",
    "subsystem": "Interconnect",
    "usagePerUnit": 2,
    "annualDemand": 400000,
    "baselineUnitPrice": 0.78,
    "targetUnitPrice": 0.58,
    "annualBaselineSpend": 312000,
    "annualTargetSpend": 232000,
    "annualizedOpportunity": 80000
  },
  {
    "line": 9,
    "name": "AC Trunk Cable Drop Connector (5-Pin Lockable)",
    "subsystem": "Interconnect",
    "usagePerUnit": 1,
    "annualDemand": 200000,
    "baselineUnitPrice": 1.9,
    "targetUnitPrice": 1.45,
    "annualBaselineSpend": 380000,
    "annualTargetSpend": 290000,
    "annualizedOpportunity": 90000
  },
  {
    "line": 10,
    "name": "Grid Disconnect Safety Power Relay (250VAC 16A)",
    "subsystem": "Electromechanical",
    "usagePerUnit": 2,
    "annualDemand": 400000,
    "baselineUnitPrice": 0.95,
    "targetUnitPrice": 0.72,
    "annualBaselineSpend": 380000,
    "annualTargetSpend": 288000,
    "annualizedOpportunity": 92000
  },
  {
    "line": 11,
    "name": "Toroidal Boost Inductor (Sendust Core)",
    "subsystem": "Magnetics",
    "usagePerUnit": 2,
    "annualDemand": 400000,
    "baselineUnitPrice": 0.82,
    "targetUnitPrice": 0.64,
    "annualBaselineSpend": 328000,
    "annualTargetSpend": 256000,
    "annualizedOpportunity": 72000
  },
  {
    "line": 12,
    "name": "Sub-1GHz / 2.4GHz Mesh Transceiver SoC",
    "subsystem": "RF Comms",
    "usagePerUnit": 1,
    "annualDemand": 200000,
    "baselineUnitPrice": 1.35,
    "targetUnitPrice": 1.05,
    "annualBaselineSpend": 270000,
    "annualTargetSpend": 210000,
    "annualizedOpportunity": 60000
  },
  {
    "line": 13,
    "name": "Isolated Current Sensor IC (Hall Effect)",
    "subsystem": "Sensing",
    "usagePerUnit": 2,
    "annualDemand": 400000,
    "baselineUnitPrice": 0.74,
    "targetUnitPrice": 0.55,
    "annualBaselineSpend": 296000,
    "annualTargetSpend": 220000,
    "annualizedOpportunity": 76000
  },
  {
    "line": 14,
    "name": "Common-Mode AC Line Filter Choke",
    "subsystem": "Filtering",
    "usagePerUnit": 2,
    "annualDemand": 400000,
    "baselineUnitPrice": 0.54,
    "targetUnitPrice": 0.41,
    "annualBaselineSpend": 216000,
    "annualTargetSpend": 164000,
    "annualizedOpportunity": 52000
  },
  {
    "line": 15,
    "name": "High-Voltage Multi-Layer Ceramic Capacitors (MLCC X7R)",
    "subsystem": "Passives",
    "usagePerUnit": 8,
    "annualDemand": 1600000,
    "baselineUnitPrice": 0.12,
    "targetUnitPrice": 0.08,
    "annualBaselineSpend": 192000,
    "annualTargetSpend": 128000,
    "annualizedOpportunity": 64000
  },
  {
    "line": 16,
    "name": "Polyurethane Encapsulating Potting Resin (kg)",
    "subsystem": "Material",
    "usagePerUnit": 0.4,
    "annualDemand": 80000,
    "baselineUnitPrice": 4.8,
    "targetUnitPrice": 3.9,
    "annualBaselineSpend": 384000,
    "annualTargetSpend": 312000,
    "annualizedOpportunity": 72000
  },
  {
    "line": 17,
    "name": "Auxiliary Flyback Bias Power Supply IC",
    "subsystem": "Power ICs",
    "usagePerUnit": 1,
    "annualDemand": 200000,
    "baselineUnitPrice": 0.68,
    "targetUnitPrice": 0.52,
    "annualBaselineSpend": 136000,
    "annualTargetSpend": 104000,
    "annualizedOpportunity": 32000
  },
  {
    "line": 18,
    "name": "High-Thermal-Conductivity Gap Pad (TIM)",
    "subsystem": "Thermal",
    "usagePerUnit": 2,
    "annualDemand": 400000,
    "baselineUnitPrice": 0.32,
    "targetUnitPrice": 0.22,
    "annualBaselineSpend": 128000,
    "annualTargetSpend": 88000,
    "annualizedOpportunity": 40000
  },
  {
    "line": 19,
    "name": "Metal Oxide Varistors (MOV 385V AC Surge Protection)",
    "subsystem": "Protection",
    "usagePerUnit": 4,
    "annualDemand": 800000,
    "baselineUnitPrice": 0.22,
    "targetUnitPrice": 0.16,
    "annualBaselineSpend": 176000,
    "annualTargetSpend": 128000,
    "annualizedOpportunity": 48000
  },
  {
    "line": 20,
    "name": "Precision Shunt Resistor (Current Sense, 1% 3W)",
    "subsystem": "Passives",
    "usagePerUnit": 4,
    "annualDemand": 800000,
    "baselineUnitPrice": 0.18,
    "targetUnitPrice": 0.13,
    "annualBaselineSpend": 144000,
    "annualTargetSpend": 104000,
    "annualizedOpportunity": 40000
  }
];
export const cbomLines = [
  ...suppliedQuotes.map(([id,name,baseline,target,status],index)=>({
    line:index+1,id,partId:id,name,baseline,target,variance:variancePercent({baseline,target}),status,
    volumeTier:index===2?'200k (as supplied)':null,
    unitBasis:'Representative line quote | quantity basis as supplied',
    source:'User-supplied representative quotation line',quoteDataset:'Current supplied quote',
    available:true,usagePerUnit:null,annualDemand:null,quantityUnit:null,
    sourceLine:[3,2,4,7,6][index]
  })),
  ...priorQuoteSnapshot.map((row,index)=>{
    const line=index+6,id='CBOM-'+String(line).padStart(2,'0');
    return {line,id,partId:id,name:row.name,subsystem:row.subsystem,
      baseline:row.baselineUnitPrice,target:row.targetUnitPrice,
      variance:variancePercent({baseline:row.baselineUnitPrice,target:row.targetUnitPrice}),
      status:'Quote Snapshot',volumeTier:null,
      unitBasis:row.line===16?'USD per kg | source snapshot':'USD per piece | source snapshot',
      source:'User-confirmed component quotation snapshot',quoteDataset:'Component quote snapshot',available:true,
      usagePerUnit:row.usagePerUnit,annualDemand:row.annualDemand,quantityUnit:row.line===16?'kg':'pieces',
      sourceLine:row.line,sourceAnnualBaselineSpend:row.annualBaselineSpend,
      sourceAnnualTargetSpend:row.annualTargetSpend,sourceAnnualizedOpportunity:row.annualizedOpportunity
    };
  })
];

const engineeringById = {
  'PWR-XFMR-01': {
    engineeringFunction: 'Transfers switched energy between windings and establishes the required isolation boundary. A planar winding structure reduces profile height.',
    governingFormula: 'Delta B = V * Delta t / (N * Ae) | P_copper ≈ I_rms^2 * R_ac',
    qualificationRationale: 'Review the winding drawing, insulation construction, magnetizing and leakage inductance, saturation margin, and hot-spot temperature under comparable conditions.',
    sourcingRationale: 'Retain drawing revision, tooling ownership, and magnetic test evidence with the supplier quotation before qualifying a lower-cost alternate.',
    engineeringReferences: [{title: 'Ferroxcube planar power transformer design guide', url: 'https://www.ferroxcube.com/zh-TW/download/download/133/'}, {title: 'TI solar microinverter reference design', url: 'https://www.ti.com/tool/TIDM-SOLARUINV'}]
  },
  'MOSFET-SIC-650V': {
    engineeringFunction: 'Controls high-voltage power conversion current. Conduction loss, switching energy, package inductance, and junction temperature determine system behavior.',
    governingFormula: 'P_cond = I_rms^2 * R_DS(on)(T_j) | P_sw = f_sw * (E_on + E_off)',
    qualificationRationale: 'Compare package and pin compatibility, gate-drive requirements, switching at defined operating corners, thermal rise, and protection response.',
    sourcingRationale: 'A 650 V family label is not an alternate approval. Preserve the exact device revision and switch-driver qualification evidence.',
    engineeringReferences: [{title: 'Infineon 650 V SiC power MOSFET family', url: 'https://www.infineon.com/products/power/mosfet/silicon-carbide/650v'}]
  },
  'CAP-BULK-450V': {
    engineeringFunction: 'Buffers energy between power stages and carries DC-link ripple current. ESR and the ripple spectrum determine internal heating.',
    governingFormula: 'E = 0.5 * C * V^2 | P_loss ≈ I_ripple,rms^2 * ESR(f,T)',
    qualificationRationale: 'Compare capacitance tolerance, ESR and ESL, ripple-current capability, humidity and temperature conditions, mounting, and lifetime assumptions.',
    sourcingRationale: 'Attach the quoted volume tier to the same qualified electrical and lifetime specification used by engineering.',
    engineeringReferences: [{title: 'TDK DC-link film capacitor selection', url: 'https://www.tdk-electronics.tdk.com/en/3191478/products/product-catalog/film-capacitors/capacitors-for-dc-link'}]
  },
  'ENCL-AL-DIECAST': {
    engineeringFunction: 'Provides mechanical protection and conducts rejected heat through the interface, casting, and fin structure to the surroundings.',
    governingFormula: 'Delta T = P_loss * R_theta,total | Tooling allocation = eligible NRE / eligible quantity',
    qualificationRationale: 'Review drawing tolerances, fin and mounting geometry, porosity, seal interfaces, corrosion requirements, thermal tests, and assembled-product ingress verification.',
    sourcingRationale: 'Separate piece price, tooling NRE, tooling life, yield, surface finish, inspection, and delivery terms. Material grade alone does not establish Type 6 protection.',
    engineeringReferences: [{title: 'Boyd heat-sink selection guide', url: 'https://info.boydcorp.com/hubfs/Thermal/Air-Cooling/Boyd-How-to-Select-a-Heat-Sink.pdf'}, {title: 'Dynacast precision die-casting guidance', url: 'https://www.dynacast.com/en-gb/resources/article/an-introduction-to-precision-die-casting-frequently-asked-questions'}]
  },
  'MCU-GATE-DRV': {
    engineeringFunction: 'Converts controller commands into switch gate-charge pulses while maintaining the required isolation boundary.',
    governingFormula: 'I_gate ≈ Delta Q_gate / Delta t | P_gate ≈ Q_gate * Delta V_gate * f_sw',
    qualificationRationale: 'Review isolation, CMTI, supply range and sequencing, UVLO, delay matching, dead time, protection, Miller behavior, and the switch-driver-layout combination.',
    sourcingRationale: 'Qualify the driver with its intended switch and PCB layout. Preserve the approved pairing when evaluating a lower quotation.',
    engineeringReferences: [{title: 'Infineon gate drivers for SiC MOSFETs', url: 'https://www.infineon.com/products/power/gate-driver-ics/eicedriver-for-sic-mosfets'}, {title: 'Wolfspeed gate-driver design application note', url: 'https://assets.wolfspeed.com/uploads/2025/06/Wolfspeed_PRD-09301_Gate_Driver_Design_for_SiC_Power_Modules_Application_Note.pdf'}]
  }
};
const additionalEngineering = {
  "CBOM-06": {
    "engineeringFunction": "Switches boost-stage current.",
    "qualificationRationale": "Compare voltage margin, hot on-resistance, gate charge, switching behavior, and thermal performance under the same conditions. Price comparisons should retain the approved driver and package constraints.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "TI boost MOSFET selection",
        "url": "https://www.ti.com/lit/an/snva991a/snva991a.pdf"
      }
    ]
  },
  "CBOM-07": {
    "engineeringFunction": "Executes PWM, sampling, power-stage control, and MPPT algorithms.",
    "qualificationRationale": "Review ADC/PWM timing, computational margin, firmware support, package, and control-loop regression evidence before an alternate is approved.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "TI solar microinverter design",
        "url": "https://www.ti.com/tool/TIDM-SOLARUINV"
      }
    ]
  },
  "CBOM-08": {
    "engineeringFunction": "Carry PV current through a sealed, mechanically retained connection.",
    "qualificationRationale": "Verify the exact mating family, crimp tooling, cable specification, contact resistance, and environmental requirements. A claimed compatible connector is not automatically an approved mixed-brand mating pair.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Stäubli connector mating guidance",
        "url": "https://www.staubli.com/content/dam/ecs/pictures/solar-photovoltaics/RE-Statement-PV-CrossConnection-ProductLiability-EN.pdf"
      }
    ]
  },
  "CBOM-09": {
    "engineeringFunction": "Provides a repeatable installation and power interface.",
    "qualificationRationale": "Review pin assignment, current and voltage ratings, cable termination, locking, touch protection, and ingress performance in the assembled condition.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Phoenix Contact installation connectors",
        "url": "https://www.phoenixcontact.com/assets/97892545-79fa-49d9-8345-f3900a8384c1/epaper/1345531_EN_SG_Installationssyt.pdf"
      }
    ]
  },
  "CBOM-10": {
    "engineeringFunction": "Makes or breaks an electrical path.",
    "qualificationRationale": "Review the actual load type, inrush, contact ratings, electrical life, insulation, and contact-welding failure behavior rather than comparing nominal current alone.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Omron relay application guidance",
        "url": "https://components.omron.com/eu-en/products/basic-knowledge/relays/applications"
      }
    ]
  },
  "CBOM-11": {
    "engineeringFunction": "Stores energy and controls current ripple.",
    "qualificationRationale": "V = L * di/dt; E = 0.5 * L * I^2. Review both saturation current and RMS heating, since they describe different limits; compare core and winding losses at the operating waveform.",
    "governingFormula": "V = L * di/dt | E = 0.5 * L * I^2",
    "engineeringReferences": [
      {
        "title": "Coilcraft power inductor selection",
        "url": "https://www.coilcraft.com/getmedia/d4009ece-69be-49a6-9185-9cbacb65e3aa/Doc469_selecting_inductors.pdf"
      }
    ]
  },
  "CBOM-12": {
    "engineeringFunction": "Supports a radio communication and firmware stack.",
    "qualificationRationale": "Review band, protocol, antenna, regulatory integration, coexistence, and software compatibility. The collected RF quote remains a sourcing-scope record; Generac's product sheet identifies power-line communication for the released PM-820 system.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "TI multiband wireless MCU documentation",
        "url": "https://www.ti.com/product/CC1352R"
      }
    ]
  },
  "CBOM-13": {
    "engineeringFunction": "Converts magnetic field from load current into an isolated measurement signal.",
    "qualificationRationale": "Review current range, offset and temperature drift, bandwidth, transient response, isolation, and reference behavior together with the protection and control requirements.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "TI isolated Hall current sensing",
        "url": "https://www.ti.com/lit/ds/symlink/tmcs1100.pdf"
      }
    ]
  },
  "CBOM-14": {
    "engineeringFunction": "Attenuates common-mode conducted noise at the power interface.",
    "qualificationRationale": "Review common-mode and differential-mode behavior, leakage inductance, current capability, insulation, and measured emissions in the complete filter.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Würth mains-filter application note",
        "url": "https://www.we-online.com/components/media/o109029v410%20AppNotes_ANP015_MainFilterTheLastBarrierInASMPS_EN.pdf"
      }
    ]
  },
  "CBOM-15": {
    "engineeringFunction": "Provides local decoupling or filtering.",
    "qualificationRationale": "Review effective capacitance under DC bias and temperature, voltage margin, package, flex stress, and the circuit's required impedance. Nominal capacitance alone is not an equivalence test.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Murata DC-bias guidance",
        "url": "https://www.murata.com/support/faqs/capacitor/ceramiccapacitor/char/0005"
      }
    ]
  },
  "CBOM-16": {
    "engineeringFunction": "Encapsulates electronics against environmental and mechanical stress.",
    "qualificationRationale": "Review mix ratio, viscosity, cure schedule, adhesion, compliance, dielectric properties, thermal path, and rework constraints using the specific material data. Preserve the quotation's mass unit.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Henkel polyurethane encapsulant",
        "url": "https://next.henkel-adhesives.com/us/en/products/compounds-for-electronics/central-pdp.html/teroson-pu-u333/118764IB.html"
      }
    ]
  },
  "CBOM-17": {
    "engineeringFunction": "Generates bias rails across an isolation barrier.",
    "qualificationRationale": "Review input and output range, regulation, transient response, transformer design, startup, sequencing, current limit, and fault behavior against the gate-driver and controller load requirements.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "TI primary-side regulated flyback documentation",
        "url": "https://www.ti.com/product/LM5180"
      }
    ]
  },
  "CBOM-18": {
    "engineeringFunction": "Bridges a mechanical gap while conducting heat into a spreader or enclosure.",
    "qualificationRationale": "Review thickness, compression, contact pressure, thermal resistance, electrical insulation requirements, and aging. Material conductivity alone does not determine interface performance.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "Boyd thermal interface guidance",
        "url": "https://www.boydcorp.com/about-boyd/resources/technical-papers-and-guides/thermal-interface-materials-for-next-generation-electronics.html"
      }
    ]
  },
  "CBOM-19": {
    "engineeringFunction": "Clamps transient overvoltage.",
    "qualificationRationale": "Review continuous operating voltage, surge waveform and repetition, clamping behavior, energy, aging, and coordinated thermal disconnection. An example manufacturer's ratings are not the PM-820's acceptance limits.",
    "governingFormula": "",
    "engineeringReferences": [
      {
        "title": "TDK ThermoFuse protection guidance",
        "url": "https://www.tdk-electronics.tdk.com/en/374108/tech-library/articles/products-technologies/products-technologies/tdk-releases-new-series-of-varistors-for-overvoltage-protection-and-enhanced-monitoring/2887172"
      }
    ]
  },
  "CBOM-20": {
    "engineeringFunction": "Converts current into a measurable drop: V = I * R; dissipates P = I^2 * R.",
    "qualificationRationale": "Review tolerance, TCR, pulse and power loading, self-heating, and Kelvin sensing layout to preserve measurement accuracy.",
    "governingFormula": "V = I * R | P = I^2 * R",
    "engineeringReferences": [
      {
        "title": "Vishay shunt design considerations",
        "url": "https://www.vishay.com/docs/49159/_power-metal-strip-shunts-current-shunts_pl0005-1801.pdf"
      }
    ]
  }
};
for (const line of cbomLines) Object.assign(line, engineeringById[line.id] || additionalEngineering[line.id] || {});

export const cbomScope = {
  priorityLines: 20,
  suppliedLines: 20,
  currentQuoteLines: 5,
  sourceSnapshotLines: 15,
  sourcePendingLines: 0,
  annualFinishedUnits: 200000,
  aggregateBaseline: 4471763.97,
  aggregateTarget: 3224225.86,
  annualizedOpportunity: 1247538.11,
  note: 'The current five representative quotations and the additional fifteen component quote snapshots are separate quote bases. Keep their unit bases and source demand visible. The historical aggregate annualized bridge remains independently stated; no scaling or forced reconciliation is applied.'
};

export function sortCbomLines(lines, key = 'line', direction = 'asc') {
  const allowed = new Set(['line', 'id', 'name', 'baseline', 'target', 'variance', 'status', 'volumeTier']);
  const sortKey = allowed.has(key) ? key : 'line';
  const sign = direction === 'desc' || direction === -1 ? -1 : 1;
  const valueOf = line => sortKey === 'variance' ? variancePercent(line) : line[sortKey];
  return [...lines].map((line, index) => ({line, index})).sort((left, right) => {
    const a = valueOf(left.line), b = valueOf(right.line);
    const aNull = a === null || a === undefined || (typeof a === 'number' && !Number.isFinite(a));
    const bNull = b === null || b === undefined || (typeof b === 'number' && !Number.isFinite(b));
    if (aNull || bNull) return aNull === bNull ? left.index - right.index : aNull ? 1 : -1;
    const compared = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'en', {numeric: true});
    return compared === 0 ? left.index - right.index : compared * sign;
  }).map(item => item.line);
}

export const objects = [
  {
    id: 'generac',
    name: 'PM820_Microinverter',
    kind: 'Hardware sourcing',
    subtitle: 'Generac | PM-820 | Costed bill of materials',
    headline: '$1,247,538.11',
    description: 'Annualized sourcing opportunity across 20 priority CBOM components at 200,000 finished units. Supplier quotations establish a negotiation and qualification target.',
    decision: 'Target Tier 2 suppliers, validate comparable quotations, and route qualified alternatives for engineering review.',
    metrics: [
      { label: 'Baseline', value: '$4,471,763.97' },
      { label: 'Target quotations', value: '$3,224,225.86' },
      { label: 'Annualized opportunity', value: '$1,247,538.11' },
      { label: 'Selected baseline reduction', value: '27.90%' }
    ],
    properties: [
      ['Priority CBOM components', '20'],
      ['Annual finished units', '200,000'],
      ['Commercial status', 'Quotation opportunity'],
      ['Execution gate', 'Supplier and engineering qualification']
    ],
    links: ['CBOM_Component', 'Supplier_Quotation', 'Qualification_Action'],
    relationships: [
      {
        id: 'generac-cbom', name: 'CBOM_Components', label: '20 Priority Lines', type: 'object-set',
        detail: 'A 20-line sourcing scope combines five current representative quotations with fifteen additional user-confirmed component quote snapshots. Item quotation bases remain separate from the aggregate annualized bridge.',
        properties: [['Priority lines', '20'], ['Current representative quotes', '5'], ['Additional source quote lines', '15']],
        links: ['Supplier_Quotation', 'Part_Qualification'],
        actionId: 'sourcing',
        children: cbomLines.filter(line => line.available).map(line => ({
          id: `part-${line.id}`, name: line.id, label: line.name, type: 'component', partId: line.partId,
          detail: `${line.name} | supplied baseline $${line.baseline.toFixed(2)} | target $${line.target.toFixed(2)} | ${variancePercent(line).toFixed(1)}% variance.`,
          properties: [['Quote status', line.status], ['Volume tier', line.volumeTier || 'Not stated'], ['Quote basis', line.unitBasis], ['Source dataset', line.quoteDataset]],
          links: ['CBOM_Components', 'Supplier_Quotation']
        }))
      },
      {
        id: 'generac-bridge', name: 'Sourcing_Bridge', label: '$1.25M Opportunity', type: 'decision',
        detail: '$4,471,763.97 baseline to $3,224,225.86 target quotations gives a $1,247,538.11 annualized opportunity at 200,000 finished units.',
        properties: [['Annualized opportunity', '$1,247,538.11'], ['Baseline reduction', '27.90%'], ['Commercial state', 'Quotation opportunity']],
        links: ['Supplier_Quotation', 'RFQ_Action'], actionId: 'sourcing'
      },
      {
        id: 'generac-enclosure', name: 'Enclosure_Spec', label: 'Type 6 | 25-Year Warranty', type: 'product-specification', partId: 'ENCL-AL-DIECAST',
        detail: 'Published Generac PM820 product specification: 376 × 255 × 57 mm (W × H × D), NEMA Type 6 enclosure, and 25-year warranty. These are product specifications.',
        properties: [['Published dimensions', productSpecification.publishedDimensions], ['Enclosure', 'NEMA Type 6'], ['Warranty', '25 years']],
        links: ['Published_Product_Sheet'], source: productSpecification.source
      },
      {
        id: 'generac-standards', name: 'Product_Standards', label: 'UL1741-SB | IEEE1547', type: 'product-specification',
        detail: 'The published PM820 product sheet lists UL1741-SB and IEEE1547. The product source does not establish an IP67 rating.',
        properties: [['Listed standard', 'UL1741-SB'], ['Listed standard', 'IEEE1547']],
        links: ['Published_Product_Sheet'], source: productSpecification.source
      }
    ],
    formula: 'Opportunity = $4,471,763.97 - $3,224,225.86\n            = $1,247,538.11 / year\nReduction = $1,247,538.11 / $4,471,763.97 × 100\n          ≈ 27.90%',
    boundary: 'Opportunity is a modeled annualized quotation bridge, not realized or booked savings. The 3D assembly is illustrative and is not a production drawing.'
  },
  {
    id: 'usc',
    name: 'USC_Logistics_DC',
    kind: 'Distribution hub',
    subtitle: 'USC Logistics | Fast-pick slotting',
    headline: '>98%',
    description: 'Inventory cycle-count accuracy maintained across peak fall intake while 1,200 fast-pick SKUs were relocated during a three-month transition.',
    decision: 'Rebalance fast-pick locations for the 45 to 60-day turnover window while preserving cycle-count controls.',
    metrics: [
      { label: 'Cycle-count accuracy', value: '>98%' },
      { label: 'Fast-pick SKUs relocated', value: '1,200' },
      { label: 'Transition', value: '3 months' },
      { label: 'Turnover window', value: '45-60 days' }
    ],
    properties: [
      ['Operating period', 'Peak fall intake'],
      ['Accuracy claim', 'Maintained above 98%'],
      ['Relocation scope', '1,200 fast-pick SKUs'],
      ['Turnover window', '45 to 60 days']
    ],
    links: ['FastPick_SKU', 'Storage_Location', 'CycleCount_Record'],
    relationships: [
      {id: 'usc-fast-pick', name: 'Fast_Pick_Zone', label: '1,200 SKUs', type: 'object-set', detail: '1,200 fast-pick SKUs relocated during a three-month transition across peak fall intake.', properties: [['Relocated SKUs', '1,200'], ['Transition', '3 months']], links: ['FastPick_SKU', 'Storage_Location'], actionId: 'slotting'},
      {id: 'usc-turnover', name: 'Turnover_Window', label: '45-60 Days', type: 'constraint', detail: 'The operating turnover window is 45 to 60 days. The scenario rebalance moves bins into a golden-zone layout.', properties: [['Turnover lower bound', '45 days'], ['Turnover upper bound', '60 days']], links: ['Storage_Location', 'Slotting_Action'], actionId: 'slotting'},
      {id: 'usc-accuracy', name: 'Inventory_Accuracy', label: '>98% Maintained', type: 'control', detail: 'Inventory cycle-count accuracy remained above 98% during peak fall intake and the relocation.', properties: [['Cycle-count accuracy', '>98%'], ['Measurement claim', 'Maintained during transition']], links: ['CycleCount_Record', 'Relocation_Record']}
    ],
    formula: 'Relocation scope = 1,200 fast-pick SKUs\nTransition = 3 months\nTurnover window = 45 to 60 days\nMaintained cycle-count accuracy > 98%',
    boundary: 'The account establishes maintained accuracy during relocation. It does not establish a new before-and-after accuracy gain or a measured travel-time reduction.'
  },
  {
    id: 'lt',
    name: 'LT_Robotic_Weld',
    kind: 'Modular yard',
    subtitle: 'Larsen & Toubro | Offshore tubular inspection',
    headline: '0.8 mm',
    description: 'Automated six-axis robotic ultrasonic weld scanning with 0.8 mm defect resolution, eliminating dangerous manual scaffolding climbs across offshore platform tubulars.',
    decision: 'Dispatch a robotic ultrasonic seam scan and route inspection findings to the responsible engineering reviewer.',
    metrics: [
      { label: 'Defect resolution', value: '0.8 mm' },
      { label: 'Robot configuration', value: '6-axis' },
      { label: 'Inspection method', value: 'Ultrasonic NDT' },
      { label: 'Access intervention', value: 'Scaffolding climbs eliminated' }
    ],
    properties: [
      ['Asset class', 'Offshore platform tubulars'],
      ['Inspection mode', 'Automated robotic scanning'],
      ['Detection claim', '0.8 mm defect resolution'],
      ['Human review', 'Engineering disposition']
    ],
    links: ['Tubular_Asset', 'Weld_Seam', 'Ultrasonic_Scan'],
    displayName: 'LT_Modular_Yard',
    relationships: [
      {id: 'lt-scanner', name: 'Robotic_Scanner', label: '6-Axis Arm', type: 'asset', detail: 'Automated six-axis robotic ultrasonic weld scanning replaces dangerous manual scaffolding climbs across offshore platform tubulars.', properties: [['Robot configuration', '6-axis'], ['Asset context', 'Offshore platform tubulars']], links: ['Tubular_Asset', 'Weld_Seam'], actionId: 'ndt'},
      {id: 'lt-ultrasonic', name: 'Ultrasonic_Head', label: '0.8 mm Resolution', type: 'sensor', detail: 'Reported defect resolution is 0.8 mm. A scan record belongs to its weld seam and engineering review.', properties: [['Defect resolution', '0.8 mm'], ['Method', 'Ultrasonic NDT']], links: ['Weld_Seam', 'Ultrasonic_Scan'], actionId: 'ndt'}
    ],
    formula: 'Inspection = robotic ultrasonic NDT\nRobot configuration = 6-axis\nReported defect resolution = 0.8 mm\nAccess change = manual scaffolding climbs eliminated',
    boundary: 'Resolution is the reported inspection capability. No sensitivity percentage, scan result, sensor frequency, or prototype cost is asserted. The scene illustrates a scan workflow.'
  },
  {
    id: 'banco',
    name: 'Banco_CAB_Brazing',
    kind: 'Controlled atmosphere furnace',
    subtitle: 'Banco Products | CAB process control',
    headline: '12.5%',
    description: 'Relative scrap reduction from 4.8% to 4.2%, with a peak brazing window of 595 ± 3°C and FMEA priority reduced from RPN 288 to 72.',
    decision: 'Prioritize the high-RPN process issue and verify the brazing peak against the 592 to 598°C control window.',
    metrics: [
      { label: 'Scrap rate', value: '4.8% → 4.2%' },
      { label: 'Relative scrap reduction', value: '12.5%' },
      { label: 'Peak temperature window', value: '595 ± 3°C' },
      { label: 'FMEA priority', value: '288 → 72' }
    ],
    properties: [
      ['Process', 'Controlled Atmosphere Brazing'],
      ['Peak lower bound', '592°C'],
      ['Peak upper bound', '598°C'],
      ['Absolute scrap change', '0.6 percentage point reduction']
    ],
    links: ['CAB_Furnace', 'Process_Window', 'FMEA_Risk'],
    displayName: 'Banco_Products',
    relationships: [
      {id: 'banco-furnace', name: 'CAB_Furnace', label: '595 ± 3°C Window', type: 'asset', detail: 'Controlled Atmosphere Brazing peak window: 595 ± 3°C, bounded by 592 and 598°C.', properties: [['Peak setpoint', '595°C'], ['Lower bound', '592°C'], ['Upper bound', '598°C']], links: ['Process_Window', 'FMEA_Risk']},
      {id: 'banco-scrap', name: 'Scrap_Rate', label: '4.8% → 4.2% | -12.5%', type: 'outcome', detail: 'Scrap fell 0.6 percentage point, equivalent to a 12.5% relative reduction. FMEA priority moved from RPN 288 to 72.', properties: [['Before', '4.8%'], ['After', '4.2%'], ['Relative reduction', '12.5%'], ['FMEA priority', '288 → 72']], links: ['Process_Window', 'Quality_Record']}
    ],
    formula: 'Relative scrap reduction = (4.8 - 4.2) / 4.8 × 100\n                         = 12.5%\nAbsolute reduction = 0.6 percentage point\nPeak window = 595 ± 3°C = 592 to 598°C\nRPN = severity × occurrence × detection: 288 → 72',
    boundary: 'RPN is a prioritization score, not a failure probability. The account supports the process window and reported outcomes; it does not isolate the causal contribution of each intervention.'
  },
  {
    id: 'ontology',
    name: 'Enterprise_Ontology',
    kind: 'Academic PLM-ERP bridge',
    subtitle: 'Academic architecture | Object, rule, action',
    headline: 'Deterministic rules',
    description: 'A PostgreSQL object-action ontology links engineering and enterprise context. An MCP server exposes deterministic business-rule validation; Vector RAG retrieves engineering ECO change notes.',
    decision: 'Retrieve the engineering rationale, validate the proposed action against business rules, and preserve an explicit approval gate.',
    metrics: [
      { label: 'Object store', value: 'PostgreSQL' },
      { label: 'Rule interface', value: 'MCP server' },
      { label: 'Engineering context', value: 'Vector RAG' },
      { label: 'Scope', value: 'Academic architecture' }
    ],
    properties: [
      ['System boundary', 'PLM to ERP'],
      ['Data model', 'Object-action ontology'],
      ['Rule execution', 'Deterministic business logic'],
      ['Retrieved context', 'Engineering ECO change notes']
    ],
    links: ['Part_Revision', 'Engineering_Change', 'Validated_Action'],
    displayName: 'Enterprise_Architecture',
    relationships: [
      {id: 'ontology-postgres', name: 'PostgreSQL_Ontology', label: 'Objects & Links', type: 'data-model', detail: 'Academic PostgreSQL object-action ontology connects PLM engineering context and ERP decision state.', properties: [['Object store', 'PostgreSQL'], ['Scope', 'Academic architecture']], links: ['Part_Revision', 'Engineering_Change']},
      {id: 'ontology-mcp', name: 'MCP_Rule_Engine', label: 'Deterministic Logic', type: 'business-logic', detail: 'An MCP server exposes deterministic business-rule validation for proposed actions before an authorized approval gate.', properties: [['Interface', 'MCP server'], ['Rule behavior', 'Deterministic validation']], links: ['Proposed_Action', 'Validated_Action']},
      {id: 'ontology-rag', name: 'Vector_RAG', label: 'ECO Change Notes', type: 'context-retrieval', detail: 'Vector retrieval supplies the engineering rationale behind an ECO. Retrieved context informs a decision while business rules validate the action.', properties: [['Context source', 'Engineering ECO notes'], ['Role', 'Contextual explanation']], links: ['Engineering_Change', 'Retrieved_Context']}
    ],
    formula: 'Engineering note → Vector RAG → contextual explanation\nProposed action → MCP server → deterministic rule validation\nValidated proposal → authorized approval → execution\nObject state + action history → operational memory',
    boundary: 'This is academic architecture, not a claimed production Foundry deployment. MCP exposes tools; application business logic supplies deterministic checks. Retrieved notes do not authorize an action.'
  }
];

export const executiveTourSteps = [
  {
    station: 'generac',
    title: '01 | Sourcing decisions',
    lead: '20 priority CBOM components | $1,247,538.11 annualized opportunity',
    script: 'My work connects physical operations to decisions that teams can execute. At Generac, that meant a clear sourcing question: which components deserve supplier attention? Across 20 priority CBOM components and 200,000 annual units, the selected baseline was $4,471,763.97. Target quotations brought the comparison to $3,224,225.86. The resulting annualized sourcing opportunity was $1,247,538.11, approximately 27.90% of that baseline. This is a quotation bridge rather than booked savings. The operational next step is to target Tier 2 suppliers, validate comparable quotations, and carry qualified alternatives into engineering review. The decision has a measurable scope, an owner, and a qualification gate.',
    deep: 'A sourcing bridge separates commercial potential from implemented benefit. Quote comparability and qualification determine whether an opportunity can become a procurement decision. In this briefing, the action panel records a local simulation; it does not contact suppliers or change an enterprise system.',
    decision: objects[0].decision,
    pills: ['20 CBOM components', '200,000 annual units', '27.90% opportunity']
  },
  {
    station: 'usc',
    title: '02 | Inventory under transition',
    lead: '1,200 fast-pick SKUs relocated | >98% accuracy maintained',
    script: 'At USC Logistics, the operating challenge was to change the physical layout without losing control of inventory during peak fall intake. Over a three-month transition, 1,200 fast-pick SKUs were relocated for a 45 to 60-day turnover window. Inventory cycle-count accuracy remained above 98%. The important distinction is that accuracy was maintained while the operation changed. I would model each SKU, location, relocation, and count record as linked objects. A slotting action then needs to preserve the connection between the physical location and the recorded inventory state. The same discipline applies to a customer deployment: understand the frontline workflow, make the proposed change explicit, and track the control that must remain reliable.',
    deep: 'The verified account provides a relocation scope, a transition period, a turnover window, and a maintained accuracy threshold. It does not provide a before-and-after travel-time study. The simulated rebalance represents a proposed workflow change and preserves the original evidence boundary.',
    decision: objects[1].decision,
    pills: ['3-month transition', '1,200 fast-pick SKUs', '>98% cycle-count accuracy']
  },
  {
    station: 'lt',
    title: '03 | Robotic inspection',
    lead: '6-axis robotic ultrasonic NDT | 0.8 mm defect resolution',
    script: 'At Larsen & Toubro, the physical constraint was access to welds on offshore platform tubulars. The intervention was an automated six-axis robotic ultrasonic weld scanner with 0.8 millimeter defect resolution. It eliminated dangerous manual scaffolding climbs for this inspection work. The operational model links the tubular asset, the weld seam, the robotic scan, and the engineering review. A sensor measurement only becomes useful when someone can identify the affected asset and take the next permitted action. In a deployment, I would start from that inspection and review workflow, then make the data structure serve it. The scanner shown here is an illustrative digital twin; the verified claim is the inspection method, resolution, and access improvement.',
    deep: 'Defect resolution should not be relabeled as detection sensitivity or overall inspection accuracy. The account does not establish either of those percentages. A production workflow would also need scan calibration, coverage evidence, acceptance criteria, and an authorized disposition process before declaring a weld acceptable.',
    decision: objects[2].decision,
    pills: ['6-axis robot', 'Ultrasonic NDT', '0.8 mm defect resolution']
  },
  {
    station: 'banco',
    title: '04 | Process control',
    lead: '595 ± 3°C peak window | Scrap 4.8% to 4.2% | RPN 288 to 72',
    script: 'At Banco Products, the system was a Controlled Atmosphere Brazing furnace. The reported peak control window was 595 degrees Celsius, plus or minus three, which is 592 to 598 degrees. Scrap fell from 4.8% to 4.2%. That is a 0.6 percentage point change and a 12.5% relative reduction. FMEA prioritization moved from an RPN of 288 to 72. Those figures answer different questions: the temperature window defines a process constraint, scrap describes an outcome, and RPN helps prioritize risk. A useful console keeps those meanings visible. It connects an exception to the affected process and the responsible operator, then retains the decision history so the next investigation starts with evidence.',
    deep: 'RPN is severity multiplied by occurrence multiplied by detection rating. It is a prioritization score, not a probability. The reported scrap change does not by itself prove that one isolated intervention caused the whole reduction. Comparable operating conditions and product mix matter when evaluating attribution.',
    decision: objects[3].decision,
    pills: ['12.5% relative scrap reduction', '595 ± 3°C', 'RPN 288 → 72']
  },
  {
    station: 'ontology',
    title: '05 | From evidence to action',
    lead: 'PostgreSQL ontology | MCP rule validation | Vector RAG for ECO notes',
    script: 'My academic architecture connects PLM engineering context to ERP decisions through a PostgreSQL object-action ontology. Vector RAG retrieves engineering change notes to explain context. An MCP server exposes business logic that validates proposed actions deterministically. Retrieval provides context; the rules establish whether an action satisfies the modeled constraints, and an authorized approval gate remains explicit. This is academic work, not a claim of a production Foundry deployment. It reflects the Deployment Strategist discipline I want to pursue: learn the physical workflow, connect the relevant objects, define the decision, and help users act on evidence. Operational memory compounds when the system retains both what changed and why the team chose to change it.',
    deep: 'The IT/OT boundary is where physical conditions and enterprise records can diverge. The proposed object-action model makes those relationships explicit. A Foundry-inspired interface is useful here because it places object context, decision evidence, and available actions together. This briefing demonstrates that pattern using local data and simulated actions.',
    decision: objects[4].decision,
    pills: ['Academic PLM-ERP bridge', 'Deterministic validation', 'Engineering context via RAG']
  }
];
