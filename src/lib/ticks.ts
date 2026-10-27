/** Evenly spaced axis ticks at a round step (1, 2 or 5 x a power of ten), about `target` of them. */


export function niceTicks(min: number, max: number, target = 5) {
  if (max <= min) max = min + 1 // a flat line still needs a range
  const rough = (max - min) / target // the spacing we'd need for exactly `target` ticks
  const magnitude = 10 ** Math.floor(Math.log10(rough)) // e.g. 64 -> 10, 0.14 -> 0.1
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)! // round up to a nice step
  const lo = Math.floor(min / step) * step // start on a tick at or below min
  const hi = Math.ceil(max / step) * step // end on a tick at or above max
  const ticks: number[] = []
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Number(t.toFixed(10))) // toFixed cleans up e
  return { lo, hi, ticks }
}