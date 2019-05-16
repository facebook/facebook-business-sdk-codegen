/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

var fs = require('fs');
var merge = require('merge');
var path = require('path');
var pluralize = require('pluralize');

function _startsWith(str, searchStr, startIdx) {
  if (str.length < startIdx + searchStr.length) {
    return false;
  }

  var index = 0;
  while (index < searchStr.length) {
    if (str.charAt(index + startIdx) !== searchStr.charAt(index)) {
      return false;
    }
    ++index;
  }
  return true;
}

function _isCharUpper(ch) {
  return ch >= 'A' && ch <= 'Z';
}

var _decodeDictFile = path.resolve(
  __dirname,
  '..',
  '..',
  'api_specs',
  'EndpointDecodeDict.txt',
);
var _decodeDictBase = {};
if (fs.existsSync(_decodeDictFile)) {
  _decodeDictBase = fs
    .readFileSync(_decodeDictFile, 'utf8')
    .split('\n')
    .reduce(function(dict, line) {
      var columns = line.split('=');
      var value = parseFloat(columns[1]);
      if (value) {
        dict[columns[0].trim()] = value;
      }
      return dict;
    }, {});
}

var _decodeDict = _decodeDictBase;
var codeGenNameConventions = {
  initDecodeDictionary: function(words) {
    var counter = {};
    words.forEach(function(w) {
      w = w.toLowerCase();
      counter[w] = (counter[w] || 0) + 1;
      var pw = pluralize(w);
      if (pw !== w) {
        counter[pw] = (counter[pw] || 0) + 0.5;
      }
    });

    var maxCnt = 1;
    for (var w in counter) {
      if (counter[w] > maxCnt) {
        maxCnt = counter[w];
      }
    }

    _decodeDict = merge(true, _decodeDictBase);
    for (var w in counter) {
      _decodeDict[w] = counter[w] / maxCnt;
    }
  },

  parseEndpointName: function(endpoint, boostWords, clsName) {
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
      return [
        'extended',
        'credit',
        'owning',
        'credit',
        'allocation',
        'configs',
      ];
    }

    var mergedDict = _decodeDict;
    if (boostWords) {
      mergedDict = merge(
        true,
        _decodeDict,
        boostWords.reduce(function(prev, curr) {
          prev[curr] = 10;
          var pluralWord = pluralize(curr);
          if (pluralWord !== curr) {
            prev[pluralWord] = 1;
          }
          return prev;
        }, {}),
      );
    }

    var lattice = {0: [0]};
    var candidates = [1];
    for (var index = 0; index < endpoint.length; ++index) {
      if (!candidates[index]) {
        continue;
      }

      var weight = lattice[index][0];
      // deal with the underscores in endpoints
      if (endpoint.charAt(index) === '_') {
        var newIndex = index + 1;
        if (!lattice[newIndex]) {
          lattice[newIndex] = [newWeight, '#'];
          candidates[newIndex] = 1;
        }
      }

      for (var word in mergedDict) {
        if (_startsWith(endpoint, word, index)) {
          var newIndex = index + word.length;
          var newWeight = weight + mergedDict[word];
          if (!lattice[newIndex] || lattice[newIndex][0] < newWeight) {
            lattice[newIndex] = [newWeight, word];
            candidates[newIndex] = 1;
          }
        }
      }
    }

    var parts = [];
    var endPost = endpoint.length;
    if (!lattice[endPost]) {
      throw Error(
        'cannot decode endpoint ' + endpoint + ' in class ' + clsName,
      );
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

  parseUnderscoreName: function(name) {
    if (!name) {
      return [];
    }
    if (!name.split) {
      return [String(name)];
    }
    return name.split(/[._:\s]/).map(function(part) {
      return part.toLowerCase();
    });
  },

  // The parsing of pascal name has a weird pitfall
  // If the pased name is normal pascal style, the returned parts will be all
  // lower case. If any part of the pascal name has all upper case, the return
  // part will keep all upper case. Which can cause confusion for later usage
  //
  // The one big issue is for ruby. Ruby assume the name are all capitalized
  // when autoload classes. Will just fix it for ruby case and keep this
  // behavior this time. Will fix after f8.
  parsePascalName: function(name) {
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
      EXPECT_ALL_UPPER_WORD: 2, // second char is also upper case in a word
    };
    var parts = [];
    var indexStart = 0;
    var parseStatus = STATUS.SEEN_WORD_START; // assert charAt(0) is upper case
    for (var i = 1; i < name.length; ++i) {
      var isUpper = _isCharUpper(name.charAt(i));
      switch (parseStatus) {
        case STATUS.SEEN_WORD_START:
          parseStatus = isUpper
            ? STATUS.EXPECT_ALL_UPPER_WORD
            : STATUS.EXPECT_PASCAL_WORD;
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

    var lastPart = name.substring(indexStart, name.length);
    if (parseStatus === STATUS.EXPECT_ALL_UPPER_WORD) {
      parts.push(lastPart);
    } else {
      parts.push(lastPart.toLowerCase());
    }
    return parts;
  },

  // Replace non (alphanumerical + _) to _
  removeIlligalChars: function(name) {
    return name.replace(/(_\W+)|(\W+_)|(\W+)/g, '_');
  },

  // strict_pascal means strictly first char upper and following lower.
  // See comments in parsePascalName
  populateNameConventions: function(obj, prop, parts, prefix, strict_pascal) {
    if (!parts || parts.length == 0) {
      return;
    }
    var lowerCaseParts = [];
    var capitalized = [];
    var strictCapitalized = [];
    for (var i in parts) {
      lowerCaseParts.push(parts[i].toLowerCase());
      capitalized.push(parts[i].charAt(0).toUpperCase() + parts[i].slice(1));
      strictCapitalized.push(
        parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase(),
      );
    }

    var hyphenName = lowerCaseParts.join('-');
    var underscoreName = lowerCaseParts.join('_');
    var upperCaseName = underscoreName.toUpperCase();
    var camelCaseName = lowerCaseParts[0];
    var pascalCaseName = capitalized[0];
    var strictPascalCaseName = strictCapitalized[0];
    var allLowerCaseName = lowerCaseParts[0];
    for (var i = 1; i < parts.length; ++i) {
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
    obj[prop + ':all_lower_case_excluding_digit_suffix'] = isNaN(
      underscoreName.charAt(0),
    )
      ? underscoreName
      : 'value_' + underscoreName;

    if (prefix) {
      obj[prefix + prop + ':hyphen'] = hyphenName;
      obj[prefix + prop + ':underscore'] = underscoreName;
      obj[prefix + prop + ':pascal_case'] = pascalCaseName;
      obj[prefix + prop + ':strict_pascal_case'] = strictPascalCaseName;
      obj[prefix + prop + ':camel_case'] = camelCaseName;
      obj[prefix + prop + ':upper_case'] = upperCaseName;
      obj[prefix + prop + ':all_lower_case'] = allLowerCaseName;
      obj[prefix + prop + ':all_lower_case_excluding_digit_suffix'] = isNaN(
        allLowerCaseName.charAt(0),
      )
        ? allLowerCaseName
        : 'value_' + allLowerCaseName;
    }
  },
  getAllCaseNames: function(parts) {
    var lowerCaseParts = [];
    var capitalized = [];
    for (var i in parts) {
      lowerCaseParts.push(parts[i].toLowerCase());
      capitalized.push(parts[i].charAt(0).toUpperCase() + parts[i].slice(1));
    }

    var hyphenName = lowerCaseParts.join('-');
    var underscoreName = lowerCaseParts.join('_');
    var upperCaseName = underscoreName.toUpperCase();
    var camelCaseName = lowerCaseParts[0];
    var pascalCaseName = capitalized[0];
    var allLowerCaseName = lowerCaseParts[0];
    for (var i = 1; i < parts.length; ++i) {
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
      all_lower_case: allLowerCaseName,
    };
  },
  populateNameConventionForUnderscoreProp: function(obj, prop) {
    var parts = this.parseUnderscoreName(obj[prop]);
    this.populateNameConventions(obj, prop, parts);
  },
  populateNameConventionForPascalProp: function(obj, prop) {
    var parts = this.parsePascalName(obj[prop]);
    this.populateNameConventions(obj, prop, parts);
  },
};

module.exports = codeGenNameConventions;
