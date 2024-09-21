const PREDET = {
    type: "PRE-DET",
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
        words: ["my", "your", "its", "her", "his", "their"],
    },
    {
        type: ['PossPropN', 'PossCommN'],
        words: ["'s"]
    },
    {
        type: 'exclamatory^',
        words: ["what a", 'what an']
    },
    {
        type: 'interrogative',
        words: ["which"]
    }
];
const DEG = {
    type: "adverb",
    expend: "DEG",
    words: ["very", "too", "so", "extremely", "quite", "enough", "hardly", "completely",
        "deeply", "highly", "awfully", "terribly", "much", "excessively", "partly", "rather"],
    //còn nữa
};
const parse = (arr) => {
    let str = "[NP";
    let preDetStr = "";
    let detStr = "";
    let detFound = false;
    let degFound = false;
    let preDetFound = false;
    let advFound = false;
    // Function to handle DET and PRE-DET
    const handleDetAndPreDet = (array) => {
        // for (let i = 0; i < array.length; i++) {
        let i = 0;
        let item = array[i];

        // Check for PRE-DET
        if (PREDET.words.includes(item.name)) {
            preDetStr = `[PRE-DET ${item.name}] [NP`;
            preDetFound = true;
            item = array[i + 1];
        }

        // Check for DET
        const detType = DET.find(det => det.words.includes(item.name));
        if (detType || item.name.includes("'s")) {
            // detStr = `[DET [${detType ? detType.type : item.type} ${item.name}]]`;
            detStr = `[DET [${detType ? detType.type : item?.name[0].toUpperCase() === item?.name[0] ? 'PossPropN' : 'PossCompN'} ${item.name}]]`;
            detFound = true;
        }
        // }
    }
    //][AP 
    handleDetAndPreDet(arr);

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
                    str += advFound ? `[AP [${DEG.type} ${element.name}]` : `[AP [${DEG.expend} ${element.name}]`; // Fixed string concatenation
                }
            });
        }
        degRecognize(array);


        const QA = (array) => {
            array.forEach((element) => {
                str += element?.type === "QA" ? `[QA^ ${element?.name}]` : "";
            });
        };
        QA(array);
        // str += degFound ? `]` : '';
        // str += degFound ? !advFound ? `]` : '' : '';
        if (degFound) {
            str += `]`;
            if (advFound) str = str.substring(0, str.length - 1);
        }
        let nounArr = [];
        let countNoun = 0;
        let adjArr = []
        let countAdj = 0;
        array.forEach(item => {
            // Skip items already processed as DET or PRE-DET
            if (PREDET.words.includes(item.name) || DET.some(det => det.words.includes(item.name))) {
                return;
            }

            // Add other parts of the noun phrase
            if (item.type === 'adjective' || item.type === 'PossCommN') {
                // str += `[AP [A ${item.name}]]`;
                countAdj++
                adjArr.push(item)
            }
            if (item.type === 'noun') {
                countNoun++;
                nounArr.push(item);
            }
        });

        if (countAdj) {
            if (countAdj > 1) {
                adjArr.forEach((item, index) => {
                    str += `[AP [${item?.type} ${item?.name}]]`;
                    str += index === 0 || index % 2 === 0 ? `[N'` : "";
                })
            } else {
                str += degFound ? `[${adjArr[0]?.type} ${adjArr[0]?.name}]]` : `[AP [${adjArr[0]?.type} ${adjArr[0]?.name}]]`;
            }
        }
        // str += `]`

        // Handle multiple nouns
        const handleMultiNoun = (nounArr, countNoun) => {
            if (countNoun > 1) {
                str += `[headComN `;
                nounArr.forEach((part, index) => {
                    let items = part?.name.includes('-') ? part?.name.split('-') : [part.name];
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
                        if (index === nounArr.length - 1) {
                            str += `[headN ${part.name}]`;
                        } else {
                            str += `[ModN ${part.name}]`;
                        }
                    }
                });
                str += `]`
            } else if (countNoun === 1) {
                // Handle single noun
                str += `[headN ${nounArr[0].name}]`;
            }
        };

        handleMultiNoun(nounArr, countNoun)

    }

    handleNounBar(arr);
    str += "]";

    console.log(str);
    console.log(advFound);

}

// Test cases
const a = [{ name: 'some', type: 'quantifier' }, { name: 'mistakes', type: 'noun' }];
const b = [{ name: 'what a', type: 'exclamatory' }, { name: 'view', type: 'noun' }];
const c = [{ name: 'what a', type: 'exclamatory' }, { name: 'lovely', type: 'adjective' }, { name: 'view', type: 'noun' }];
const d = [{ name: 'which', type: 'interrogative' }, { name: 'platform', type: 'noun' }];
const e = [{ name: 'platforms', type: 'noun' }];
const f = [{ name: 'both', type: 'PRE-DET' }, { name: 'my', type: 'PossA' }, { name: 'studious', type: 'adjective' }, { name: 'roommates', type: 'noun' }];
const g = [{ name: 'half', type: 'PRE-DET' }, { name: "student's", type: 'PossComN' }, { name: 'new', type: 'adjective' }, { name: 'roommates', type: 'noun' }];
const h = [{ name: 'half', type: 'PRE-DET' }, { name: "Harry's", type: 'PossPropN' }, { name: 'new', type: 'adjective' }, { name: 'roommates', type: 'noun' }];
const i = [{ name: "the", type: 'article' }, { name: 'child', type: 'noun' }, { name: 'safety-harness', type: 'noun' }];
const j = [{ name: "the", type: 'article' }, { name: 'black', type: 'adjective' }, { name: 'child-poverty', type: 'noun' }, { name: 'action-group', type: 'noun' }];
const k = [{ name: "some", type: 'quantifier' } /*, { name: 'extremely', type: 'adverb' }*/, { name: 'expensive', type: 'adjective' }, { name: 'house-roof', type: 'noun' }, { name: 'maintainance', type: 'noun' }];
const m = [{ name: "the", type: 'article' }, { name: "summer's", type: 'PossCommN' }, { name: 'red', type: 'adjective' }, { name: 'roses', type: 'noun' }];
const n = [{ name: "so", type: 'adverb' }, { name: "few", type: 'QA' }, { name: 'ideas', type: 'noun' }];
const o = [{ name: "beautifully", type: 'adverb' }, { name: "cool", type: 'adjective' }, { name: 'weather', type: 'noun' }];

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
parse(k);
// parse(m);
// parse(n);
// parse(o);

