// Use dynamic import for ESM packages
let llama;

// Initialize the LlamaAI client asynchronously
(async () => {
  const LlamaAI = await import('llamaai');
  const apiToken = '';
  llama = new LlamaAI.default(apiToken);
})();

/**
 * Generates a regular expression based on a prompt
 * @returns {Promise<object>} - Object containing success status and the regex or error
 */
async function generateRegex() {
  // Make sure llama is initialized
  if (!llama) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!llama) {
      return { success: false, error: 'LlamaAI client not initialized' };
    }
  }

  try {
    // Create a prompt for regex generation
    const concepts = [
      // "strings that start with 'a' and end with 'b'",
      // "strings that contain 'ab' or 'ba'"
      // "strings that contain 'aa' or 'bb'",
      "strings that ends in a 1"
      // "strings that have an even number of 1s",
      // "strings that have an odd number of bs",
      // "strings that have 'a' as the second character",
      // "strings that have 'a' as the third last character",
      // "strings that have 001 at the start"
    ];

    // Get random concept if no description was provided
    const concept = concepts[Math.floor(Math.random() * concepts.length)];

    // Create a prompt for regex generation with the selected concept
    const prompt = `Generate a single regular expression for: "${concept}".
                    Keep the expression small.
                    The alphabet should be {0, 1} or {a, b}.
                    Use only the following symbols:
                    - The Pipe character | is for alternation (either/or)
                    - The Asterisk character * is for zero or more repetitions
                    - The Plus character + is for one or more repetitions
                    - Parentheses () for grouping
                    The regex should be simple enough for students to convert to a finite automaton.
                    Examples of valid responses: (ab|ba), (aa|bb), (a|b)*
                    Only provide the regular expression pattern with no explanation.`;

    // Call the LlamaAI API with higher temperature for more variety
    const response = await llama.run({
      model: "llama3.1-70b",
      messages: [
        { role: 'system', content: 'You are a regex generation assistant. Respond only with the regex pattern, no explanations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7, // Higher temperature for more variety
      top_p: 0.95,       // Keep some randomness but still coherent
      max_tokens: 20     // Limit token count for concise responses
    });

    // Extract just the regex pattern from the response
    const regexPattern = response.choices[0].message.content.trim();

    return { success: true, regexPattern };
  } catch (error) {
    console.error('Error generating regex:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to generate regex pattern' 
    };
  }
}

// Export the function
module.exports = { generateRegex };