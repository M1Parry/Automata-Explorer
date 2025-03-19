#include <emscripten.h>
#include <stdio.h>
#include <iostream>
#include <string>
#include <algorithm>
#include <vector>
#include <queue>
#include <set>
#include <map>
#include <unordered_map>
#include <stack>

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
	std::unordered_map<int, std::set<int>> epsilon_transitions;
	int start;
	bool is_deterministic;
	bool contains_epsilon;

	// TODO helper methods to for better code readability

	std::set<int> epsilon_closure(const std::set<int>& state_set)
	{
		std::set<int> closure = state_set;
		std::queue<int> to_explore;

		for (int state : state_set) {
			to_explore.push(state);
		}

		while (!to_explore.empty()) {
			int state = to_explore.front();
			to_explore.pop();

			// Add all states reachable via epsilon transitions
			if (epsilon_transitions.find(state) != epsilon_transitions.end()) {
				for (int next_state : epsilon_transitions[state]) {
					if (closure.insert(next_state).second) {
						to_explore.push(next_state);
					}
				}
			}
		}
		return closure;
	}

public:
	Automaton()
	{
		this->is_deterministic = false;
		this->contains_epsilon = false;
	}

	Automaton(std::vector<int> states, std::vector<char> alphabet,
				int start, std::vector<int> accept, bool is_deterministic)
	{
		this->states = states;
		this->alphabet = alphabet;
		this->start = start;
		this->accept = accept;
		this->is_deterministic = is_deterministic;
		contains_epsilon = false;
	}

	void set_start(int state)
	{
		start = state;
	}

	void add_state(int state)
	{
		states.push_back(state);
	}

	void add_alphabet(char symbol)
	{
		if (std::find(alphabet.begin(), alphabet.end(), symbol) == alphabet.end()) {
			alphabet.push_back(symbol);
		}
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
		if (std::find(states.begin(), states.end(), state) == states.end()) {
			std::cerr << "State does not exist" << std::endl;
			return;
		}

		if (std::find(states.begin(), states.end(), new_state) == states.end()) {
			std::cerr << "New state does not exist" << std::endl;
			return;
		}

		if (std::find(alphabet.begin(), alphabet.end(), symbol) == alphabet.end()) {
			std::cerr << "Symbol does not exist" << std::endl;
			return;
		}

		nfa_transitions[state][symbol].insert(new_state);
	}

	void add_epsilon_transition(int state, int new_state) {
		if (std::find(states.begin(), states.end(), state) == states.end() ||
			std::find(states.begin(), states.end(), new_state) == states.end()) {
			std::cerr << "State does not exist" << std::endl;
			return;
		}
		epsilon_transitions[state].insert(new_state);
		contains_epsilon = true;
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
			// NFA with possible epsilon transitions
			std::set<int> current_states = epsilon_closure({start});
			std::set<int> next_states;

			for (char symbol : input) {
				next_states.clear();
				for (int state : current_states) {
					if (nfa_transitions[state].find(symbol) != nfa_transitions[state].end()) {
						for (int next : nfa_transitions[state][symbol]) {
							next_states.insert(next);
						}
					}
				}
				if (next_states.empty()) {
					return false;
				}
				// Compute epsilon closure of the next states
				current_states = epsilon_closure(next_states);
			}

			for (int state : current_states) {
				if (is_accepting_state(state)) {
					return true;
				}
			}
			return false;
		}
	}

	Automaton nfa_to_dfa() {
		Automaton dfa;
		dfa.alphabet = alphabet;
		dfa.is_deterministic = true;
		dfa.contains_epsilon = false;

		std::vector<std::set<int>> dfa_states;
		std::map<std::set<int>, int> state_to_index; // Maps NFA state sets to DFA state numbers
		std::queue<std::set<int>> worklist;

		std::set<int> start_state = epsilon_closure({start});
		dfa_states.push_back(start_state);
		state_to_index[start_state] = 0;
		worklist.push(start_state);
		dfa.start = 0;

		while (!worklist.empty()) {
			std::set<int> current_state = worklist.front();
			worklist.pop();
			int current_index = state_to_index[current_state];

			for (char symbol : alphabet) {
				std::set<int> next_state;
				// For each NFA state in the current DFA state
				for (int nfa_state : current_state) {
					if (nfa_transitions[nfa_state].find(symbol) != nfa_transitions[nfa_state].end()) {
						next_state.insert(nfa_transitions[nfa_state][symbol].begin(),
										  nfa_transitions[nfa_state][symbol].end());
					}
				}

				if (next_state.empty()) {
					continue;
				}

				// Epsilon closure of next state
				next_state = epsilon_closure(next_state);

				if (state_to_index.find(next_state) == state_to_index.end()) {
					state_to_index[next_state] = dfa_states.size();
					dfa_states.push_back(next_state);
					worklist.push(next_state);
				}

				// Add transition to DFA
				dfa.dfa_transitions[current_index][symbol] = state_to_index[next_state];
			}
		}

		// Set DFA states
		dfa.states.resize(dfa_states.size());
		for (int i = 0; i < dfa_states.size(); i++) {
			dfa.states[i] = i;
		}

		// Set accepting states
		for (int i = 0; i < dfa_states.size(); i++) {
			for (int accept_state : accept) {
				if (dfa_states[i].find(accept_state) != dfa_states[i].end()) {
					dfa.accept.push_back(i);
					break;
				}
			}
		}

		return dfa;
	}

	// Using the Hopcroft algorithm https://en.wikipedia.org/wiki/DFA_minimization
	Automaton minimize_dfa() {
		if (!is_deterministic) {
			return nfa_to_dfa().minimize_dfa();
		}

		// Remove unreachable states
		std::set<int> reachable;
		std::queue<int> queue;
		reachable.insert(start);
		queue.push(start);

		while (!queue.empty()) {
			int current = queue.front();
			queue.pop();

			for (char symbol : alphabet) {
				if (dfa_transitions[current].find(symbol) != dfa_transitions[current].end()) {
					int next = dfa_transitions[current][symbol];
					if (reachable.find(next) == reachable.end()) {
						reachable.insert(next);
						queue.push(next);
					}
				}
			}
		}

		// Partition dfa states
		std::vector<std::set<int>> partition;
		std::set<int> accepting_states;
		std::set<int> non_accepting_states;

		for (int state : states) {
			if (reachable.find(state) != reachable.end()) {
				if (is_accepting_state(state)) {
					accepting_states.insert(state);
				} else {
					non_accepting_states.insert(state);
				}
			}
		}

		if (!accepting_states.empty()) {
			partition.push_back(accepting_states);
		}
		if (!non_accepting_states.empty()) {
			partition.push_back(non_accepting_states);
		}

		bool changed = true;
		while (changed) {
			changed = false;
			std::vector<std::set<int>> new_partition;

			for (auto& group : partition) {
				if (group.size() <= 1) {
					new_partition.push_back(group);
					continue;
				}

				std::map<std::vector<int>, std::set<int>> subgroups;
				for (int state : group) {
					std::vector<int> signature;
					for (char symbol : alphabet) {
						if (dfa_transitions[state].find(symbol) != dfa_transitions[state].end()) {
							int target = dfa_transitions[state][symbol];

							// Find which group the target state belongs to
							for (size_t i = 0; i < partition.size(); i++) {
								if (partition[i].find(target) != partition[i].end()) {
									signature.push_back(i);
									break;
								}
							}
						} else {
							// If no transition, use a special value
							signature.push_back(-1);
						}
					}

					subgroups[signature].insert(state);
				}

				if (subgroups.size() > 1) {
					changed = true;
					for (auto& subgroup : subgroups) {
						new_partition.push_back(subgroup.second);
					}
				} else {
					new_partition.push_back(group);
				}
			}

			partition = new_partition;
		}

		// Construct minimized dfa
		Automaton minimized;
		minimized.is_deterministic = true;
		minimized.contains_epsilon = false;
		minimized.alphabet = alphabet;

		std::map<int, int> state_to_group;
		for (size_t i = 0; i < partition.size(); i++) {
			for (int state : partition[i]) {
				state_to_group[state] = i;
			}
		}

		for (size_t i = 0; i < partition.size(); i++) {
			minimized.add_state(i);
		}

		minimized.set_start(state_to_group[start]);

		for (int state : accept) {
			if (reachable.find(state) != reachable.end()) {
				minimized.add_accept(state_to_group[state]);
			}
		}

		// Add transitions
		for (size_t i = 0; i < partition.size(); i++) {
			int representative = *partition[i].begin();

			for (char symbol : alphabet) {
				if (dfa_transitions[representative].find(symbol) != dfa_transitions[representative].end()) {
					int target = dfa_transitions[representative][symbol];
					int target_group = state_to_group[target];

					minimized.add_dfa_transition(i, symbol, target_group);
				}
			}
		}

		return minimized;
	}

	bool is_equivalent(Automaton& other) {
		if (is_deterministic != other.is_deterministic) {
			std::cerr << "Automata are not of the same type" << std::endl;
			return false;
		}

		if (alphabet != other.alphabet) {
			std::cerr << "Alphabets are not the same" << std::endl;
			return false;
		}

		Automaton dfa1 = minimize_dfa();
		Automaton dfa2 = other.minimize_dfa();

		if (dfa1.states.size() != dfa2.states.size() ||
			dfa1.accept.size() != dfa2.accept.size() ||
			dfa1.start != dfa2.start) {
			return false;
		}

		std::map<int, int> state_mapping;
		for (size_t i = 0; i < dfa1.states.size(); i++) {
			state_mapping[dfa1.states[i]] = dfa2.states[i];
		}

		for (int state : dfa1.states) {
			for (char symbol : dfa1.alphabet) {
				auto dfa1_target = dfa1.dfa_transitions[state].find(symbol);
				if (dfa1_target == dfa1.dfa_transitions[state].end() ||
					dfa2.dfa_transitions[state].find(symbol) == dfa2.dfa_transitions[state].end()) {
					return false;
				}

				if (dfa1_target != dfa1.dfa_transitions[state].end()) {
					if (state_mapping[dfa1_target-> second] != dfa2.dfa_transitions[state][symbol]) {
						return false;
					}
				}
			}
		}

		// Check accept states
		for (int state : dfa1.accept) {
			if (std::find(dfa2.accept.begin(), dfa2.accept.end(), state_mapping[state]) == dfa2.accept.end()) {
				return false;
			}
		}

		return true;
	}

};


