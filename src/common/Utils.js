/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict
 */

'use strict';

import fs from 'fs';
import path from 'path';

const Utils = {
  // special signature that can mark a codegen file should be removed.
  codeGenFileDepreciationSign:
    '@remove_depreciated_file@' + new Date().getTime().toString(),

  throwUsageError(message: mixed) {
    console.log(
      'Usage: codegen <language> [-v api_version] [-o output_path] [-c folder_to_cleanup]',
    );
    throw message;
  },

  validateLanguage(language: string) {
    const supportedLanguages = [
      // @fb-only
      'java',
      'nodejs',
      'php',
      'python',
      'ruby',
    ];
    if (!language) {
      this.throwUsageError(
        'language is not specified! available languages: ' +
          supportedLanguages.join(', '),
      );
    }

    if (supportedLanguages.indexOf(language) < 0) {
      this.throwUsageError(
        'unsupported language: ' +
          language +
          '! available languages: ' +
          supportedLanguages.join(', '),
      );
    }
  },

  loadDefaultVersion() {
    const fileName = 'api_specs/specs/version.txt';
    const filePath = path.resolve(__dirname, '..', '..', fileName);
    return fs.readFileSync(filePath, 'utf8').trim();
  },

  // keep same as https://fburl.com/diffusion/gicsfwu3
  loadDefaultSDKVersion(language: string): string {
    const filePaths = {
      java: 'sdk/servers/java/release/pom.xml',
      ruby: 'sdk/servers/ruby/release/lib/facebook_ads/version.rb',
      python: 'sdk/servers/python/release/setup.py',
      nodejs: 'sdk/servers/nodejs/release/package.json',
      php: 'sdk/servers/php/release/src/FacebookAds/ApiConfig.php',
    };
    const VERSION_LINE_STARTER = {
      java: '<version>',
      ruby: 'VERSION',
      python: 'PACKAGE_VERSION',
      nodejs: '"version"',
      php: 'const SDKVersion',
    }
    const fileName = filePaths[language];
    const filePath = path.resolve(__dirname, '..', '..', '..', fileName);
    var array = fs.readFileSync(filePath, 'utf8').toString().split("\n");

    for (let line of array) {
      if (line.trim().startsWith(VERSION_LINE_STARTER[language])) {
        let match = line.match(/^.*(\d+\.\d+\.\d+).*$/i);
        if (match) {
          return match[1];
        }
      }
    }

    return '';
  },
};

module.exports = Utils;
