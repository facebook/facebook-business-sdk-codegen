/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 *  strict
 */

'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _version_path = require('../../api_specs/version_path.json');

var _version_path2 = _interopRequireDefault(_version_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Utils = {
  // special signature that can mark a codegen file should be removed.
  codeGenFileDepreciationSign: '@remove_depreciated_file@' + new Date().getTime().toString(),

  throwUsageError(message) {
    console.log('Usage: codegen <language> [-v api_version] [-o output_path] [-c folder_to_cleanup]');
    throw message;
  },

  validateLanguage(language) {
    // @fb-only
    'java', 'nodejs', 'php', 'python', 'ruby'];
    if (!language) {
      this.throwUsageError('language is not specified! available languages: ' + supportedLanguages.join(', '));
    }

    if (supportedLanguages.indexOf(language) < 0) {
      this.throwUsageError('unsupported language: ' + language + '! available languages: ' + supportedLanguages.join(', '));
    }
  },

  loadDefaultVersion() {
    const fileName = 'api_specs/specs/version.txt';
    const filePath = _path2.default.resolve(__dirname, '..', '..', fileName);
    return _fs2.default.readFileSync(filePath, 'utf8').trim();
  },

  loadDefaultSDKVersion(language) {
    const fileName = _version_path2.default[language]['base_path'] + '/' + _version_path2.default[language]['file_path'];
    const filePath = _path2.default.resolve(__dirname, '..', '..', '..', fileName);
    var array = _fs2.default.readFileSync(filePath, 'utf8').toString().split("\n");

    for (let line of array) {
      if (line.trim().startsWith(_version_path2.default[language]['line_starter'])) {
        let match = line.match(/^.*?(\d+\.\d+\.\d+(\.\d+)?).*$/i);
        if (match) {
          return match[1];
        }
      }
    }

    throw 'Not able to find sdk version.';
  }
};

module.exports = Utils;