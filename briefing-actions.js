// Pure browser scenario state. Historical experience metrics remain in the director.
export const actionObjectIds = {sourcing: 'generac', slotting: 'usc', ndt: 'lt'};

const actionMetadata = {
  sourcing: {title: 'Execute Sourcing Bridge', runningStatus: 'TIER 2 RFQ IN PROGRESS'},
  slotting: {title: 'Trigger Slotting Rebalance', runningStatus: 'SLOTTING REBALANCE IN PROGRESS'},
  ndt: {title: 'Dispatch Robotic NDT Scanner', runningStatus: 'ULTRASONIC SCAN IN PROGRESS'}
};

const baseObject = status => ({status, phase: 'ready', actionCount: 0, simulation: false, kpis: [], lastActionId: null, activeRunId: null});

export function createWorkspaceState() {
  return {
    version: 0,
    sequence: 0,
    simulation: true,
    scope: 'browser-local',
    objects: {
      generac: {
        ...baseObject('QUOTATION OPPORTUNITY'),
        annualizedOpportunity: 1247538.11,
        opportunityStatus: 'OPEN',
        opportunityBadge: 'QUOTATION OPPORTUNITY ($1,247,538.11)',
        rfqStatus: 'NOT ISSUED'
      },
      usc: {
        ...baseObject('BASELINE LAYOUT'),
        maintainedAccuracy: '>98%',
        slottingState: 'BASELINE',
        pickPathTravelReduction: null,
        travelReductionBadge: null
      },
      lt: {
        ...baseObject('SCAN READY'),
        scanStatus: 'READY',
        defectsAboveThreshold: null,
        defectThresholdMm: 0.8,
        scanOutput: null
      },
      banco: {...baseObject('PROCESS WINDOW VERIFIED')},
      ontology: {...baseObject('ACADEMIC ARCHITECTURE')}
    },
    history: []
  };
}

function validate(state, actionId) {
  if (!Object.hasOwn(actionObjectIds, actionId)) throw new RangeError('Unknown workspace action');
  const objectId = actionObjectIds[actionId];
  if (!state?.objects?.[objectId] || !Array.isArray(state.history)) throw new TypeError('A workspace state is required');
  return objectId;
}

export function beginWorkspaceAction(state, actionId) {
  const objectId = validate(state, actionId);
  const next = structuredClone(state);
  const object = next.objects[objectId];
  // A running action remains the same run when a control is pressed twice.
  if (object.phase === 'running' && object.lastActionId === actionId) return next;
  const before = object.status;
  next.version++;
  next.sequence++;
  const runId = `RUN-${String(next.sequence).padStart(4, '0')}`;
  object.phase = 'running';
  object.status = actionMetadata[actionId].runningStatus;
  object.simulation = true;
  object.actionCount++;
  object.lastActionId = actionId;
  object.activeRunId = runId;
  object.kpis = [{label: 'SCENARIO ACTION', value: 'RUNNING', simulation: true}];
  if (actionId === 'ndt') {object.scanStatus = 'RUNNING';object.defectsAboveThreshold = null;object.scanOutput = 'SCAN STATUS: RUNNING';}
  if (actionId === 'slotting') object.slottingState = 'REBALANCING';
  if (actionId === 'sourcing') object.rfqStatus = 'ISSUING';
  next.history.push({
    id: runId,
    sequence: next.sequence,
    actionId,
    objectId,
    title: actionMetadata[actionId].title,
    phase: 'running',
    status: object.status,
    before,
    after: object.status,
    simulation: true,
    source: 'LOCAL SCENARIO',
    scope: 'browser-local'
  });
  return next;
}

export function completeWorkspaceAction(state, actionId) {
  const objectId = validate(state, actionId);
  const next = structuredClone(state);
  const object = next.objects[objectId];
  if (object.phase === 'complete' && object.lastActionId === actionId) return next;
  if (object.phase !== 'running' || object.lastActionId !== actionId) throw new Error('Action must be running before it can complete');
  next.version++;
  object.phase = 'complete';
  object.simulation = true;
  if (actionId === 'sourcing') {
    object.status = 'COMMITTED: TIER 2 RFQ ISSUED';
    object.opportunityStatus = 'LOCKED';
    object.opportunityBadge = 'STATUS: LOCKED ($1,247,538.11)';
    object.rfqStatus = 'ISSUED';
    object.kpis = [
      {label: 'ANNUALIZED OPPORTUNITY', value: '$1,247,538.11', simulation: true},
      {label: 'STATUS', value: 'LOCKED', simulation: true},
      {label: 'TIER 2 RFQ', value: 'ISSUED', simulation: true}
    ];
  }
  if (actionId === 'slotting') {
    object.status = 'REBALANCED: GOLDEN ZONE';
    object.slottingState = 'GOLDEN_ZONE';
    object.pickPathTravelReduction = -18.4;
    object.travelReductionBadge = 'PICK PATH TRAVEL REDUCTION: -18.4% MAINTAINED';
    object.kpis = [
      {label: 'PICK PATH TRAVEL REDUCTION', value: '-18.4% MAINTAINED', simulation: true},
      {label: 'BIN PLACEMENT', value: 'GOLDEN ZONE', simulation: true}
    ];
  }
  if (actionId === 'ndt') {
    object.status = 'COMPLETE: ZERO DEFECTS >0.8 mm DETECTED';
    object.scanStatus = 'COMPLETE';
    object.defectsAboveThreshold = 0;
    object.scanOutput = 'SCAN STATUS: COMPLETE | ZERO DEFECTS >0.8 mm DETECTED';
    object.kpis = [
      {label: 'SCAN STATUS', value: 'COMPLETE', simulation: true},
      {label: 'DEFECTS >0.8 mm', value: 'ZERO DETECTED', simulation: true}
    ];
  }
  const entry = next.history.find(item => item.id === object.activeRunId);
  if (entry) {
    entry.phase = 'complete';
    entry.status = object.status;
    entry.after = object.status;
    entry.scenarioOutput = actionId === 'sourcing' ? object.opportunityBadge : actionId === 'slotting' ? object.travelReductionBadge : object.scanOutput;
  }
  return next;
}

export function applyWorkspaceAction(state, actionId) {
  return completeWorkspaceAction(beginWorkspaceAction(state, actionId), actionId);
}
