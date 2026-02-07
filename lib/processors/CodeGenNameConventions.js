/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * 
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _merge = require('merge');

var _merge2 = _interopRequireDefault(_merge);

var _path = require('path');

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _startsWith = (str, searchStr, startIdx) => {
  if (str.length < startIdx + searchStr.length) {
    return false;
  }

  let index = 0;
  while (index < searchStr.length) {
    if (str.charAt(index + startIdx) !== searchStr.charAt(index)) {
      return false;
    }
    ++index;
  }
  return true;
};

const _isCharUpper = ch => {
  return ch >= 'A' && ch <= 'Z';
};

const _decodeDictFile = (0, _path.resolve)(__dirname, '..', '..', 'api_specs', 'EndpointDecodeDict.txt');
let _decodeDictBase = {};
if ((0, _fs.existsSync)(_decodeDictFile)) {
  _decodeDictBase = (0, _fs.readFileSync)(_decodeDictFile, 'utf8').split('\n').reduce((dict, line) => {
    const columns = line.split('=');
    const value = parseFloat(columns[1]);
    if (value) {
      dict[columns[0].trim()] = value;
    }
    return dict;
  }, {});
}

let _decodeDict = _decodeDictBase;
const CodeGenNameConventions = {
  initDecodeDictionary(words) {
    const counter = {};
    words.forEach(val => {
      const w = val.toLowerCase();
      counter[w] = (counter[w] || 0) + 1;
      const pw = (0, _pluralize2.default)(w);
      if (pw !== w) {
        counter[pw] = (counter[pw] || 0) + 0.5;
      }
    });

    let maxCnt = 1;
    for (const w in counter) {
      if (counter[w] > maxCnt) {
        maxCnt = counter[w];
      }
    }

    _decodeDict = (0, _merge2.default)(true, _decodeDictBase);
    for (const w in counter) {
      _decodeDict[w] = counter[w] / maxCnt;
    }
  },

  parseEndpointName(endpoint, boostWords, clsName) {
    if (endpoint === 'leadgen_forms') {
      return ['lead', 'gen', 'forms'];
    }
    if (endpoint === 'leadgen_context_cards') {
      return ['lead', 'gen', 'context', 'cards'];
    }
    if (endpoint === 'leadgen_whitelisted_users') {
      return ['lead', 'gen', 'whitelisted', 'users'];
    }
    if (endpoint === 'ExtendedCreditOwningCreditAllocationConfigs') {
      return ['extended', 'credit', 'owning', 'credit', 'allocation', 'configs'];
    }

    let mergedDict = _decodeDict;
    if (boostWords) {
      mergedDict = (0, _merge2.default)(true, _decodeDict, boostWords.reduce((prev, curr) => {
        prev[curr] = 10;
        const pluralWord = (0, _pluralize2.default)(curr);
        if (pluralWord !== curr) {
          prev[pluralWord] = 1;
        }
        return prev;
      }, {}));
    }

    // $FlowFixMe
    const lattice = { 0: [0] };
    const candidates = [1];
    for (let index = 0; index < endpoint.length; ++index) {
      if (!candidates[index]) {
        continue;
      }

      const weight = lattice[index][0];
      let newWeight = 0;
      // deal with the underscores in endpoints
      if (endpoint.charAt(index) === '_') {
        const newIndex = index + 1;
        if (!lattice[newIndex]) {
          lattice[newIndex] = [newWeight, '#'];
          candidates[newIndex] = 1;
        }
      }

      for (const word in mergedDict) {
        if (_startsWith(endpoint, word, index)) {
          const newIndex = index + word.length;
          newWeight = weight + mergedDict[word];
          if (!lattice[newIndex] || lattice[newIndex][0] < newWeight) {
            lattice[newIndex] = [newWeight, word];
            candidates[newIndex] = 1;
          }
        }
      }
    }

    const parts = [];
    let endPost = endpoint.length;
    if (!lattice[endPost]) {
      throw Error('cannot decode endpoint ' + endpoint + ' in class ' + clsName);
    }
    while (endPost) {
      if (lattice[endPost][1] !== '#') {
        parts.push(lattice[endPost][1]);
      }
      endPost -= lattice[endPost][1].length;
    }

    parts.reverse();
    return parts;
  },

  parseUnderscoreName(name) {
    if (!name) {
      return [];
    }
    if (!name.split) {
      return [String(name)];
    }
    return name.split(/[._:\s]/).map(part => part.toLowerCase());
  },

  escapeSingleQuotes(input) {
    if (input == null)
      return input;
    return input.replace(/'/g, "\\'");
  },

  // The parsing of pascal name has a weird pitfall
  // If the pased name is normal pascal style, the returned parts will be all
  // lower case. If any part of the pascal name has all upper case, the return
  // part will keep all upper case. Which can cause confusion for later usage
  //
  // The one big issue is for ruby. Ruby assume the name are all capitalized
  // when autoload classes. Will just fix it for ruby case and keep this
  // behavior this time. Will fix after f8.
  parsePascalName(name) {
    if (!name) {
      return [];
    }
    if (!name.split) {
      return [String(name)];
    }
    if (name.charAt(0) !== name.charAt(0).toUpperCase()) {
      throw Error('not valid pascal casing name: ' + name);
    }
    const STATUS = {
      SEEN_WORD_START: 0, // seen an upper-case char after lower-case chars
      EXPECT_PASCAL_WORD: 1, // second char is lower-case in a word
      EXPECT_ALL_UPPER_WORD: 2 // second char is also upper case in a word
    };
    const parts = [];
    let indexStart = 0;
    let parseStatus = STATUS.SEEN_WORD_START; // assert charAt(0) is upper case
    for (let i = 1; i < name.length; ++i) {
      const isUpper = _isCharUpper(name.charAt(i));
      switch (parseStatus) {
        case STATUS.SEEN_WORD_START:
          parseStatus = isUpper ? STATUS.EXPECT_ALL_UPPER_WORD : STATUS.EXPECT_PASCAL_WORD;
          break;
        case STATUS.EXPECT_PASCAL_WORD:
          if (isUpper) {
            // The word terminates when we see the next upper-case letter
            parts.push(name.substring(indexStart, i).toLowerCase());
            indexStart = i;
            parseStatus = STATUS.SEEN_WORD_START;
          }
          break;
        case STATUS.EXPECT_ALL_UPPER_WORD:
          if (!isUpper) {
            // The word terminates when we see a lower-case letter
            parts.push(name.substring(indexStart, i - 1));
            indexStart = i - 1;
            parseStatus = STATUS.EXPECT_PASCAL_WORD;
          }
          break;
      }
    }

    const lastPart = name.substring(indexStart, name.length);
    if (parseStatus === STATUS.EXPECT_ALL_UPPER_WORD) {
      parts.push(lastPart);
    } else {
      parts.push(lastPart.toLowerCase());
    }
    return parts;
  },

  /**
   * Replace non (alphanumerical + _) to _
   */
  removeIlligalChars(name) {
    return name.replace(/(_\W+)|(\W+_)|(\W+)/g, '_');
  },

  // strict_pascal means strictly first char upper and following lower.
  // See comments in parsePascalName
  populateNameConventions(obj, prop, parts, prefix) {
    if (!parts || parts.length == 0) {
      return;
    }
    const lowerCaseParts = [];
    const capitalized = [];
    const strictCapitalized = [];

    parts.forEach(val => {
      lowerCaseParts.push(val.toLowerCase());
      capitalized.push(val.charAt(0).toUpperCase() + val.slice(1));
      strictCapitalized.push(val.charAt(0).toUpperCase() + val.slice(1).toLowerCase());
    });

    const hyphenName = lowerCaseParts.join('-');
    const underscoreName = lowerCaseParts.join('_');
    const upperCaseName = underscoreName.toUpperCase();
    let camelCaseName = lowerCaseParts[0];
    let pascalCaseName = capitalized[0];
    let strictPascalCaseName = strictCapitalized[0];
    let allLowerCaseName = lowerCaseParts[0];
    for (let i = 1; i < parts.length; ++i) {
      camelCaseName += capitalized[i];
      pascalCaseName += capitalized[i];
      strictPascalCaseName += strictCapitalized[i];
      allLowerCaseName += lowerCaseParts[i];
    }

    obj[prop + ':hyphen'] = hyphenName;
    obj[prop + ':underscore'] = underscoreName;
    obj[prop + ':pascal_case'] = pascalCaseName;
    obj[prop + ':strict_pascal_case'] = strictPascalCaseName;
    obj[prop + ':camel_case'] = camelCaseName;
    obj[prop + ':upper_case'] = upperCaseName;
    obj[prop + ':all_lower_case'] = allLowerCaseName;
    obj[prop + ':all_lower_case_excluding_digit_suffix'] = isNaN(Number(underscoreName.charAt(0))) ? underscoreName : 'value_' + underscoreName;
    obj[prop + ':escape_single_quote'] = this.escapeSingleQuotes(obj[prop]);

    if (prefix) {
      obj[prefix + prop + ':hyphen'] = hyphenName;
      obj[prefix + prop + ':underscore'] = underscoreName;
      obj[prefix + prop + ':pascal_case'] = pascalCaseName;
      obj[prefix + prop + ':strict_pascal_case'] = strictPascalCaseName;
      obj[prefix + prop + ':camel_case'] = camelCaseName;
      obj[prefix + prop + ':upper_case'] = upperCaseName;
      obj[prefix + prop + ':all_lower_case'] = allLowerCaseName;
      obj[prefix + prop + ':all_lower_case_excluding_digit_suffix'] = isNaN(Number(allLowerCaseName.charAt(0))) ? allLowerCaseName : 'value_' + allLowerCaseName;
      obj[prefix + prop + ':escape_single_quote'] = this.escapeSingleQuotes(obj[prop]);
    }
  },

  getAllCaseNames(parts) {
    const lowerCaseParts = [];
    const capitalized = [];

    parts.forEach(val => {
      lowerCaseParts.push(val.toLowerCase());
      capitalized.push(val.charAt(0).toUpperCase() + val.slice(1));
    });

    const hyphenName = lowerCaseParts.join('-');
    const underscoreName = lowerCaseParts.join('_');
    const upperCaseName = underscoreName.toUpperCase();
    let camelCaseName = lowerCaseParts[0];
    let pascalCaseName = capitalized[0];
    let allLowerCaseName = lowerCaseParts[0];
    for (let i = 1; i < parts.length; ++i) {
      camelCaseName += capitalized[i];
      pascalCaseName += capitalized[i];
      allLowerCaseName += lowerCaseParts[i];
    }

    return {
      hyphen: hyphenName,
      underscore: underscoreName,
      pascal_case: pascalCaseName,
      camel_case: camelCaseName,
      upper_case: upperCaseName,
      all_lower_case: allLowerCaseName
    };
  },

  populateNameConventionForUnderscoreProp(obj, prop) {
    const parts = this.parseUnderscoreName(obj[prop]);
    this.populateNameConventions(obj, prop, parts);
  },

  populateNameConventionForPascalProp(obj, prop) {
    const parts = this.parsePascalName(obj[prop]);
    this.populateNameConventions(obj, prop, parts);
  }
};

exports.default = CodeGenNameConventions;
