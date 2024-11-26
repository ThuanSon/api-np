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
        words: ["'"],
    },
    {
        type: "exclamatory^",
        words: ["what a", "what an", 'what'],
    },
    {
        type: "interrogative",
        words: ["which"],
    },
];
const DEG = {
    type: "adverb",
    expend: "DEG",
    words: [
        "very",
        "too",
        "so",
        "extremely",
        "quite",
        "enough",
        "hardly",
        "completely",
        "deeply",
        "highly",
        "awfully",
        "terribly",
        "much",
        "excessively",
        "partly",
        "rather",
    ],
    //còn nữa
};
const parse = (arr) => {
    if (Array.isArray(arr)) {
        let str = "[NP";
        let preDetStr = "";
        let detStr = "";
        let detFound = false;
        let degFound = false;
        let preDetFound = false;
        let advFound = false;
        let i = 0;
        let extraWords = []; // mảng mới chứa các phần từ nếu sau noun còn phần tử

        // Function to handle DET and PRE-DET
        const handleRestrict = (array) => {
            let item = array[i];

            let isDEG = DEG.words.includes(item?.original);


            let isRestric = array[i + 1]?.type === PREDET.type || DET.find((item) => { item?.type === array[i + 1]?.type }) || (item?.type === "adverb" && array[i + 1]?.type === "noun");
            console.log('isRest', isRestric);

            // if ((item?.type === "adverb" && !isDEG) || isRestric) {
            //     // if (isRestric) {
            //     str += `[Restrict ${item?.original}] [NP`;
            //     array.shift();
            // }
            let next = array[i + 1]
            if (item?.type === 'adverb' && next?.type !== 'adjective') {
                str += `[Restrict ${item?.original}] [NP`;
                array.shift();
            }
        };
        handleRestrict(arr);
        const handleDetAndPreDet = (array) => {
            // for (let i = 0; i < array.length; i++) {
            let item = array[i];
            // Check for PRE-DET
            if (PREDET.words.includes(item?.name)) {
                preDetStr = `[pre-DET ${item?.name}] [NP`;
                preDetFound = true;
                item = array[i + 1];
                // arr.shift();
            }

            // Check for DET
            const detType = DET.find((det) => det.words.includes(item?.name));
            const isPossA = DET[3].words.includes(item?.name);

            // console.log(detType);
            // if (DET[5].words.includes(item?.name)) {
            //     detStr = `[DET [${item?.type } ${item?.name}]]`;
            //     return;
            // }
            // if (DET[6].words.includes(item?.name)) {
            //     detStr = `[DET [${item?.type } ${item?.name}]]`;
            //     return;
            // }
            console.log('isPossA', isPossA);
            console.log('isPossA', item?.name);

            if (detType && item?.name.includes("'")) {
                detStr = `[DET [${isPossA ? DET[3].type : item?.original[0].toUpperCase() === item?.original[0] ? "PossPropN" : "PossCommN"} ${item.original}]]`;
                detFound = true;
                return;
            }
            if (detType) {
                detStr = `[DET [${isPossA ? DET[3].type : item?.type}  ${item.original}]]`;
                detFound = true;
                return;
            }
            // }
        };
        //][AP
        handleDetAndPreDet(arr);
        // i = preDetFound ? detFound ? 2 : 1 : 0;
        i = preDetFound && detFound ? 2 : detFound ? 1 : 0;

        let newArr = [];
        for (; i < arr.length; i++) {
            newArr.push(arr[i]);
        }
        // console.log(newArr);

        // Add placeholders if needed
        // if (!preDetFound) {
        //     preDetStr = "[PRE-DET ø]";
        // }
        if (!detFound) {
            detStr = "[DET ø]";
        }

        str += preDetStr + detStr + " [N'";

        // Handle the remaining parts of the noun phrase
        const handleNounBar = (array) => {
            function degRecognize(array) {
                array.forEach((element) => {
                    if (DEG.type.includes(element.type)) {
                        degFound = true;
                        advFound = !DEG.words.includes(element.name);
                        str += advFound
                            ? `[AP[${DEG.type} ${element.name}]`
                            : `[AP[${DEG.expend} ${element.name}]`; // Fixed string concatenation
                    }
                });
            }
            // degRecognize(array);

            const QA = (array) => {
                array.forEach((element) => {
                    str += element?.type === "QA" ? `[AP[QA^ ${element?.name}]]` : "";
                });
            };
            QA(array);
            // console.log(array, '.....');
            // str += degFound ? `]` : '';
            // str += degFound ? !advFound ? `]` : '' : '';
            if (degFound) {
                str += `]`;
                if (advFound) str = str.substring(0, str.length - 1);
            }
            let nounArr = [];
            let countNoun = 0;
            let adjArr = [];
            let countAdj = 0;
            let isAP = ["adjective", "PossCommN", "adverb", "possessive"];

            function processAdjective(index) {
                if (index >= array.length) {
                    return; // end
                }

                let item = array[index];

                if (isAP.includes(item?.type)) {
                    countAdj++;
                    adjArr.push(item);
                    array.splice(index, 1);
                    index--; // trừ index thì mảng đã bị thay đổi khi cắt phần tử ở trên
                    if (!isAP.includes(array[index + 1]?.type)) {
                        processNoun(index + 1);
                    } else {
                        processAdjective(index + 1);
                    }
                } else {
                    processNoun(index);
                }
                if (array[index]?.type === "QA") {
                    processNoun(index + 1);
                }
            }

            function processNoun(index) {
                if (index >= array.length) {
                    return;
                }

                let item = array[index];
                // console.log(item);
                if (item?.type === "noun") {
                    countNoun++;
                    nounArr.push(item);
                    array.splice(index, 1);
                    index--;

                    // sau khi xử lý hết danh từ, đẩy các phần tử còn lại vào mảng extraWords
                    if (array[index + 1]?.type !== "noun") {
                        extraWords = array.slice(index + 1); // lấy tất cả phần tử còn lại sau noun cuối
                        array.splice(index + 1, array.length - index); // Xóa phần tử còn lại trong mảng array
                    } else {
                        processNoun(index + 1); // tiếp tục xử lý danh từ nếu còn
                    }
                }
            }

            // Bắt đầu xử lý từ phần tử đầu tiên
            processAdjective(0);
            if (countAdj) {
                if (countAdj > 1) {
                    adjArr.forEach((item, index) => {
                        isAdv = item?.type === 'adverb';
                        if (index !== 0) {
                            if (str[str.length - 1] === `'`) {
                                //nếu là phần tử cuối là dấu ' thì cắt bỏ 3 ký tự
                                str = str.substring(0, str.length - 3);
                            }
                            str = str.substring(0, str.length - 1); // cắt bỏ một ký tự cuối là }
                            if (adjArr[index - 1]?.type === 'adverb') {
                                str += `[${item?.type} ${item?.name}]]`;
                            } else {
                                str += `][N'[AP[${item?.type} ${item?.name}]]`;

                            }
                        } else {
                            str += `[AP [${item?.type} ${item?.original}]]`;
                        }
                    });
                    // str+= ']'
                } else {
                    str += degFound
                        ? `[${adjArr[0]?.type} ${adjArr[0]?.original}]]`
                        : `[AP [${adjArr[0]?.type} ${adjArr[0]?.original}]]`;
                }
            }
            // str += `]`

            // Handle multiple nouns
            const handleMultiNoun = (nounArr, countNoun) => {

                if (countNoun > 1) {
                    str += `[headComN `;
                    nounArr.forEach((part, index) => {
                        let items = part?.original.includes("-") ? part?.original.split("-") : [part.original];
                        if (Array.isArray(items) && items.length > 1) {
                            // Handle hyphenated nouns
                            str += index % 2 !== 0 ? `[headComN ` : `[ModN`;
                            items.forEach((item, itemIndex) => {
                                if (itemIndex === items.length - 1) {
                                    str += `[headN ${item}]`;
                                } else {
                                    str += `[ModN ${item}]`;
                                }
                            });
                            str += `]`; // Close headComN for hyphenated nouns
                        } else {
                            // Handle single part nouns

                            if (nounArr.length > 2) {
                                if (index === nounArr.length - 1) {
                                    str += `[headN ${part?.original}]`
                                } else {
                                    str += `[ModN ${part?.original}] ${index !== nounArr.length - 2 ? '[headComN' : ''}`
                                }
                            } else {
                                if (index === nounArr.length - 1) {
                                    str += `[headN ${part.original}]`;
                                } else {
                                    str += `[ModN ${part.original}]`;
                                }
                            }
                        }
                    });
                    str += `]`;
                } else {
                    // Handle single noun
                    str += `[headN ${nounArr[0]?.original}]`;
                }
            };

            handleMultiNoun(nounArr, countNoun);
        };

        handleNounBar(newArr);
        str += "]]";

        if (extraWords.length !== 0 && ['adverb', 'adjective'].includes(extraWords[0]?.type)) {
            let preStr = `[NP`;
            let postStr = `[AP [${extraWords[0]?.type} ${extraWords[0]?.name}]]]`
            str = preStr + str + postStr;
            // str+= `[AP [${extraWords[0]?.type} ${extraWords[0]?.name}]]`
        }

        str = str.replace('article', 'ART');
        str = str.replace('exclamatory', 'Exclam.DET');
        str = str.replace('Exclam.DET  what a', 'Exclam.DET^ what a');
        str = str.replace('interrogative', 'Interrog.DET');
        str = str.replace('demonstrative', 'DEM')
        str = str.replace('quantifier', 'Q')
        str = str.replaceAll('adjective', 'A')
        str = str.replaceAll('adverb', 'Adv')
        // str = str.replaceAll("[headComN", "[N'[headComN")
        if (str.includes('AP')) {
            str = str.replaceAll("[headComN", "[N'[headComN")

        }

        return str;
    }

    // console.log(str);
    // console.log(advFound);
};
module.exports = parse;

