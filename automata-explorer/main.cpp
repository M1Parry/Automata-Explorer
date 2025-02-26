#include <iostream>
#include <string>
#include <algorithm>
#include <vector>
#include <queue>
#include <set>
#include <map>
#include <unordered_map>

#define EPSILON = '\u03B5';

/*
Finite Automata is a 5-tuple (Q, Sigma, delta, q_0, F)
	Q: finite set (states)
	Sigma: finite set (alphabet)
	delta: Q x Sigma -> Q (transition function)
	q_0: initial state
	F: set of accepting states

Deterministic Finite Automata (DFA)
	- For each state q and symbol a, there is exactly one transition
	- delta: Q x Sigma -> Q
	- delta(q, a) = q'

Non-deterministic Finite Automata (NFA)
	- For each state q and symbol a, there may be multiple transitions
	- delta: Q x Sigma -> P(Q) where P(Q) is the power set of Q
	- delta(q, a) = {q1, q2, ...}
*/

typedef std::unordered_map<int, std::unordered_map<char, int>> Dfa_transitions;
typedef std::unordered_map<int, std::unordered_map<char, std::set<int>>> Nfa_transitions;

// Create a Automaton class
class Automaton {
private:
	std::vector<int> states;
	std::vector<char> alphabet;
	std::vector<int> accept;
	Dfa_transitions dfa_transitions;
	Nfa_transitions nfa_transitions;

	int start;
	bool is_deterministic;
	bool contains_epsilon;

	// TODO helper methods to for better code readability

public:
	Automaton()
	{
		is_deterministic = false;
		contains_epsilon = false;
	}

	Automaton(std::vector<int> states, std::vector<char> alphabet, int start, std::vector<int> accept)
	{
		this->states = states;
		this->alphabet = alphabet;
		this->start = start;
		this->accept = accept;

		Nfa_transitions transitions = {
			{0, {{'0', {0}}, {'1', {0, 1}}}},
			{1, {{'0', {2}}, {'1', {2}}}},
			{2, {{'0', {3}}, {'1', {3}}}}
		};

		nfa_transitions = transitions;

		is_deterministic = false;
		contains_epsilon = false;
	}

	void add_state(int state)
	{
		states.push_back(state);
	}

	void add_alphabet(char symbol)
	{
		alphabet.push_back(symbol);
	}

	void add_accept(int state)
	{
		accept.push_back(state);
	}

	void add_dfa_transition(int state, char symbol, int new_state)
	{
		// check if state and new_state exists, if not return error
		if (std::find(states.begin(), states.end(), state) == states.end()) {
			std::cerr << "State does not exist" << std::endl;
			return;
		}

		if (std::find(states.begin(), states.end(), new_state) == states.end()) {
			std::cerr << "New state does not exist" << std::endl;
			return;
		}

		// check if symbol exists, if not return error
		if (std::find(alphabet.begin(), alphabet.end(), symbol) == alphabet.end()) {
			std::cerr << "Symbol does not exist" << std::endl;
			return;
		}

		// check if transition already exists, if so return error
		if (dfa_transitions[state].find(symbol) != dfa_transitions[state].end()) {
			std::cerr << "Transition already exists" << std::endl;
			return;
		}

		dfa_transitions[state][symbol] = new_state;
	}

	void add_nfa_transition(int state, char symbol, int new_state)
	{
		// check if state and new_state exists, if not return error
		if (std::find(states.begin(), states.end(), state) == states.end()) {
			std::cerr << "State does not exist" << std::endl;
			return;
		}

		if (std::find(states.begin(), states.end(), new_state) == states.end()) {
			std::cerr << "New state does not exist" << std::endl;
			return;
		}

		// check if symbol exists, if not return error
		if (std::find(alphabet.begin(), alphabet.end(), symbol) == alphabet.end()) {
			std::cerr << "Symbol does not exist" << std::endl;
			return;
		}

		// check if transition already exists, if so return error
		if (nfa_transitions[state].find(symbol) != nfa_transitions[state].end()) {
			std::cerr << "Transition already exists" << std::endl;
			return;
		}

		nfa_transitions[state][symbol].insert(new_state);
	}

	bool check_transitions()
	{
		if (is_deterministic) {
			for (int state : states) {
				for (char symbol : alphabet) {
					if (dfa_transitions[state].find(symbol) == dfa_transitions[state].end()) {
						return false;
					}
				}
			}
		}
		return true; // All transitions are valid
	}

	bool is_accepting_state(int state)
	{
		if (std::find(accept.begin(), accept.end(), state) != accept.end()) {
			return true;
		}
		return false;
	}

	bool accepts(std::string input)
	{
		// Inspired by Algorithm 7 and 13 from "Automata Theory: An Algorithmic Approach" by Javier Esparza and Michael Blondin.
		// dfa
		if (is_deterministic) {
			int current_state = start;
			for (char symbol : input) {
				if (dfa_transitions[current_state].find(symbol) == dfa_transitions[current_state].end()) {
					return false;
				}
				current_state = dfa_transitions[current_state][symbol];
			}
			return is_accepting_state(current_state);
		} else {
			// nfa
			std::vector<int> currentStates = {start};
			std::vector<int> nextStates;
			for (char symbol : input) {
				nextStates.clear();
				for (int state : currentStates) {
					if (nfa_transitions[state].find(symbol) != nfa_transitions[state].end()) {
						nextStates.insert(nextStates.end(), nfa_transitions[state][symbol].begin(), nfa_transitions[state][symbol].end());
					}
				}
				if (nextStates.empty()) {
					return false;
				}
				currentStates = nextStates;
			}

			for (int state : currentStates) {
				if (is_accepting_state(state)) {
					return true;
				}
			}
		}
		return false;
	}

