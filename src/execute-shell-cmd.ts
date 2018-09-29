'use strict';

//core
import * as cp from 'child_process'

//npm
import chalk from 'chalk';

//project
import {log} from './logging';

////////////////////////////////////////////////////////////////////////////

export interface IOptions {
  commands: Array<string>;
  rawCommand?: string;
}

export const makeExecute = function (exec: string, projectRoot: string) {
  
  return function (args: IOptions, cb: Function) {
    
    try {
      if (!args.commands) {
        log.error('no commands issued.');
        return process.nextTick(cb);
      }
      
      const k = cp.spawn(exec, [], {
        cwd: projectRoot
      });
      
      k.once('error', cb as any);
      
      k.stdout.pipe(process.stdout);
      k.stderr.pipe(process.stderr);
      
      k.stdin.write(args.commands.join(' '));
      k.stdin.end('\n');
      
      k.once('exit', cb as any);
    }
    catch (err) {
      log.error(err);
      process.nextTick(cb, null);
    }
    
  }
};

export const makeExecuteBash = function (projectRoot: string) {
  
  return function (args: IOptions, cb: Function) {
    
    try {
      const k = cp.spawn('bash', [], {
        cwd: projectRoot
      });
      
      k.once('error', cb as any);
      
      k.stdout.pipe(process.stdout);
      k.stderr.pipe(process.stderr);
      
      k.stdin.write(args.rawCommand);
      k.stdin.end('\n');
      
      k.once('exit', cb as any);
    }
    catch (err) {
      log.error(err);
      process.nextTick(cb, null);
    }
    
  }
};

export const makeExecuteCommand = function (exec: string, projectRoot: string) {
  
  return function (command: string, cb: Function) {
    
    try {
      
      if (command.length < 1) {
        log.error('no command issued.');
        return process.nextTick(cb);
      }
      
      const k = cp.spawn(exec, [], {
        cwd: projectRoot
      });
      
      k.once('error', cb as any);
      
      k.stdout.pipe(process.stdout);
      k.stderr.pipe(process.stderr);
      
      k.stdin.write(command);
      k.stdin.end('\n');
      
      k.once('exit', cb as any);
    }
    catch (err) {
      log.error(err);
      process.nextTick(cb, null);
    }
    
  }
  
};