class RegularExpression {
private:
	Automaton nfa;
	int state_counter;
	std::string expression;

	std::unordered_map<char, int> precedence = {
		{'|', 0},	// Union
		{'.', 1},	// Concatenation
		{'*', 2},	// Kleene star
		{'+', 2},	// Plus
		{'?', 2}	// Optional
	};

	bool is_operator(char c)
	{
		return precedence.find(c) != precedence.end();
	}

	int new_state() {
		int state = state_counter++;
		nfa.add_state(state);
		return state;
	}

	std::string postfix_expression(const std::string& regex) {
		std::string output;
		std::stack<char> operators;

		for (size_t i = 0; i < regex.length(); i++) {
			char c = regex[i];

			// Inspired by https://www.geeksforgeeks.org/convert-infix-expression-to-postfix-expression/

			// Implicit concatenation
			if (i > 0 && (isalnum(regex[i-1]) || regex[i-1] == ')' || regex[i-1] == '*' ||
				regex[i-1] == '+' || regex[i-1] == '?') && (isalnum(c) || c == '(')) {

				while (!operators.empty() && operators.top() != '(' &&
					precedence[operators.top()] >= precedence['.']) {
					output += operators.top();
					operators.pop();
				}
				operators.push('.');
			}

			if (c == '(') {
				operators.push(c);
			}
			else if (c == ')') {
				while (!operators.empty() && operators.top() != '(') {
					output += operators.top();
					operators.pop();
				}
				if (!operators.empty()) operators.pop();
			}
			else if (is_operator(c)) {
				while (!operators.empty() && operators.top() != '(' &&
						precedence[operators.top()] >= precedence[c]) {
					output += operators.top();
					operators.pop();
				}
				operators.push(c);
			}
			else {
				// Literal character
				output += c;
			}
		}

		// Pop remaining operators
		while (!operators.empty()) {
			output += operators.top();
			operators.pop();
		}

		return output;
	}

