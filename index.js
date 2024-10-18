const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");
const askCohere = require("./cohere");
const parse = require("./textNodeGenerator");

const app = express();
app.use(cors());

const PORT = 3001;

// MySQL connection configuration
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "", // Replace with your MySQL password
  database: "np",
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.stack);
    return;
  }
  console.log("Connected to MySQL database np");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Handle favicon.ico requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/:word", async (req, res) => {
  let { word } = req.params ?? ""; // Extract 'word' parameter from request
  // console.log("content", word);
  let wordArr = word.split(" ");
  // console.log(wordArr);
  //tach tu, cum tu

  let arr = [];
  let arrResult = [];
  let wordTemp;
  let arr_QA = wordArr;
  wordArr.forEach((element, index) => {
    /**
     * Tach PRE-DET
     */

    //kiểm tra có phải exclamatory
    if (element === "what") {
      if (index + 1 < wordArr.length) {
        if (["a", "an"].includes(wordArr[index + 1])) {
          const combined = element + " " + wordArr[index + 1];
          arrResult.push(combined);
          console.log(arrResult);
          wordArr.splice(index, 2);
        }
      }
    }
    if (element.includes("'s")) {
      wordTemp = element;
      wordArr[index] = "'s";
    }

    // const queryType = `SELECT expandType FROM words WHERE name = "${element}"`;

    // db.query(queryType, (error, results) => {
    //   if (error) {
    //     console.error("Error executing query", error);
    //     return;
    //   }
    //   if (results.length > 0 && results[0].expandType === "pre-DET") {
    //     arrResult.push(element);
    //   }

    //   if (results.length > 0 && results[0].expandType === "DET") {
    //     arrResult.push(element);
    //   }
    // });

    /**
     * Tach QA
     */

    if (element === "of") {
      for (let i = index; i >= 0; i--) {
        arr.push(wordArr[i]);
        arrResult.splice(i, 1);
      }
      arr.reverse();
    }
  });
  let wordString = "";
  const getStringQA = () => {
    for (let i = 0; i < arr.toString().length; i++) {
      wordString += arr.toString()[i].replace(",", " ");
    }
    return wordString;
  };
  arrResult.unshift(getStringQA());
  !arrResult[0] ? arrResult.shift() : arrResult;
  arrResult = [...arrResult, ...wordArr];
  // console.log(arrResult);

  const sqlQuery = "SELECT * FROM words WHERE name = ?";

  try {
    const resArr = Array(arrResult.length); // Mảng tạm để giữ kết quả

    await Promise.all(
      arrResult.map(async (item, index) => {
        // Query the database
        const [results] = await db.promise().query(sqlQuery, [item]);
        if (results.length === 0) {
          // Fetch from external API if not found in the database
          const externalData = await axios.get(
            `https://dictionaryapi.com/api/v3/references/learners/json/${item}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
          );
          const response = externalData?.data;

          if (response?.length > 0) {
            const wordString = item.toLocaleLowerCase();
            const wordType = response?.[0]?.fl;
            let position = 100;
            let kind = null;
            if (wordType === "adjective") {
              kind = await askCohere(wordString);
              const arrKind = [
                "opinion",
                "size",
                "age",
                "shape",
                "color",
                "origin",
                "material",
                "purpose",
              ];
              for (let i = 0; i < arrKind.length; i++) {
                if (arrKind[i] === kind) {
                  position = i + 1;
                  break;
                }
              }
            }
            console.log(kind);
            const insertToDb = `INSERT INTO words (name, type, kind,position) VALUES ('${wordString}', '${wordType}','${kind}','${position}')`;
            const insertResult = await db.promise().query(insertToDb);
            if (insertResult) {
              console.log("successful!");
            } else {
              console.log("failed!");
            }

            resArr[index] = {
              id: null,
              name: wordString,
              type: wordType,
              expandType: null,
              kind: kind,
              position: position,
              status: null,
              source: "external",
            };
          }
        } else {
          const possessiveS = results.find((item) => item.name === "'s");
          if (possessiveS) {
            possessiveS.name = wordTemp;
          }
          resArr[index] = { ...results[0], source: "database" };
        }
      })
    );
    // console.log(resArr);

    res.json(parse(resArr));
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).send("Error executing query");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
