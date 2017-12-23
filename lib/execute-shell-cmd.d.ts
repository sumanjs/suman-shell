export interface IOptions {
    commands: Array<string>;
}
export declare const makeExecute: (exec: string, projectRoot: string) => (args: IOptions, cb: Function) => void;
