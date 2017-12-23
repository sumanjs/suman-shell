import * as cp from 'child_process'
import {log} from './logging';

export interface IOptions {
  commands: Array<string>
}

export const makeExecute = function (exec: string, projectRoot: string) {
  
  return function (args: IOptions, cb: Function) {
    
    if (!args.commands) {
      log.error('no commands issued.');
      return process.nextTick(cb);
    }
    
    const k = cp.spawn(exec);
    k.stdout.pipe(process.stdout);
    k.stderr.pipe(process.stderr);
    
    k.stdin.write(args.commands.join(' '));
    k.stdin.end('\n');
    
    k.once('exit', cb as any);
    
  }
  
};
