require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const askCohere = require("./cohere");
const parse = require("./textNodeGenerator");
const pluralize = require('pluralize');
const textToNumber = require('text-to-number');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require('./database/db');
const sendGrammarCheckRequest = require('./spellcehck');
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Handle favicon.ico requests
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/:word", async (req, res) => {
  let { word } = req.params ?? "";
  let checkedWord;
  let checksame;
  if (!word.includes('-')) {
    const payload = {
      earlyStopping: true,
      maxWordsPercentage: 0.15,
      numBeams: 5,
      sample: true,
      string: word,
      style: 'text',
      temperature: 1,
      tone: 'standard',
      topK: 50,
      topP: 1,
      wsId: process.env.ZERO_KEY
      // 6938f57a-4958-43a5-801b-7552bec8a92d
    };
    let checkRes = await sendGrammarCheckRequest(payload)
    checkedWord = checkRes?.data.message.toLowerCase().replace('.', '') === 'program operating in realtime, and no channel exists' ? 'fail to check spell' : checkRes?.data.message.toLowerCase().replace('.', ''); // the boy
    console.log(word); // the boy
    console.log(checkedWord);
    checksame = checkedWord?.includes(word);
    if (!checksame && checkedWord !== 'fail to check spell') {
      // let arr = word.split(" ");
      word = checkedWord.replace(',', '');
    }
  }

  let wordArr = word.split(" ");
  // wordArr = wordArr.map(word => word.toLowerCase());
  let count = null;
  let arrWordGroup = []; //QA word group
  let arrResult = []; //output
  let wordTemp = null; //lưu word tạm thời
  let wordStringQA = ""; //output QA word group
  let originalWord = null;
  let foundQA = false;
  let arrComp = [];
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
        "a few",// loi
        "a little",// loi
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

  // const handleQA = async (wordArr) => {
  //   wordArr.forEach((element, index) => {


  //   })
  // }
  const handleRestrict = async (element, index) => {
    const query = `SELECT type FROM words WHERE name = ?`;

    try {
      const [result] = await db.promise().query(query, element);

      if (result.length > 0 && result[0].type === "adverb") {
        const obj = {
          id: index,
          name: element,
          originalWord: element
        };
        arrResult.push(obj);

        return true;
      } else {
        const response = await axios.get(
          `https://dictionaryapi.com/api/v3/references/learners/json/${element}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
        );

        if (response?.data?.[0]?.fl === "adverb") {
          // Nếu API trả về kết quả là "adverb"
          let name = wordArr[0].toLocaleLowerCase();
          const obj = {
            id: index,
            name: element,
            originalWord: element
          };
          arrResult.push(obj); // Thêm vào arrResult

          // Sau đó thêm từ vào cơ sở dữ liệu
          const insertQuery = `INSERT INTO words (name, type) VALUES (?, ?)`;
          await db
            .promise()
            .query(insertQuery, [element, response?.data?.[0]?.fl]);
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
        originalWord: element
      };
      arrResult.push(obj);
      return true;
    }
    return false;
  };

  const handleDet = async (element, index) => {
    if (["few", "little"].includes(wordArr[index + 1])) {
      element = element + ' ' + wordArr[index + 1];
      wordArr.splice(1, index + 1);
    }
    if (DET.find((det) => det.words.includes(element))) {
      const obj = {
        id: index,
        name: element,
        originalWord: element
      };
      arrResult.push(obj);
      return true;
    } else if (element.includes("'")) {
      const obj = {
        id: index,
        name: "'",
        originalWord: element,
      };
      arrResult.push(obj);
      return true;
    } else if (element.toLocaleLowerCase() === "what") {
      if (["a", "an"].includes(wordArr[index + 1])) {
        const combined = element + " " + wordArr[index + 1];
        const obj = {
          id: index,
          name: combined,
          originalWord: combined
        };
        arrResult.push(obj);
      }
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
          originalWord: element,
        };
        arrResult.push(obj);
        return true;
        // Thêm vào arrResult
      } else {
        // Nếu từ chưa có trong cơ sở dữ liệu, gọi API từ điển
        const response = await axios.get(
          `https://dictionaryapi.com/api/v3/references/learners/json/${element}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
        );

        let wordType = response?.data?.[0]?.fl;
        let isNumber = textToNumber(element);
        if (wordType === undefined) {
          wordType = response?.data?.[1]?.fl;
        }
        if ((isNumber && isNumber !== 0) || (element === "purple")) {
          wordType = response?.data?.[1]?.fl;
        }
        if (wordType == "verb") {
          if (response?.data?.[1]?.fl === "noun") {
            return false;
          }
          wordType = "adjective";
          const obj = {
            id: index,
            name: element,
            originalWord: element,
          };
          arrResult.push(obj);

          const insertQuery = `INSERT INTO words (name, type) VALUES (?, ?)`;
          await db
            .promise()
            .query(insertQuery, [element, wordType]);
          return true;
        }
        if (wordType === "adjective") {
          const obj = {
            id: index,
            name: element,
            originalWord: element,
          };
          arrResult.push(obj);

          const insertQuery = `INSERT INTO words (name, type) VALUES (?, ?)`;
          await db
            .promise()
            .query(insertQuery, [element, wordType]);
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
      if (element.includes("-")) {
        arrComp = element.split("-");
        convertElement = pluralize.singular(arrComp[0]);
      } else {
        ["goods"].includes(element) ? convertElement = element : convertElement = pluralize.singular(element);;
      }

      // Kiểm tra trong cơ sở dữ liệu
      const [result] = await db.promise().query(query, convertElement);

      if (result.length > 0 && result[0].type === "noun") {
        // Nếu từ đã có trong cơ sở dữ liệu và là danh từ
        const obj = {
          id: index,
          name: arrComp[0] ?? convertElement,
          originalWord: element
        };
        arrResult.push(obj);
        return true;
      } else {
        // Nếu từ chưa có trong cơ sở dữ liệu, gọi API từ điển
        const response = await axios.get(
          `https://dictionaryapi.com/api/v3/references/learners/json/${convertElement}?key=68e57a54-8b7f-4122-9b42-5d499eb6eff0`
        );
        let arrException = [
          'rose'
        ];
        let wordType = response?.data?.[0]?.fl;

        if (arrException.includes(convertElement)) {
          wordType = response?.data?.[1]?.fl;
        }
        if (response?.data?.[1]?.fl === "noun") {
          wordType = response?.data?.[1]?.fl;
        }
        if (wordType === "noun") {
          // Nếu API trả về kết quả là "noun"
          const obj = {
            id: index,
            name: arrComp[0] ?? convertElement,
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

    if (element === "of") {
      foundQA = true; // danh dấu QA
      for (let i = index; i >= 0; i--) {
        arrWordGroup.push(wordArr[i]);
      }
      arrWordGroup.reverse();
      result = arrWordGroup.join(' ');
      const obj = {
        id: 0,
        name: result,
        originalWord: result

      }
      arrResult.push(obj);
      continue;
    }
    if (foundQA) {
      const handledAdj = await handleAdj(element, index);
      if (handledAdj) {
        continue;
      }
      const handledNoun = await handleNoun(element, index);
      if (handledNoun) {
        continue;
      }
    }
  }
  if (!foundQA) {
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
        element.toLocaleLowerCase() === "what" && index++;
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
  }
  console.log(arrResult);

  try {
    const sqlQuery = "SELECT * FROM words WHERE name = ?";
    const resArr = []; // Mảng tạm để giữ kết quả
    // console.log(wordArr);
    // Sử dụng Promise.all để chờ các truy vấn và API call
    await Promise.all(
      arrResult.map(async (item, index) => {
        const [results] = await db.promise().query(sqlQuery, item?.name);
        if (results.length > 0) {
          let original = item?.originalWord;
          resArr[index] = { ...results[0], original, source: "database" };
        }
      })
    );
    // res.json(resArr);
    res.json({
      fixedWord: checkedWord,
      spellcheck: checksame,
      message: parse(resArr),
    });
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).send("Error executing query");
  }
});

//Lấy word theo status : 0,1
app.get('/v1/words/:status', async (req, res) => {
  try {
    const status = req.params.status;
    const { name, type, kind, expandType, position, deleted } = req.query;

    let sqlQuery = "SELECT * FROM words WHERE status = ? AND (deleted IS NULL OR deleted = 0)";

    const queryParams = [status];

    if (name) {
      sqlQuery += " AND name LIKE ?";
      queryParams.push(`%${name}%`);
    }
    if (type) {
      sqlQuery += " AND type = ?";
      queryParams.push(type);
    }
    if (kind) {
      sqlQuery += " AND kind = ?";
      queryParams.push(kind);
    }
    if (expandType) {
      sqlQuery += " AND expandType = ?";
      queryParams.push(expandType);
    }
    if (position) {
      sqlQuery += " AND position = ?";
      queryParams.push(position);
    }
    if (typeof deleted !== 'undefined') {
      sqlQuery += " OR deleted = ?";
      queryParams.push(deleted);
    }
    const [results] = await db.promise().query(sqlQuery, queryParams);
    res.json(results);
  } catch (err) {
    console.error("Error executing query:", err.stack);
    res.status(500).send("Error executing query");
  }
});



//Thêm word mới (nếu cần)
app.post('/v1/words', async (req, res) => {
  try {
    const { name, type, expandType, kind, position, status } = req.body;
    const sqlQuery = "INSERT INTO words (name, type, expandType, kind, position, status) VALUES (?, ?, ?, ?, ?, ?)";

    const [result] = await db.promise().query(sqlQuery, [name, type, expandType, kind, position, status]);

    res.json({ message: 'Created successfully', insertedId: result.insertId });
  } catch (err) {
    console.error("Error inserting word:", err.stack);
    res.status(500).send("Error inserting word");
  }
});


//Approve word
app.put('/v1/words', async (req, res) => {
  try {
    const { id, name, type, expandType, kind, position, status, deleted } = req.body;
    const sqlQuery = `
      UPDATE words 
      SET name = ?, type = ?, expandType = ?, kind = ?, position = ?, status = ?, deleted = ? 
      WHERE id = ?
    `;

    const [result] = await db.promise().query(sqlQuery, [name, type, expandType, kind, position, status, deleted, id]);

    if (result.affectedRows > 0) {
      res.json({ message: 'Updated successfully' });
    } else {
      res.status(404).send("Word not found");
    }
  } catch (err) {
    console.error("Error updating word:", err.stack);
    res.status(500).send("Error updating word");
  }
});


//Xóa từ, bổ sung thêm field deleted
app.delete('/v1/words/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const sqlQuery = "UPDATE words SET deleted = 1 WHERE id = ?";

    const [result] = await db.promise().query(sqlQuery, [id]);

    if (result.affectedRows > 0) {
      res.json({ message: 'Deleted successfully' });
    } else {
      res.status(404).send("Word not found");
    }
  } catch (err) {
    console.error("Error :", err.stack);
    res.status(500).send("Error");
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username và password không được để trống" });
  }

  try {
    const query = "SELECT * FROM user WHERE username = ?";
    const [rows] = await db.promise().query(query, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Thông tin đăng nhập không chính xác" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Thông tin đăng nhập không chính xác" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username và password không được để trống" });
  }

  try {
    const query = "SELECT * FROM user WHERE username = ?";
    const [rows] = await db.promise().query(query, [username]);

    if (rows.length > 0) {
      return res.status(400).json({ message: "Username đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = "INSERT INTO user (username, password) VALUES (?, ?)";
    const [result] = await db.promise().query(insertQuery, [username, hashedPassword]);
    //sau khi đăng ký thì cho vô thẳng luôn đỡ login lại
    const token = jwt.sign(
      { id: result.insertId, username: username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: "Đăng ký thành công", token });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});


const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(403).json({ message: "Không có token, quyền truy cập bị từ chối" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
