import { Writable } from "stream";
export interface ISumanDOptions {
    size: number;
    getSharedWritableStream: Writable;
    addWorkerOnExit: true;
    oneTimeOnly: true;
    inheritStdio: true;
}
export declare type ISubsetSumanDOptions = Partial<ISumanDOptions>;
export declare const startSumanD: (projectRoot: string, sumanLibRoot: string, opts: Partial<ISumanDOptions>) => () => void;
declare const $exports: any;
export default $exports;
