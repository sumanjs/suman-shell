# Suman-D

## This project uses Vorpal, and this project is dormant
## Vorpal is in process of migrating to version 2, so let's use Vorpal later, when it's stable again

## You may be looking for the suman-daemon project instead

This project was executed like so:

```javascript

import {startSumanD, ISubsetSumanDOptions} from 'suman-d';

export const run = function (projectRoot: string, sumanLibRoot: string, opts: ISubsetSumanDOptions) {

  const fn = startSumanD(projectRoot, sumanLibRoot, opts || {});

};


```


and at the CLI

```javascript
 NODE_PATH=${NEW_NODE_PATH} PATH=${NEW_PATH} SUMAN_EXTRANEOUS_EXECUTABLE=yes node "${X}/cli.js" --suman-d $@
```