// Test cases
const a = [
    { name: "some", type: "quantifier" },
    { name: "mistakes", type: "noun" },
];
const b = [
    { name: "what a", type: "exclamatory" },
    { name: "view", type: "noun" },
];
const c = [
    { name: "what a", type: "exclamatory" },
    { name: "lovely", type: "adjective" },
    { name: "view", type: "noun" },
];
const d = [
    { name: "which", type: "interrogative" },
    { name: "platform", type: "noun" },
];
const e = [{ name: "platforms", type: "noun" }];
const f = [
    { name: "both", type: "PRE-DET" },
    { name: "my", type: "PossA" },
    { name: "studious", type: "adjective" },
    { name: "roommates", type: "noun" },
];
const g = [
    { name: "half", type: "PRE-DET" },
    { name: "student's", type: "PossComN" },
    { name: "new", type: "adjective" },
    { name: "roommates", type: "noun" },
];
const h = [
    { name: "half", type: "PRE-DET" },
    { name: "Harry's", type: "PossPropN" },
    { name: "new", type: "adjective" },
    { name: "roommates", type: "noun" },
];
const i = [
    { name: "the", type: "article" },
    { name: "child", type: "noun" },
    { name: "safety-harness", type: "noun" },
];
const j = [
    { name: "the", type: "article" },
    { name: "black", type: "adjective" },
    { name: "child-poverty", type: "noun" },
    { name: "action-group", type: "noun" },
];
const z = [
    { name: "the", type: "article" },
    { name: "black", type: "adjective" },
    { name: "child", type: "noun" },
    { name: "poverty", type: "noun" },
    { name: "action", type: "noun" },
    { name: "group", type: "noun" },
];
const k = [
    {
        name: "some",
        type: "quantifier",
    } /*, { name: 'extremely', type: 'adverb' }*/,
    { name: "expensive", type: "adjective" },
    { name: "house-roof", type: "noun" },
    { name: "maintainance", type: "noun" },
];
const m = [
    { name: "the", type: "article" },
    { name: "summer's", type: "PossCommN" },
    { name: "red", type: "adjective" },
    { name: "roses", type: "noun" },
];
const n = [
    { name: "so", type: "adverb" },
    { name: "few", type: "QA" },
    { name: "ideas", type: "noun" },
];
const o = [
    { name: "beautifully", type: "adverb" },
    { name: "cool", type: "adjective" },
    { name: "weather", type: "noun" },
];
const p = [
    { name: "those", type: "demonstrative" },
    { name: "two", type: "adjective" },
    { name: "very", type: "adverb" },
    { name: "testy", type: "adjective" },
    { name: "women", type: "noun" },
];

const u = [
    { name: "those", type: "demonstrative" },
    { name: "two", type: "adjective" },
    { name: "very", type: "adverb" },
    { name: "testy", type: "adjective" },
    { name: "women", type: "noun" },
    { name: "quickly", type: "adverb" },
    { name: "running", type: "verb" },
    { name: "dogs", type: "noun" },
];
// parse(a); // Example usage
// parse(b);
// parse(c);
// parse(d);
// parse(e);
// parse(f);
// parse(g);
// parse(h);
// parse(i);
// parse(j);
// parse(k);
// parse(m);
// parse(n);
// parse(o);
// console.log(parse(o));
