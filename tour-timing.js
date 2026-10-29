export const durationsFor = mode => [65,60,55,60,60].map(t => t * (mode === 10 ? 2 : 1));
export function advanceTimeline(state, seconds, durations) {
  if (!state.playing) return {...state};
  let {index,elapsed} = state;
  elapsed += Math.max(0,seconds);
  while(elapsed >= durations[index]) {
    if(index === durations.length-1) return {index,elapsed:durations[index],playing:false,complete:true};
    elapsed -= durations[index++];
  }
  return {index,elapsed,playing:true,complete:false};
}
export const totalElapsed = (state,durations) => durations.slice(0,state.index).reduce((a,b)=>a+b,0) + state.elapsed;
