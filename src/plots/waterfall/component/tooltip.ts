import { VALUE_FIELD } from '../layer';
import * as _ from '@antv/util';

export const generateTooltip = (title, items) => {
  const item = items ? items[0] : {};
  const _origin = _.get(item, 'point._origin', {});
  let diff = 0;
  if (_.isArray(_origin[VALUE_FIELD])) {
    diff = _origin[VALUE_FIELD][1] - _origin[VALUE_FIELD][0];
  } else {
    diff = _origin[VALUE_FIELD];
  }
  const htmlContent = `
    <div class="g2-tooltip">
      <div class="g2-tooltip-title">
        <span class="item-display-name" style="color: rgba(0, 0, 0, 0.85); font-weight:500;">${title}</span>
      </div>
      <ul class="g2-tooltip-list">
        <li class="g2-tooltip-list-item">
          <span class="g2-tooltip-marker" style="background-color:${item.color};"></span>
          <span class="g2-tooltip-value"">
          <span class="item-display-name" style="margin-right:12px;">累计</span>
          <span class="item-value" style="float:right;font-weight:500;">${diff}</span>
          </span>
        </li>
      </ul>
    </div>`;
  return htmlContent;
};
