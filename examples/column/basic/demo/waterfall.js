import { Waterfall } from '@antv/g2plot';

const data = [
  { type: '日用品', money: 300 },
  { type: '伙食费', money: 900 },
  { type: '交通费', money: 200 },
  { type: '水电费', money: 300 },
  { type: '房租', money: 1200 },
  { type: '商场消费', money: 1000 },
  { type: '应酬交际', money: -2000 },
];

const columnPlot = new Waterfall(document.getElementById('container'), {
  title: {
    visible: true,
    text: '每月收支情况（瀑布图）',
  },
  forceFit: true,
  data,
  padding: 'auto',
  data,
  xField: 'type',
  yField: 'money',
  meta: {
    type: {
      alias: '类别',
    },
    money: {
      alias: '金额',
    },
  },
});

columnPlot.render();
