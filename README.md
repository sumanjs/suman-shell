<p>

# Suman-Shell [![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome)

<p>

### A CLI tool for running tests faster and more conveniently

## Usage

Run `$ suman` without any arguments, and it will drop you into this interactive CLI tool.
To avoid dropping into suman-shell (this tool), simply use

<br>

`$ suman --`  or `$ suman --default`

<br>

These commands will run `suman` agains the default test configuration given by `suman.conf.js` in your project.

<br>
If no input is received after 25 seconds, suman-shell will automatically be exited, returning you to your prior
terminal session.


## What it do

Suman-Shell uses a process pool to run tests more quickly, primarily by pre-loading dependencies from node_modules.

1. The `run` command option will execute tests, given a relative or absolute path to a test script.

2. The `find` command option will give you a list of runnable test scripts in your project, and you can use the drop down menu to pick which one you want to run.

3. Execute bash, zsh, sh scripts, using `suman> bash "ls -a"` or `suman>zsh "x y z"`
