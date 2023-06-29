import { scaleDiverging } from 'd3-scale'
import paper from 'paper'


export const angleConverter = {
  fromPaper: scaleDiverging()
    .domain([
      -180,
      0,
      180,
    ])
    .range([
      -0.5 * Math.PI,
      Math.PI * 0.5,
      1.5 * Math.PI,
    ]),
  toPaper: (radiansRaw: number) => {
    const pt = new paper.Point({
      // angle: (radiansRaw / Math.PI) * 180 + 270,
      length: 1,
    })

    pt.angleInRadians = radiansRaw - Math.PI * 0.5

    return pt.angle
  },
}
