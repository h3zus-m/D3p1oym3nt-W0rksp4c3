export function assemblyControlState(input) {
  const number=Number(input);
  const value=Number.isFinite(number)?Math.max(0,Math.min(1,number)):0;
  const descriptor=value===0?'SEALED ENCLOSURE':value===1?'EXPANDED CBOM':'PARTIAL EXPANSION';
  const percent=value===0?0:value===1?100:Math.max(1,Math.min(99,Math.round(value*100)));
  return {
    value,
    percent,
    label:`${percent}% [${descriptor}]`,
    buttonLabel:value===0?'Explode Assembly':'Collapse Assembly',
    ariaValueText:`${percent} percent: ${descriptor.toLowerCase()}`
  };
}

export function nextAssemblyTarget(value) {
  return assemblyControlState(value).value===0?1:0;
}
