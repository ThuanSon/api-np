const axios = require("axios");
const url = 'https://api.zerogpt.com/api/transform/grammarCheck';

const sendGrammarCheckRequest = async (payload)=> {

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/1',
      'Origin': 'https://www.zerogpt.com',
      'Referer': 'https://www.zerogpt.com/'
    };
  
    try {
      const response = await axios.post('https://api.zerogpt.com/api/transform/grammarCheck', payload, { headers });
  
      return response.data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

module.exports = sendGrammarCheckRequest