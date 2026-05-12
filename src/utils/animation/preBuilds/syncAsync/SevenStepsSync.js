function* phaserSync(values, commonDelta = 0) {
  const props = [];

  // collect props safely
  if (values.translate) {
    if (values.translate[0] !== undefined)
      props.push(['tx', values.translate[0], 0]);
    if (values.translate[1] !== undefined)
      props.push(['ty', values.translate[1], 0]);
  }
  if (values.rotate !== undefined) props.push(['r', values.rotate, 0]);
  if (values.scale) {
    if (values.scale[0] !== undefined) props.push(['sx', values.scale[0], 1]);
    if (values.scale[1] !== undefined) props.push(['sy', values.scale[1], 1]);
  }
  if (values.skew) {
    if (values.skew[0] !== undefined) props.push(['skx', values.skew[0], 0]);
    if (values.skew[1] !== undefined) props.push(['sky', values.skew[1], 0]);
  }

  // precompute distances
  let maxDistance = 0;
  const distances = new Array(props.length);
  for (let i = 0; i < props.length; i++) {
    const d = Math.abs(props[i][1] - props[i][2]);
    distances[i] = d;
    if (d > maxDistance) maxDistance = d;
  }

  // steps + increments
  let steps;
  const increments = new Array(props.length);
  if (commonDelta) {
    steps = Math.ceil(maxDistance / Math.abs(commonDelta));
    for (let i = 0; i < props.length; i++) {
      const [_, target, start] = props[i];
      const dir = target >= start ? 1 : -1;
      increments[i] = dir * Math.abs(commonDelta);
    }
  } else {
    steps = maxDistance || 1;
    for (let i = 0; i < props.length; i++) {
      increments[i] = (props[i][1] - props[i][2]) / steps;
    }
  }

  // init state in plain array
  const state = props.map((p) => p[2]);

  // simulation, yield instead of storing
  for (let step = 0; step <= steps; step++) {
    const snapshot = {};
    for (let i = 0; i < props.length; i++) {
      if (step === steps) {
        state[i] = props[i][1];
      } else {
        state[i] += increments[i];
      }
      snapshot[props[i][0]] = +state[i].toFixed(10);
    }
    yield snapshot; // ✅ generate frame on the fly
  }
}

console.log('sync, auto delta');
for (const frame of phaserSync({
  translate: [70, -40],
  rotate: 78,
  scale: [0.7, 1.45],
  skew: [60, -30]
})) {
  console.log(frame);
}

console.log('++++++++++++++++++++++++');

console.log('sync, common delta = 5');
for (const frame of phaserSync({ translate: [70, -40], rotate: 78 }, 5)) {
  console.log(frame);
}
