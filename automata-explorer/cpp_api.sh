#!/bin/sh

echo "Running em++"
em++ main.cpp -o cpp_api.js -sEXPORTED_FUNCTIONS=_simulate_regex,_simulate_nfa -sEXPORTED_RUNTIME_METHODS=ccall,cwrap

echo "Moving files"
mv cpp_api.js cpp_api.wasm web/public/js/


