/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const codeGenLanguages = require('./CodeGenLanguages');

const JSONPath = require('jsonpath-plus');
const merge = require('merge');

/*
 * Apply manual spec overriding from
 * codegen/api_specs/SDKCodegen.json
 */
var SpecOverridingProcessor = {
  process: function(specs, metadata) {
    const language = metadata.language;
    var flags = metadata.mergedOverriding.flags;
    var languageDef = codeGenLanguages[language];
    var APISpecs = specs.api_specs;
    var enumTypes = specs.enumTypes;
    var enumMetadata = specs.enumMetadata;
    var languageDef = codeGenLanguages[language];
    var specOverriding = metadata.mergedOverriding.spec_overriding;
    for (var clsName in specOverriding) {
      for (var jsonPath in specOverriding[clsName]) {
        var value = specOverriding[clsName][jsonPath];
        var $ = APISpecs[clsName] || {};
        var evalPathes = (jsonPath === '$')
          ? ['$'] : JSONPath.eval($, jsonPath, {resultType: 'path'});
        if (evalPathes.length === 0) {
          throw new Error(
            'MUST_FIX: cannot find JSON path need to be patched.\n' +
            clsName + '::' + jsonPath
          );
        }

        if (value === null) {
          // Delete
          evalPathes.forEach(function(path) {
            // Find the parent path before it
            // Since all paths are of the form $[..][..][..] we only need
            // to remove the last [..]
            var lastBracketPos = path.lastIndexOf('[');
            if (lastBracketPos != -1) {
              var parentPath = path.substring(0, lastBracketPos);
              var evalParentValue = eval(parentPath);
              if (evalParentValue instanceof Array) {
                // since evalParentValue is an array, accessor must be a number
                var accessor = path.substring(lastBracketPos + 1,
                  path.length - 1);
                if (isNaN(accessor)) {
                  throw new Error('Accessor for last element in array must ' +
                    'be integer but instead ' + accessor);
                }
                evalParentValue.splice(accessor, 1);
              } else {
                eval('delete ' + path);
              }
            }
          });
        } else {
          evalPathes.forEach(function(path) {
            var evalValue = eval(path);
            if (evalValue instanceof Array) {
              if (value instanceof Array) {
                // Merge array
                evalValue.concat(value);
              } else {
                throw new Error(
                  'MUST_FIX: value must be array while path is array.\n' +
                  clsName + '::' + jsonPath
                );
              }
            } else if (evalValue instanceof Object) {
              if (value instanceof Object) {
                // Merge object
                merge.recursive(evalValue, value);
              } else {
                throw new Error(
                  'MUST_FIX: value must be object while path is object.\n' +
                  clsName + '::' + jsonPath
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
      for (var clsName in APISpecs) {
        var cls_flags = flags[clsName];
        if (cls_flags) {
          for (var i in cls_flags) {
            APISpecs[clsName][cls_flags[i]] = true;
          }
        }
      }
    }
    if (languageDef.specOverrideProcessing) {
      APISpecs = languageDef.specOverrideProcessing(APISpecs);
    }
    return specs;
  }
}

module.exports = SpecOverridingProcessor;
