export interface IOptions {
    commands: Array<string>;
    rawCommand?: string;
}
export declare const makeExecute: (exec: string, projectRoot: string) => (args: IOptions, cb: Function) => void;
export declare const makeExecuteBash: (projectRoot: string) => (args: IOptions, cb: Function) => void;
export declare const makeExecuteCommand: (exec: string, projectRoot: string) => (command: string, cb: Function) => void;
