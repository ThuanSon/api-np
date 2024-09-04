const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

const PORT = 3001;

// MySQL connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // Replace with your MySQL username
    password: '',  // Replace with your MySQL password
    database: 'np'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL database np');
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/:word', async (req, res) => {
    let resArr = [];
    let { word } = req.params ?? "";  // Extract 'word' parameter from request
    console.log("content", word);
    let wordArr = word.split(" ");
    console.log("array", wordArr);
    
    const sqlQuery = 'SELECT * FROM words WHERE word = ?';
    
    try {
        // Use Promise.all to handle all async operations
        await Promise.all(wordArr.map(async (item) => {
            if (item === 'favicon.ico') {
                return;
            }

            // Query the database
            const [results] = await db.promise().query(sqlQuery, [item]);

            if (results.length === 0) {
                // Fetch from external API if not found in the database
                const externalData = await axios.get(`https://dictionaryapi.com/api/v3/references/learners/json/${item}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`);
                const response = externalData?.data;
                
                if (response?.length > 0) {
                    const wordString = response?.[1]?.hwi?.hw;
                    const wordType = response?.[1]?.fl;
                    resArr.push({ word: wordString, type: wordType, source: 'external' });
                }
            } else {
                resArr.push({ ...results[0], source: 'database' });
            }
        }));

        // Send the response with the accumulated results
        res.json(resArr);

    } catch (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).send('Error executing query');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});