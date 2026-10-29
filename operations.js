const catalog = {
  sourcing: {objectId:'generac',title:'Execute Sourcing Bridge',checks:['20 priority CBOM components in scope','Annual basis: 200,000 units','Quotation bridge arithmetic validated'],before:'QUOTATION OPPORTUNITY',after:'COMMITTED: TIER 2 RFQ ISSUED',beforeLabel:'Object state before',afterLabel:'Scenario state after',note:'Locks the $1,247,538.11 annualized opportunity in this session, issues a simulated Tier 2 RFQ, and pulses the assembly. Supplier qualification and commercial awards remain distinct business steps.',scenarioOutput:'STATUS: LOCKED ($1,247,538.11)'},
  slotting: {objectId:'usc',title:'Trigger Slotting Rebalance',checks:['1,200 fast-pick SKUs in scope','Turnover window: 45 to 60 days','Maintained cycle-count accuracy: >98%'],before:'BASELINE LAYOUT',after:'REBALANCED: GOLDEN ZONE',beforeLabel:'Object state before',afterLabel:'Scenario state after',note:'Moves the scene bins into the golden zone and updates the scenario pick-path KPI to -18.4%. The verified historical record remains 1,200 relocated SKUs, a three-month transition, and >98% accuracy maintained.',scenarioOutput:'PICK PATH TRAVEL REDUCTION: -18.4% MAINTAINED'},
  ndt: {objectId:'lt',title:'Dispatch Robotic NDT Scanner',checks:['Automated 6-axis inspection method','Defect resolution: 0.8 mm','Offshore tubular weld context linked'],before:'SCAN READY',after:'SCAN COMPLETE',beforeLabel:'Object state before',afterLabel:'Scenario state after',note:'Sweeps the robotic arm along the weld seam with an ultrasonic pulse. The local scenario returns zero defects above 0.8 mm; this is a simulated scan result.',scenarioOutput:'SCAN STATUS: COMPLETE | ZERO DEFECTS >0.8 mm DETECTED'}
};
export function createActionPreview(id) {
  if (!Object.hasOwn(catalog,id)) throw new RangeError('Unknown action');
  return {...catalog[id],checks:catalog[id].checks.map(label=>({label,passed:true})),simulation:true};
}
export function executeAction(id) {
  const preview=createActionPreview(id);
  if (!preview.checks.every(check=>check.passed)) throw new Error('Action inputs do not satisfy the scenario criteria');
  return {...preview,status:'simulated',scope:'browser-local'};
}
