#include <iostream>
#include <string>
#include <algorithm>
#include <vector>
#include <queue>
#include <set>
#include <map>
#include <unordered_map>

const char EPSILON = '\0';

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

typedef std::unordered_map<int, std::unordered_map<char, std::vector<int>>> Transitions;

/*
	{state: {symbol: {new states}}}
	e.g. { 0: {'a': {1}, 'b': {0, 1}}, 1: {'a': {2}} }
*/

// Create a Automaton class
class Automaton {
private:
	std::vector<int> states;
	std::vector<char> alphabet;
	Transitions transitions;
	std::vector<int> accept;
	int start;
	bool is_deterministic;
	bool contains_epsilon;

public:
	Automaton()
	{
		is_deterministic = false;
		contains_epsilon = false;
	}

	Automaton(std::vector<int> states, std::vector<char> alphabet,
				Transitions transitions, int start, std::vector<int> accept)
	{
		this->states = states;
		this->alphabet = alphabet;
		this->transitions = transitions;
		this->start = start;
		this->accept = accept;

		is_deterministic = true;
		contains_epsilon = false;
	}

	void add_transition(int from, int to, char symbol)
	{
		transitions[from][symbol].push_back(to);
	}

	bool check_transitions()
	{
		if (is_deterministic) {
			for (int state : states) {
				for (char symbol : alphabet) {
					if (transitions[state].find(symbol) == transitions[state].end()) {
						return false; // Missing transition for state-symbol pair
					}
				}
			}
		}
		return true; // All transitions are valid
	}

	bool accepts(std::string input)
	{
		std::vector<int> currentStates = {start};
		for (char symbol : input) {
			std::vector<int> nextStates;
			for (int state : currentStates) {
				if (transitions[state].find(symbol) != transitions[state].end()) {
					nextStates.insert(nextStates.end(), transitions[state][symbol].begin(), transitions[state][symbol].end());
				}
			}
			if (nextStates.empty()) {
				return false;
			}
			currentStates = nextStates;
		}

		for (int state : currentStates) {
			if (std::find(accept.begin(), accept.end(), state) != accept.end()) {
				return true; // Accepting state reached
			}
		}
		return false;
	}

	Automaton nfa_to_dfa()
	{

		// Example of nfa transitions
		// Transitions transitions = {
		// 	{0, {{'0', {0}}, {'1', {0, 1}}}},
		// 	{1, {{'0', {2}}, {'1', {2}}}},
		// 	{2, {{'0', {3}}, {'1', {3}}}}
		// };

		std::vector<std::vector<int>> dfa_states_list; // Q' Powerset of Q
		std::vector<std::vector<int>> dfa_accept_states; // set of accept states
		std::vector<int> start_set = {start}; // set of start states
		std::vector<int> current_set;

		std::queue<std::vector<int>> worklist; // set of sets.
		worklist.push(start_set);

		while (!worklist.empty()) {
			current_set =  worklist.front();
			worklist.pop();
			dfa_states_list.push_back(current_set);

			// if intersection of current_set and accept is not empty
			for (int state : current_set) {
				if (std::find(accept.begin(), accept.end(), state) != accept.end()) {
					dfa_accept_states.push_back(current_set);
					break;
				}
			}

			for (char symbol : alphabet) {
				std::vector<int> next_set;
				for (int state : current_set) {
					if (transitions[state].find(symbol) != transitions[state].end()) {
						next_set.insert(next_set.end(), transitions[state][symbol].begin(), transitions[state][symbol].end());
					}
				}

				// if next_set not in dfa_states_list
				if (std::find(dfa_states_list.begin(), dfa_states_list.end(), next_set) == dfa_states_list.end()) {
					worklist.push(next_set);
				}
			}
		}

		return Automaton();
	}
};


void simulate_dfa_test()
{
	std::vector<char> alphabet{'a', 'b'};
	std::vector<int> states = {0, 1, 2};
	int start = 0;
	std::vector<int> accept = {2};

	// this automaton accepts the language that contains 'ab'
	Transitions transitions = {
		{0, {{'a', {1}}, {'b', {0}}}},
		{1, {{'a', {1}}, {'b', {2}}}},
		{2, {{'a', {2}}, {'b', {2}}}}
	};

	Automaton automaton(states, alphabet, transitions, start, accept);

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

	Transitions transitions = {
		{0, {{'0', {0}}, {'1', {0, 1}}}},
		{1, {{'0', {2}}, {'1', {2}}}},
		{2, {{'0', {3}}, {'1', {3}}}}
	};

	// Accepts all strings over {0, 1} containing a 1 in the third position from the end
	Automaton nfa(states, alphabet, transitions, start, accept);

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
	simulate_dfa_test();
	simulate_nfa_test();

	return 0;
}
