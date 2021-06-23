import { COLORtoHSLAObject } from './utils';

export default [
  'transparent',
  'black',
  '#cc0000',
  '#ee00ee',
  '#ff5e00',
  '#00ee00',
  '#11dddd',
  '#ffbb11',
  '#ffbbaa',
  'white'
].map(color => COLORtoHSLAObject(color)).sort((a, b) => {
  return a.b - b.b;
});
