// yield for each frame no storage of big data

function* phaserASynch(values, deltas) {
  const props = [];

  // helper: push property safely
  const addProp = (key, target, delta, start) => {
    if (target === undefined) return;
    const d = delta !== undefined ? delta : target >= start ? 1 : -1; // fallback to 1 or -1
    if (d === 0) return; // avoid infinite loop
    props.push([key, target, d, start, false]);
  };

  if (values.translate) {
    addProp('tx', values.translate[0], deltas.translateXDelta, 0);
    addProp('ty', values.translate[1], deltas.translateYDelta, 0);
  }
  if (values.rotate !== undefined) {
    addProp('r', values.rotate, deltas.rotateDelta, 0);
  }
  if (values.scale) {
    addProp('sx', values.scale[0], deltas.scaleXDelta, 1);
    addProp('sy', values.scale[1], deltas.scaleYDelta, 1);
  }
  if (values.skew) {
    addProp('skx', values.skew[0], deltas.skewXDelta, 0);
    addProp('sky', values.skew[1], deltas.skewYDelta, 0);
  }

  const n = props.length;
  let maxSteps = 0;

  for (let i = 0; i < n; i++) {
    const [, target, delta, start] = props[i];
    const steps = Math.ceil(Math.abs((target - start) / delta));
    if (steps > maxSteps) maxSteps = steps;
  }

  for (let step = 0; step <= maxSteps + 1; step++) {
    let snapshot = null;

    for (let i = 0; i < n; i++) {
      const [key, target, delta] = props[i];
      let state = props[i][3];
      let done = props[i][4];

      if (!done) {
        const next = state + delta;

        if ((delta > 0 && next >= target) || (delta < 0 && next <= target)) {
          props[i][3] = target;
          props[i][4] = true;
        } else {
          props[i][3] = next;
        }

        if (!snapshot) snapshot = {};
        snapshot[key] = props[i][3]; //.toFixed(10);
      }
    }

    if (snapshot) yield snapshot;
  }
}

const values0 = {
  translate: [70, 40],
  rotate: 78,
  // scale: [0, 1.45],
  skew: [50, 0] // skewY not given
};
const deltas0 = {
  translateXDelta: 3,
  // translateYDelta: 5,
  rotateDelta: 0.5,
  //scaleXDelta: -0.02,
  scaleYDelta: 0.05,
  skewXDelta: 0.7
  // skewYDelta missing → will default to 1
};

for (const frame of phaserASynch(values0, deltas0)) {
  console.log(frame);
}