	void build_nfa(const std::string& regex) {
		// Inspired by https://swtch.com/~rsc/regexp/regexp1.html
		std::stack<std::pair<int, int>> frag;

		for (char c : regex) {
			if (is_operator(c)) {
				if (c == '.') {
					// Concatenation
					auto f2 = frag.top(); frag.pop();
					auto f1 = frag.top(); frag.pop();
					nfa.add_epsilon_transition(f1.second, f2.first);
					frag.push({f1.first, f2.second});
				}
				else if (c == '|') {
					// Union
					auto f2 = frag.top(); frag.pop();
					auto f1 = frag.top(); frag.pop();
					int start = new_state();
					int end = new_state();
					nfa.add_epsilon_transition(start, f1.first);
					nfa.add_epsilon_transition(start, f2.first);
					nfa.add_epsilon_transition(f1.second, end);
					nfa.add_epsilon_transition(f2.second, end);
					frag.push({start, end});
				}
				else if (c == '*') {
					// Kleene star (zero or more)
					auto f = frag.top(); frag.pop();
					int start = new_state();
					int end = new_state();
					nfa.add_epsilon_transition(start, f.first);
					nfa.add_epsilon_transition(f.second, end);
					nfa.add_epsilon_transition(f.second, f.first);
					nfa.add_epsilon_transition(start, end);
					frag.push({start, end});
				}
				else if (c == '+') {
					// Plus (one or more)
					auto f = frag.top(); frag.pop();
					int start = new_state();
					int end = new_state();
					nfa.add_epsilon_transition(start, f.first);
					nfa.add_epsilon_transition(f.second, end);
					nfa.add_epsilon_transition(f.second, f.first);
					frag.push({start, end});
				}
				else if (c == '?') {
					// Optional (zero or one)
					auto f = frag.top(); frag.pop();
					int start = new_state();
					int end = new_state();
					nfa.add_epsilon_transition(start, f.first);
					nfa.add_epsilon_transition(f.second, end);
					nfa.add_epsilon_transition(start, end);
					frag.push({start, end});
				}
			}
			// literal character
			else {
				int start = new_state();
				int end = new_state();
				nfa.add_alphabet(c);
				nfa.add_nfa_transition(start, c, end);
				frag.push({start, end});
			}
		}

		auto final = frag.top(); frag.pop();
		nfa.add_accept(final.second);
		nfa.set_start(final.first);
	}

public:
	RegularExpression(const std::string& regex) {
		state_counter = 0;
		expression = postfix_expression(regex);
		build_nfa(expression);
	}

