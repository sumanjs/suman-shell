#!/usr/bin/env bash


function xyz {
  echo "${args[@]}"
}

function abc {
    local args=()
    args+=(a)
    args+=(b)
    args+=("$@")
    xyz "${args[@]}"
}


