"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cp = require("child_process");
var v = {
    zsh: null,
    bash: null,
    sh: null
};
Object.keys(v).forEach(function (k) {
    try {
        v[k] = String(cp.execSync("command -v " + k)).trim();
    }
    catch (err) {
    }
});
exports.executables = v;
