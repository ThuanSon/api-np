const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const axios = require("axios");
const askCohere = require("./cohere");
const parse = require("./textNodeGenerator");
const pluralize = require('pluralize');

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
  // res.send("Hello World!");
});

// Handle favicon.ico requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/:word", async (req, res) => {
  let { word } = req.params ?? "";
  let wordArr = word.split(" ");
  let count = null;
  let arrWordGroup = []; //QA word group
  let arrResult = []; //output
  let wordTemp = null; //lưu word tạm thời
  let wordStringQA = ""; //output QA word group
  let originalWord = null;
  const PREDET = {
    type: "pre-DET",
    words: ["all", "half", "both", "double"],
  };
  const DET = [
    {
      type: "ART",
      words: ["a", "an", "the"],
    },
    {
      type: "DEM",
      words: ["this", "that", "these", "those"],
    },
    {
      type: "Q",
      words: [
        "some",
        "any",
        "no",
        "each",
        "every",
        "either",
        "neither",
        "nor",
        "a few",
        "a little",
      ],
    },
    {
      type: "PossA",
      words: ["my", "your", "its", "her", "his", "their", "our"],
    },
    {
      type: ["PossPropN", "PossCommN"],
      words: ["'s"],
    },
    {
      type: "exclamatory^",
      words: ["what a", "what an"],
    },
    {
      type: "interrogative",
      words: ["which"],
    },
  ];

  const handleRestrict = async (element, index) => {
    const query = `SELECT type FROM words WHERE name = ?`;

    try {
      const [result] = await db.promise().query(query, element);

      if (result.length > 0 && result[0].type === "adverb") {
        const obj = {
          id: 0,
          name: element
        };
        arrResult.push(obj);

        return true;
      } else {
        const response = await axios.get(
          `https://dictionaryapi.com/api/v3/references/learners/json/${element}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
        );

        if (response?.data?.[0]?.fl === "adverb") {
          // Nếu API trả về kết quả là "adverb"
          let name = wordArr[0].toLowerCase();
          const obj = {
            id: 0,
            name: name,
          };
          arrResult.push(obj); // Thêm vào arrResult

          // Sau đó thêm từ vào cơ sở dữ liệu
          const insertQuery = `INSERT INTO words (name, type) VALUES (?, ?)`;
          await db
            .promise()
            .query(insertQuery, [name, response?.data?.[0]?.fl]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error handling restriction:", error);
    }
  };

  const handlePreDet = (element, index) => {
    if (PREDET.words.includes(element)) {
      const obj = {
        id: index,
        name: element,
      };
      arrResult.push(obj);
      return true;
    }
    return false;
  };

  const handleDet = async (element, index) => {
    if (DET.find((det) => det.words.includes(element))) {
      const obj = {
        id: index,
        name: element,
      };
      arrResult.push(obj);
      return true;
    } else if (element.includes("'s")) {
      const obj = {
        id: index,
        name: "'s",
        originalWord: element
      };
      arrResult.push(obj);
      return true;
    }
    return false;
  };

  const handleAdj = async (element, index) => {
    const query = `SELECT type, kind, position FROM words WHERE name = ?`;

    try {
      // Truy vấn từ cơ sở dữ liệu
      const [result] = await db.promise().query(query, element);

      if (result.length > 0 && result[0].type === "adjective") {
        // Nếu từ đã có trong cơ sở dữ liệu và là "adjective"
        const obj = {
          id: index,
          name: element,
        };
        arrResult.push(obj);
        return true;
        // Thêm vào arrResult
      } else {
        // Nếu từ chưa có trong cơ sở dữ liệu, gọi API từ điển
        const response = await axios.get(
          `https://dictionaryapi.com/api/v3/references/learners/json/${element}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
        );

        const wordType = response?.data?.[0]?.fl;

        if (wordType === "adjective") {
          // Nếu API trả về kết quả là "adjective", gọi API Cohere để xác định loại (kind)
          const kind = await askCohere(element);
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
          let position = 100;
          for (let i = 0; i < arrKind.length; i++) {
            if (arrKind[i] === kind) {
              position = i + 1;
              break;
            }
          }

          const obj = {
            id: index,
            name: element,
          };
          arrResult.push(obj);

          const insertQuery = `INSERT INTO words (name, type, kind, position) VALUES (?, ?, ?, ?)`;
          await db
            .promise()
            .query(insertQuery, [element, wordType, kind, position]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error handling adjective:", error);
    }
  };

  const handleNoun = async (element, index) => {
    const query = `SELECT type FROM words WHERE name = ?`;

    try {
      convertElement = pluralize.singular(element);
      // Kiểm tra trong cơ sở dữ liệu
      const [result] = await db.promise().query(query, convertElement);

      if (result.length > 0 && result[0].type === "noun") {
        // Nếu từ đã có trong cơ sở dữ liệu và là danh từ
        const obj = {
          id: index,
          name: convertElement,
          originalWord: element
        };
        arrResult.push(obj);
        return true;
      } else {
        // Nếu từ chưa có trong cơ sở dữ liệu, gọi API từ điển
        const response = await axios.get(
          `https://dictionaryapi.com/api/v3/references/learners/json/${convertElement}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
        );

        const wordType = response?.data?.[0]?.fl;
        if (wordType === "noun") {
          // Nếu API trả về kết quả là "noun"
          const obj = {
            id: index,
            name: convertElement,
            originalWord: element
          };
          arrResult.push(obj);

          // Thêm từ vào cơ sở dữ liệu
          const insertQuery = `INSERT INTO words (name, type) VALUES (?, ?)`;
          await db.promise().query(insertQuery, [convertElement, wordType]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error handling noun:", error);
    }
  };


  for (let index = 0; index < wordArr.length; index++) {
    const element = wordArr[index];

    const handledRestrict = await handleRestrict(element, index);
    if (handledRestrict) {
      continue;
    }

    const handledPreDet = handlePreDet(element, index);
    if (handledPreDet) {
      continue;
    }

    const handledDet = await handleDet(element, index);
    if (handledDet) {
      continue;
    }

    const handledAdj = await handleAdj(element, index);
    if (handledAdj) {
      continue;
    }
    const handledNoun = await handleNoun(element, index);
    if (handledNoun) {
      continue;
    }
  }
  console.log(arrResult);

  //kiểm tra có phải exclamatory
  const handleExclamatory = (wordArr, element, index) => {
    if (element.toLocaleLowerCase() === "what") {
      if (index + 1 < wordArr.length) {
        if (["a", "an"].includes(wordArr[index + 1])) {
          const combined = element + " " + wordArr[index + 1];
          const obj = {
            id: index,
            name: combined,
          };
          arrResult.push(obj);
          wordArr.splice(index, 2);
        }
      }
    }
  };
  /**
   * tach QA word group
   */
  const handleQAWordGroup = (wordArr, element, index) => {
    if (element === "of") {
      for (let i = index; i >= 0; i--) {
        arrWordGroup.push(wordArr[i]);
        wordArr.splice(i, 1);
      }
      arrWordGroup.reverse();
    }
  };

  const handleCompN = (wordArr, element, index) => {
    if (element.includes("-")) {
      let arrComp = element.split("-");
      wordArr.splice(index, 1);
      arrComp.forEach((element, i) => {
        const obj = {
          id: index + i,
          name: element,
        };
        arrResult.push(obj);
      });
    }
  };

  const getStringQA = () => {
    for (let i = 0; i < arrWordGroup.toString().length; i++) {
      wordStringQA += arrWordGroup.toString()[i].replace(",", " ");
    }
    return wordStringQA;
  };
  arrResult.unshift(getStringQA());
  !arrResult[0] ? arrResult.shift() : arrResult;

  // arrResult = [...arrResult, ...wordArr];
  const sqlQuery = "SELECT * FROM words WHERE name = ?";

  try {
    const resArr = []; // Mảng tạm để giữ kết quả
    // console.log(wordArr);
    // Sử dụng Promise.all để chờ các truy vấn và API call
    await Promise.all(
      arrResult.map(async (item, index) => {
        const [results] = await db.promise().query(sqlQuery, item?.name);
        if (results.length > 0) {
          let original = item?.originalWord;
          const possessiveS = results.find((word) => word.name === "'s");
          if (possessiveS) {
            // possessiveS.name = original; 
            possessiveS.name = item?.originalWord;
          }
          resArr[index] = { ...results[0], original, source: "database" };
        }
      })
    );
    // res.json(resArr);
    // Trả kết quả về client
    res.json(parse(resArr));
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).send("Error executing query");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
