#!/bin/sh

echo "Running em++"
#em++ main.cpp -o cpp_api.js -sEXPORTED_FUNCTIONS=_simulate_regex,_simulate_nfa -sEXPORTED_RUNTIME_METHODS=ccall,cwrap
em++ main.cpp -o cpp_api.js -sWASM=1 -sEXPORTED_FUNCTIONS=_simulate_regex,_simulate_nfa,_regex_vs_dfa,_regex_vs_nfa,_minimized_dfa_difference,_malloc,_free -sEXPORTED_RUNTIME_METHODS=cwrap,ccall -sALLOW_MEMORY_GROWTH=1

echo "Moving files"
mv cpp_api.js cpp_api.wasm web/public/js/


