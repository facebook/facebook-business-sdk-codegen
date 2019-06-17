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
};

module.exports = Utils;
