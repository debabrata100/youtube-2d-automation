export const illustrationTokens={
  background:{deep:'#020416',navy:'#070a27',violet:'#2c1c66',atmosphere:'#177b95'},
  star:{core:'#fffbe1',hot:'#ffe37b',mid:'#ffaf38',edge:'#f26a2e',shadow:'#c94437'},
  rock:{light:'#f2b078',mid:'#d97a62',shadow:'#633a50',deep:'#241b3c'},
  cool:{light:'#b9fff2',mid:'#53cfcd',shadow:'#1a4c7d',rim:'#69e7f2'},
  text:{primary:'#f7f5ff',accent:'#7de2e8'},
  lightDirection:{x:-.55,y:-.84},
} as const;

export type IllustrationPalette=typeof illustrationTokens;
