const LANGS = ["ko", "ja"];

// Copied from https://en.wikipedia.org/wiki/Katakana.
const KATAKANA = [
  ["ア", "イ", "ウ", "エ", "オ"],
  ["カ", "キ", "ク", "ケ", "コ"],
  ["サ", "シ", "ス", "セ", "ソ"],
  ["タ", "チ", "ツ", "テ", "ト"],
  ["ナ", "ニ", "ヌ", "ネ", "ノ"],
  ["ハ", "ヒ", "フ", "ヘ", "ホ"],
  ["マ", "ミ", "ム", "メ", "モ"],
  ["ヤ", "", "ユ", "", "ヨ"],
  ["ラ", "リ", "ル", "レ", "ロ"],
  ["ワ", "ヰ", "", "ヱ", "ヲ"],
];

// Copied from https://en.wikipedia.org/wiki/Hiragana.
const HIRAGANA = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "ゐ", "", "ゑ", "を"],
];

const ROMAJI_VOWELS = ["a", "i", "u", "e", "o"];

const ROMAJI_CONSONANTS = ["", "k", "s", "t", "n", "h", "m", "y", "r", "w"];

const NG = "\u110b";

const VOWEL_MAP = {
  a: "ᅡ",
  i: "ᅵ",
  u: "ᅮ",
  e: "ᅦ",
  o: "ᅩ",
};

const CONSONANT_MAP = {
  "": NG,
  k: "ᄀ",
  s: "ᄉ",
  t: "ᄃ",
  n: "ᄂ",
  h: "ᄒ",
  m: "ᄆ",
  y: NG,
  r: "ᄅ",
  w: NG,
};

const Y_MAP = {
  a: "ᅣ",
  // Unused
  i: "ᅵ",
  u: "ᅲ",
  // Unused
  e: "ᅨ",
  o: "ᅭ",
};

const W_MAP = {
  a: "ᅪ",
  i: "ᅬ",
  // Unused
  u: "ᅮ",
  e: "ᅰ",
  o: "ᅯ",
};

const INITIAL_CONSONANTS = "ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄋᄌᄍᄎᄏᄐᄑᄒ";
const VOWELS = "ᅡᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵ";

function combineSyllables(initial, medial) {
  const initialCode = INITIAL_CONSONANTS.indexOf(initial);
  const medialCode = VOWELS.indexOf(medial);
  return String.fromCharCode(588 * initialCode + 28 * medialCode + 44032);
}

function getVoicesMap(langs) {
  let makeLangToVoices = (voices, langs) => {
    let result = {};
    for (let voice of voices) {
      for (let lang of langs) {
        if (voice.lang.indexOf(lang) === 0) {
          if (!result[lang]) {
            result[lang] = [];
          }
          result[lang].push(voice);
        }
      }
    }
    return result;
  };
  return new Promise((resolve, reject) => {
    let result = makeLangToVoices(window.speechSynthesis.getVoices(), langs);
    if (Object.keys(result).length === langs.length) {
      resolve(result);
    } else {
      const timeoutId = setTimeout(
        () => reject("Timed out getting voices"),
        5000,
      );
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        let result = makeLangToVoices(
          window.speechSynthesis.getVoices(),
          langs,
        );
        const foundLangs = Object.keys(result);
        if (foundLangs.length === langs.length) {
          clearTimeout(timeoutId);
          resolve(result);
        } else {
          reject(`Missing langs; only got: ${foundLangs.join(", ")}`);
        }
      });
    }
  });
}

function createHtmlTable(basicSyllabary) {
  const table = document.createElement("table");
  table.classList.add("kokatana-table");
  const vowelsTr = document.createElement("tr");
  vowelsTr.appendChild(document.createElement("th"));
  for (let romajiVowel of ROMAJI_VOWELS) {
    const th = document.createElement("th");
    th.innerHTML = `${romajiVowel} (<span lang="ko">${VOWEL_MAP[romajiVowel]}</span>)`;
    vowelsTr.appendChild(th);
  }
  table.appendChild(vowelsTr);
  for (let i = 0; i < ROMAJI_CONSONANTS.length; i++) {
    const tr = document.createElement("tr");
    const romajiConsonant = ROMAJI_CONSONANTS[i];
    const hangulConsonant = CONSONANT_MAP[romajiConsonant];
    const hangulConsonantHtml =
      hangulConsonant == NG ? "-" : `<span lang="ko">${hangulConsonant}</span>`;
    const th = document.createElement("th");
    tr.appendChild(th);
    if (romajiConsonant) {
      th.innerHTML = `${romajiConsonant} (${hangulConsonantHtml})`;
    }
    for (let j = 0; j < ROMAJI_VOWELS.length; j++) {
      const romajiVowel = ROMAJI_VOWELS[j];
      let hangulVowel = VOWEL_MAP[romajiVowel];
      if (romajiConsonant == "y") {
        hangulVowel = Y_MAP[romajiVowel];
      } else if (romajiConsonant == "w") {
        hangulVowel = W_MAP[romajiVowel];
      }
      const symbol = basicSyllabary[i][j];
      const td = document.createElement("td");
      const makeSpeakable = (lang, text) =>
        `<span class="speakable" role="button" lang="${lang}">${text}</span>`;
      if (symbol) {
        td.innerHTML = [
          makeSpeakable("ja", symbol),
          " (",
          makeSpeakable("ko", combineSyllables(hangulConsonant, hangulVowel)),
          ")",
        ].join("");
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  return table;
}

document
  .getElementById("katakana-table")
  .appendChild(createHtmlTable(KATAKANA));
document
  .getElementById("hiragana-table")
  .appendChild(createHtmlTable(HIRAGANA));

const langToVoices = await getVoicesMap(LANGS);
const speakInTargetLang = (event) => {
  if (LANGS.includes(event?.target?.lang)) {
    const utterance = new SpeechSynthesisUtterance(event.target.textContent);
    // TODO: give the user control over which voice to use.
    // Default to the Google voices if available.
    utterance.voice = langToVoices[event.target.lang][0];
    window.speechSynthesis.speak(utterance);
  }
};
[...document.querySelectorAll(".speakable[lang]")].forEach((e) =>
  e.addEventListener("click", speakInTargetLang),
);
