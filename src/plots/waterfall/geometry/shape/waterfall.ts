import { Global, registerShape } from '@antv/g2';
import * as _ from '@antv/util';

function getRectPath(points) {
  const path = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (point) {
      const action = i === 0 ? 'M' : 'L';
      path.push([action, point.x, point.y]);
    }
  }
  const first = points[0];
  path.push(['L', first.x, first.y]);
  path.push(['Z']);
  return path;
}

const ShapeUtil = {
  addFillAttrs(attrs, cfg) {
    if (cfg.color) {
      attrs.fill = cfg.color;
    }
    if (_.isNumber(cfg.opacity)) {
      attrs.opacity = attrs.fillOpacity = cfg.opacity;
    }
  },
};

function getFillAttrs(cfg) {
  const defaultAttrs = Global.theme.shape.interval;
  const attrs = _.mix({}, defaultAttrs, cfg.style);
  ShapeUtil.addFillAttrs(attrs, cfg);
  if (cfg.color) {
    attrs.stroke = attrs.stroke || cfg.color;
  }
  return attrs;
}

// @ts-ignore
registerShape('interval', 'waterfall', {
  draw(cfg, container: any) {
    const fillAttrs = getFillAttrs(cfg);
    let rectPath = getRectPath(cfg.points);
    rectPath = this.parsePath(rectPath);
    // 1. 区域
    const interval = container.addShape('path', {
      attrs: _.mix(fillAttrs, {
        path: rectPath,
      }),
    });
    const leaderLine = _.get(cfg.style, 'leaderLine');
    if (leaderLine && leaderLine.visible) {
      const lineStyle = leaderLine.style || {};
      // 2. 虚线连线
      if (cfg.nextPoints) {
        let linkPath = [
          ['M', cfg.points[2].x, cfg.points[2].y],
          ['L', cfg.nextPoints[0].x, cfg.nextPoints[0].y],
        ];
        linkPath = this.parsePath(linkPath);
        container.addShape('path', {
          attrs: {
            path: linkPath,
            stroke: '#d3d3d3',
            lineDash: [4, 2],
            lineWidth: 1,
            ...lineStyle,
          },
        });
      }
    }
    // // 3. 添加截断标记
    // if (_.get(cfg.style, 'cutdown')) {
    //   const points = cfg.points;
    //   let cutDownLine = [
    //     ["M", points[0].x, Math.min(points[0].y + 0.045, (points[0].y + points[2].y) / 2.4)],
    //     // 因为截断在0.125左右
    //     ["L", points[2].x, 0.095],
    //     // ["L", points[2].x, Math.min(points[0].y + 0.110, 0.095)],
    //     // ["M", points[0].x, Math.min(points[0].y + 0.045, (points[0].y + points[2].y) / 2.4)],
    //     // ["L", points[2].x, Math.min(points[0].y + 0.085, (points[0].y + points[2].y) / 1.6)],
    //   ];
    //   cutDownLine = this.parsePath(cutDownLine);
    //   container.addShape("path", {
    //     attrs: {
    //       path: cutDownLine,
    //       stroke: "#fff",
    //       lineDash: null, lineWidth: 4
    //     }
    //   });
    // }
    return interval;
  },
});
