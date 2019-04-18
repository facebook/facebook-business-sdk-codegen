/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

var fs = require('fs');
var path = require('path');
var mustache = require('mustache');

const codeGenFileDepreciationSign = '@remove_depreciated_file@' +
  new Date().getTime().toString();

var Utils = {
  getCodeGenFileDepreciationSign: function() {
    // special signature that can mark a codegen file should be removed.
    return codeGenFileDepreciationSign;
  },
  usage: function(message) {
    console.log('Usage: codegen <language> <api_version>');
    throw message;
  },
  validateLanguage: function(language) {
    const supportedLanguages = [
      // @fb-only
      'java',
      'nodejs',
      'php',
      'python',
      'ruby'
    ];
    if (!language) {
      this.usage(
        'language is not specified! available languages: ' +
        supportedLanguages.join(', ')
      );
    }

    if (supportedLanguages.indexOf(language) < 0) {
      this.usage(
        'unsupported language: ' + language + '! available languages: ' +
        supportedLanguages.join(', ')
      );
    }
  },
  loadDefaultVersion: function() {
    var fileName = path.resolve(__dirname, '..', 'api_specs/specs/version.txt');
    return fs.readFileSync(fileName, 'utf8').trim();
  },
};

module.exports = Utils;
