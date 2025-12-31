/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import fs from 'fs';
import path from 'path';

import type {APIInputSpecs} from '../common/types';

const Utils = {
  loadJSONFile(fileName: string, keepComments: boolean = false) {
    let content = fs.readFileSync(fileName, 'utf8');
    if (!keepComments) {
      content = content.replace(/^\/\/.*\n/gm, '');
    }
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed ot parse json ', fileName);
      throw e;
    }
  },

  loadSpecsFromFile(specDir: string): APIInputSpecs {
    // Load API specs
    const specs = {};
    const enumMetadataMap = {};
    const versionedSpecDir = path.join(specDir, 'specs');
    fs.readdirSync(versionedSpecDir).forEach(file => {
      const match = file.match(/^([a-z0-9_\-\.]+)\.json$/i);
      if (match) {
        const name = match[1];
        /** @type {Array<{ values: { [x: string]: any }; name: string; }>} */
        const json = this.loadJSONFile(path.join(versionedSpecDir, file));
        if ('enum_types' === name) {
          json.forEach(enumType => {
            for (const i in enumType.values) {
              if (enumType.values[i].trim) {
                enumType.values[i] = enumType.values[i].trim();
              }
            }

            enumMetadataMap[enumType.name] = enumType;
          });
        } else {
          specs[name] = json;
        }
      }
    });
    return {
      api_specs: specs,
      enumMetadataMap: enumMetadataMap,
    };
  },
  versionCompare(verA: string, verB: string) {
    if (verA.charAt(0) != 'v' || verB.charAt(0) != 'v') {
      throw new Error('invalid version number');
    }
    const partsA = verA.substring(1).split('.');
    const partsB = verB.substring(1).split('.');
    for (let i = 0; i < Math.max(partsA.length, partsB.length); ++i) {
      const numA = parseInt(partsA[i] || '-1');
      const numB = parseInt(partsB[i] || '-1');
      if (numA > numB) {
        return 1;
      } else if (numA < numB) {
        return -1;
      }
    }
    return 0;
  },
};

export default Utils;