	Automaton nfa_to_dfa()
	{
		// Inspired by Algorithm 1 from "Automata Theory: An Algorithmic Approach" by Javier Esparza and Michael Blondin.
		std::vector<std::set<int>> dfa_states;
		std::queue<std::set<int>> worklist;
		std::set<int> start_state = {start};
		dfa_states.push_back(start_state);
		worklist.push(start_state);

		while (!worklist.empty()) {
			std::set<int> current_state = worklist.front();
			worklist.pop();

			for (char symbol : alphabet) {
				std::set<int> next_state;
				for (int state : current_state) {
					if (nfa_transitions[state].find(symbol) != nfa_transitions[state].end()) {
						next_state.insert(nfa_transitions[state][symbol].begin(), nfa_transitions[state][symbol].end());
					}
				}

				if (next_state.empty()) {
					continue;
				}

				if (std::find(dfa_states.begin(), dfa_states.end(), next_state) == dfa_states.end()) {
					dfa_states.push_back(next_state);
					worklist.push(next_state);
				}
			}
		}

		// Create DFA transitions
		for (int i = 0; i < dfa_states.size(); i++) {
			std::set<int> current_state = dfa_states[i];
			for (char symbol : alphabet) {
				std::set<int> next_state;
				for (int state : current_state) {
					if (nfa_transitions[state].find(symbol) != nfa_transitions[state].end()) {
						next_state.insert(nfa_transitions[state][symbol].begin(), nfa_transitions[state][symbol].end());
					}
				}

				if (next_state.empty()) {
					continue;
				}

				if (std::find(dfa_states.begin(), dfa_states.end(), next_state) == dfa_states.end()) {
					dfa_states.push_back(next_state);
				}

				Dfa_transitions new_dfa_transitions;
				new_dfa_transitions[i][symbol] = std::find(dfa_states.begin(), dfa_states.end(), next_state) - dfa_states.begin();
			}
		}

		Automaton dfa;
		dfa.states = std::vector<int>(dfa_states.size());
		for (int i = 0; i < dfa_states.size(); i++) {
			dfa.states[i] = i;
		}
		dfa.alphabet = alphabet;
		dfa.start = 0;
		dfa.accept = std::vector<int>();
		for (int i = 0; i < dfa_states.size(); i++) {
			if (std::find(dfa_states[i].begin(), dfa_states[i].end(), accept[0]) != dfa_states[i].end()) {
				dfa.accept.push_back(i);
			}
		}

		dfa.is_deterministic = true;
		dfa.contains_epsilon = false;

		return dfa;
	}
};


void simulate_dfa_test()
{
	std::vector<char> alphabet{'a', 'b'};
	std::vector<int> states = {0, 1, 2};
	int start = 0;
	std::vector<int> accept = {2};

	// this automaton accepts the language that contains 'ab'
	Dfa_transitions transitions = {
		{0, {{'a', 1}, {'b', 0}}},
		{1, {{'a', 1}, {'b', 2}}},
		{2, {{'a', 2}, {'b', 2}}}
	};

	Automaton automaton(states, alphabet, start, accept);

	for (auto transition : transitions) {
		for (auto t : transition.second) {
			automaton.add_dfa_transition(transition.first, t.first, t.second);
		}
	}

	std::string input = "ab";
	std::cout << "DFA on input string: " << input << ". Result: ";
	std::cout << automaton.accepts(input) << std::endl;
}

void simulate_nfa_test()
{
	std::vector<char> alphabet{'0', '1'};
	std::vector<int> states = {0, 1, 2, 3};
	int start = 0;
	std::vector<int> accept = {3};

	Nfa_transitions transitions = {
		{0, {{'0', {0}}, {'1', {0, 1}}}},
		{1, {{'0', {2}}, {'1', {2}}}},
		{2, {{'0', {3}}, {'1', {3}}}}
	};

	// Accepts all strings over {0, 1} containing a 1 in the third position from the end
	Automaton nfa(states, alphabet, start, accept);

	std::string input = "000100";
	std::string fail = "0001000";

	std::cout << "NFA on input string: " << input << ". Result: ";
	std::cout << nfa.accepts(input) << std::endl;

	std::cout << "NFA on input string: " << fail << ". Result: ";
	std::cout << nfa.accepts(fail) << std::endl;

	Automaton dfa = nfa.nfa_to_dfa();
	std::cout << "NFA -> DFA. Input string: " << input << ". Result: ";
	std::cout << dfa.accepts(input) << std::endl;

	std::cout << "NFA -> DFA. Input string: " << fail << ". Result: ";
	std::cout << dfa.accepts(fail) << std::endl;
}

void simulate_epsilon_nfa_test()
{
}

int main(int argc, char *argv[])
{
	// simulate_dfa_test();
	simulate_nfa_test();

	return 0;
}
