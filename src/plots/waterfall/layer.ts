import * as _ from '@antv/util';
import { registerPlotType } from '../../base/global';
import './geometry/shape/waterfall';
import { LayerConfig } from '../../base/layer';
import { ElementOption, IStyleConfig, DataItem, Label } from '../../interface/config';
import ViewLayer, { ViewConfig } from '../../base/view-layer';
import { extractScale } from '../../util/scale';
import { DataPointType } from '@antv/g2/lib/interface';
import { AttributeCfg } from '@antv/attr';
import { getComponent } from '../../components/factory';
import * as EventParser from './event';
import './component/label/waterfall-label';
import { generateTooltip } from './component/tooltip';

interface WaterfallStyle {}

const G2_GEOM_MAP = {
  waterfall: 'interval',
};

const PLOT_GEOM_MAP = {
  interval: 'waterfall',
};

export const VALUE_FIELD = '$$value$$';
const INDEX_FIELD = '$$index$$';

export interface WaterfallViewConfig extends ViewConfig {
  showTotal?: {
    visible: boolean;
    label: string;
  };
  leaderLine?: {
    visible: boolean;
    style: {
      stroke?: string;
      lineWidth?: number;
      lineDash?: number[];
    };
  };
  color?:
    | string
    | string[]
    | ((type: string, value: number | null, values: number | number[], index: number) => string);
  waterfallStyle?: WaterfallStyle | ((...args: any[]) => WaterfallStyle);
}

export interface WaterfallLayerConfig extends WaterfallViewConfig, LayerConfig {}

export default class WaterfallLayer extends ViewLayer<WaterfallLayerConfig> {
  public waterfall;
  public type: string = 'watarfall';

  public static getDefaultOptions(): Partial<WaterfallLayerConfig> {
    return _.deepMix({}, super.getDefaultOptions(), {
      legend: {
        visible: false,
        position: 'bottom',
      },
      label: {
        visible: true,
        adjustPosition: true,
      },
      leaderLine: {
        visible: true,
      },
      showTotal: {
        visible: true,
        label: '总计值',
      },
      waterfallStyle: {
        /** 默认无描边 */
        lineWidth: 0,
      },
      tooltip: {
        visible: true,
        shared: true,
        crosshairs: {
          type: 'rect',
        },
        useHtml: true,
        htmlContent: generateTooltip,
      },
    });
  }

  protected geometryParser(dim, type) {
    if (dim === 'g2') {
      return G2_GEOM_MAP[type];
    }
    return PLOT_GEOM_MAP[type];
  }

  protected addGeometry() {
    const options = this.options;
    const waterfall: ElementOption = {
      type: 'interval',
      position: {
        fields: [options.xField, VALUE_FIELD],
      },
      shape: {
        values: ['waterfall'],
      },
    };
    if (options.label) {
      waterfall.label = this.extractLabel();
    }
    waterfall.style = this._parseStyle();
    waterfall.color = this._parseColor();
    this.waterfall = waterfall;
    this.setConfig('element', waterfall);
  }

  protected processData(originData?: DataItem[]) {
    const plotData = [];
    const xField = this.options.xField;
    const yField = this.options.yField;
    _.map(originData, (dataItem, idx: number) => {
      let value: any = dataItem[yField];
      if (idx > 0) {
        const prevValue = plotData[idx - 1][VALUE_FIELD];
        if (_.isArray(prevValue)) {
          value = [prevValue[1], dataItem[yField] + prevValue[1]];
        } else {
          value = [prevValue, dataItem[yField] + prevValue];
        }
      }
      plotData.push({
        ...dataItem,
        [VALUE_FIELD]: value,
        [INDEX_FIELD]: idx,
      });
    });
    if (this.options.showTotal && this.options.showTotal.visible) {
      const values = _.map(originData, (o) => o[yField]);
      const totalValue = _.reduce(values, (p: number, n: number) => p + n, 0);
      plotData.push({
        [xField]: this.options.showTotal.label,
        [yField]: null,
        [VALUE_FIELD]: [totalValue, 0],
        [INDEX_FIELD]: plotData.length,
      });
    }
    return plotData;
  }

  protected scale() {
    const { options } = this;
    const scales = {};
    /** 配置x-scale */
    scales[options.xField] = { type: 'cat' };
    if (_.has(options, 'xAxis')) {
      extractScale(scales[options.xField], options.xAxis);
    }
    /** 配置y-scale */
    scales[options.yField] = {};
    if (_.has(options, 'yAxis')) {
      extractScale(scales[options.yField], options.yAxis);
    }
    this.setConfig('scales', scales);
    super.scale();
  }

  protected coord() {}
  protected animation() {}
  protected annotation() {}

  protected parseEvents(eventParser) {
    super.parseEvents(EventParser);
  }

  protected extractLabel() {
    const options = this.options;
    const label = _.deepMix({}, options.label as Label);
    if (label.visible === false) {
      return false;
    }
    const labelConfig = getComponent('label', {
      plot: this,
      labelType: 'waterfall',
      fields: [options.yField],
      ...label,
    });
    return labelConfig;
  }

  /** 牵引线的样式注入到style中 */
  private _parseStyle(): IStyleConfig {
    const style = this.options.waterfallStyle;
    const leaderLine = this.options.leaderLine;
    const config: DataPointType = {};
    if (_.isFunction(style)) {
      config.callback = (...args) => {
        return Object.assign({}, style(...args), { leaderLine });
      };
    } else {
      config.cfg = { ...style, leaderLine };
    }

    return config;
  }

  private _parseColor(): AttributeCfg {
    const options = this.options;
    const { xField, yField } = this.options;
    const config: any = {
      fields: [xField, yField, VALUE_FIELD, INDEX_FIELD],
    };
    if (_.isFunction(options.color)) {
      config.callback = options.color;
    } else if (_.isObject(options.color)) {
      config.callback = (d) => options.color[d];
    } else {
      let risingColor = '#f4664a';
      let fallingColor = '#30bf78';
      let totalColor = 'rgba(0, 0, 0, 0.25)';
      if (_.isString(options.color)) {
        risingColor = fallingColor = totalColor = options.color;
      } else if (_.isArray(options.color)) {
        risingColor = options.color[0];
        fallingColor = options.color[1] || risingColor;
        totalColor = options.color[2];
      }
      config.callback = (type, value, values: number | number[], index: number) => {
        if (index === this.options.data.length) {
          return totalColor || (values[0] >= 0 ? risingColor : fallingColor);
        }
        return (_.isArray(values) ? values[1] - values[0] : values) >= 0 ? risingColor : fallingColor;
      };
    }
    return config as AttributeCfg;
  }
}

registerPlotType('waterfall', WaterfallLayer);
