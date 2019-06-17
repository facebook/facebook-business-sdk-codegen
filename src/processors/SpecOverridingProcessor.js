/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

// $FlowFixMe
import JSONPath from 'jsonpath-plus';

// $FlowFixMe
import {recursive} from 'merge';

import codeGenLanguages from './CodeGenLanguages';

import type {Processor} from '../common/types';

/**
 * Apply manual spec overriding from
 * codegen/api_specs/SDKCodegen.json
 */
const SpecOverridingProcessor: Processor = {
  process(specs, metadata) {
    const language: string = metadata.language || '';
    const flags = metadata.mergedOverriding.flags;
    let APISpecs = specs.api_specs;
    const languageDef = codeGenLanguages[language];
    const specOverriding = metadata.mergedOverriding.spec_overriding;
    for (const clsName in specOverriding) {
      for (const jsonPath in specOverriding[clsName]) {
        const value = specOverriding[clsName][jsonPath];
        const $ = APISpecs[clsName] || {};
        const evalPathes =
          jsonPath === '$'
            ? ['$']
            : JSONPath.eval($, jsonPath, {resultType: 'path'});
        if (evalPathes.length === 0) {
          throw new Error(
            'MUST_FIX: cannot find JSON path need to be patched.\n' +
              clsName +
              '::' +
              jsonPath,
          );
        }

        if (value === null) {
          // Delete
          evalPathes.forEach((path: string) => {
            // Find the parent path before it
            // Since all paths are of the form $[..][..][..] we only need
            // to remove the last [..]
            const lastBracketPos = path.lastIndexOf('[');
            if (lastBracketPos != -1) {
              const parentPath = path.substring(0, lastBracketPos);
              const evalParentValue = eval(parentPath);
              if (evalParentValue instanceof Array) {
                // since evalParentValue is an array, accessor must be a number
                const accessor = path.substring(
                  lastBracketPos + 1,
                  path.length - 1,
                );
                if (isNaN(Number(accessor))) {
                  throw new Error(
                    'Accessor for last element in array must ' +
                      'be integer but instead ' +
                      accessor,
                  );
                }
                evalParentValue.splice(Number(accessor), 1);
              } else {
                eval('delete ' + path);
              }
            }
          });
        } else {
          evalPathes.forEach((path: string) => {
            const evalValue = eval(path);
            if (evalValue instanceof Array) {
              if (value instanceof Array) {
                // Merge array
                evalValue.concat(value);
              } else {
                throw new Error(
                  'MUST_FIX: value must be array while path is array.\n' +
                    clsName +
                    '::' +
                    jsonPath,
                );
              }
            } else if (evalValue instanceof Object) {
              if (value instanceof Object) {
                // Merge object
                recursive(evalValue, value);
              } else {
                throw new Error(
                  'MUST_FIX: value must be object while path is object.\n' +
                    clsName +
                    '::' +
                    jsonPath,
                );
              }
            } else {
              eval(path + '=value');
            }
          });
        }
        APISpecs[clsName] = $;
      }
    }
    if (flags) {
      for (const clsName in APISpecs) {
        const cls_flags = flags[clsName];
        if (cls_flags) {
          for (const i in cls_flags) {
            APISpecs[clsName][cls_flags[i]] = true;
          }
        }
      }
    }
    if (languageDef.specOverrideProcessing) {
      APISpecs = languageDef.specOverrideProcessing(APISpecs);
    }
    return specs;
  },
};

export default SpecOverridingProcessor;
