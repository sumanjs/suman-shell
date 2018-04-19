export interface IExecutables {
  [key: string]: string
}

////////////////////////////////////////

import cp  = require('child_process');

const v = <IExecutables>{
  zsh: null,
  bash: null,
  sh: null
};

Object.keys(v).forEach(function (k) {
  try {
    v[k] = String(cp.execSync(`command -v ${k}`)).trim();
  }
  catch (err) {
  
  }
});

export const executables = v;
