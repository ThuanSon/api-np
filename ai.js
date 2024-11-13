const language = require('@google-cloud/language');

// Creates a client
const client = new language.LanguageServiceClient();

async function analyzeText(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Analyzes the syntax of the text
  const [result] = await client.analyzeSyntax({ document });
  const tokens = result.tokens;

  tokens.forEach(token => {
    console.log(`${token.text.content}: ${token.partOfSpeech.tag}`);
  });
}

analyzeText('all long black table');