	bool accepts(const std::string& input) {
		return nfa.accepts(input);
	}

	Automaton get_nfa() {
		return nfa;
	}

	Automaton get_dfa() {
		return nfa.nfa_to_dfa();
	}

	std::string postfix_expression() {
		return expression;
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

	Automaton automaton(states, alphabet, start, accept, true);

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
	Automaton nfa(states, alphabet, start, accept, false);

	// add transitions
	for (auto transition : transitions) {
		for (auto t : transition.second) {
			for (int state : t.second) {
				nfa.add_nfa_transition(transition.first, t.first, state);
			}
		}
	}

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

void simulate_regex_test() {
	std::string regex = "(a|b)a+";

	RegularExpression re(regex);
	std::string postfix = re.postfix_expression();
	std::cout << "Regex expression: " << regex << std::endl;
	std::cout << "Postfix expression: " << postfix << std::endl;
	Automaton nfa = re.get_nfa();

	std::string input = "aa";

	std::cout << "NFA on input string: " << input << ". Result: ";
	std::cout << nfa.accepts(input) << std::endl;
}

void test_is_equivalent() {
	// example from https://www.geeksforgeeks.org/equivalence-of-f-s-a-finite-state-automata/
	std::vector<char> alphabet = {'c', 'd'};
	std::vector<int> dfa1_states = {0, 1, 2};
	std::vector<int> dfa2_states = {0, 1, 2, 3};
	int start = 0;
	std::vector<int> accept = {0};

	// dfa1
	Automaton dfa1(dfa1_states, alphabet, start, accept, true);
	dfa1.add_dfa_transition(0, 'c', 0);
	dfa1.add_dfa_transition(0, 'd', 1);
	dfa1.add_dfa_transition(1, 'c', 2);
	dfa1.add_dfa_transition(1, 'd', 0);
	dfa1.add_dfa_transition(2, 'c', 1);
	dfa1.add_dfa_transition(2, 'd', 2);

	// dfa2
	Automaton dfa2(dfa2_states, alphabet, start, accept, true);
	dfa2.add_dfa_transition(0, 'c', 0);
	dfa2.add_dfa_transition(0, 'd', 1);
	dfa2.add_dfa_transition(1, 'c', 2);
	dfa2.add_dfa_transition(1, 'd', 0);
	dfa2.add_dfa_transition(2, 'c', 3);
	dfa2.add_dfa_transition(2, 'd', 2);
	dfa2.add_dfa_transition(3, 'c', 2);
	dfa2.add_dfa_transition(3, 'd', 0);

	std::cout << "DFA1 is equivalent to DFA2: " << dfa1.is_equivalent(dfa2) << std::endl;
}

int main(int argc, char *argv[])
{
	test_is_equivalent();
	return 0;
}

// testing out webassembly
extern "C" {
	EMSCRIPTEN_KEEPALIVE
	int simulate_regex(const char* regex, const char* input) {
		std::string regex_str(regex);
		std::string input_str(input);
		RegularExpression rp(regex_str);
		return rp.accepts(input_str);
	}

	EMSCRIPTEN_KEEPALIVE
	int simulate_dfa(int* states, int states_len, char* alphabet, int alphabet_len,
					int start, int* accept, int accept_len,
					int* trans_from, char* trans_symbol, int* trans_to, int trans_len,
					const char* input) {
		std::vector<int> states_vec(states, states + states_len);
		std::vector<char> alphabet_vec(alphabet, alphabet + alphabet_len);
		std::vector<int> accept_vec(accept, accept + accept_len);
		Automaton dfa(states_vec, alphabet_vec, start, accept_vec, true);

		for (int i = 0; i < trans_len; i++) {
			dfa.add_dfa_transition(trans_from[i], trans_symbol[i], trans_to[i]);
		}

		std::string input_str(input);
		return dfa.accepts(input_str) ? 1 : 0;
	}

	EMSCRIPTEN_KEEPALIVE
	int simulate_nfa(int* states, int states_len, char* alphabet, int alphabet_len,
					int start, int* accept, int accept_len,
					int* trans_from, char* trans_symbol, int* trans_to, int trans_len,
					int* epsilon_from, int* epsilon_to, int epsilon_len,
					const char* input) {
		std::vector<int> states_vec(states, states + states_len);
		std::vector<char> alphabet_vec(alphabet, alphabet + alphabet_len);
		std::vector<int> accept_vec(accept, accept + accept_len);
		Automaton nfa(states_vec, alphabet_vec, start, accept_vec, false);

		for (int i = 0; i < trans_len; i++) {
			nfa.add_nfa_transition(trans_from[i], trans_symbol[i], trans_to[i]);
		}
		for (int i = 0; i < epsilon_len; i++) {
			nfa.add_epsilon_transition(epsilon_from[i], epsilon_to[i]);
		}

		std::string input_str(input);
		return nfa.accepts(input_str) ? 1 : 0;
	}
}