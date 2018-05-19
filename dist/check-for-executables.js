"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const v = {
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
exports.executables = v;
