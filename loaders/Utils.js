/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

var fs = require('fs');
var path = require('path');
var mustache = require('mustache');

var Utils = {
  loadJSONFile: function(fileName, keepComments) {
    var content = fs.readFileSync(fileName, 'utf8');
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
  loadSpecsFromFile: function(specDir) {
    // Load API specs
    var self = this;
    var specs = {};
    var enumMetadataMap = {};
    var versionedSpecDir = path.join(specDir, 'specs');
    fs.readdirSync(versionedSpecDir).forEach(function(file) {
      var match = file.match(/^([a-z0-9_\-\.]+)\.json$/i);
      if (match) {
        var name = match[1];
        var json = self.loadJSONFile(path.join(versionedSpecDir, file));
        if (name === 'enum_types') {
          json.forEach(function(enumType) {
            for (var i in enumType.values) {
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
  versionCompare: function(verA, verB) {
    if (verA.charAt(0) != 'v' || verB.charAt(0) != 'v') {
      throw new Error('invalid version number');
    }
    var partsA = verA.substring(1).split('.');
    var partsB = verB.substring(1).split('.');
    for (var i = 0; i < Math.max(partsA.length, partsB.length); ++i) {
      var numA = parseInt(partsA[i] || '-1');
      var numB = parseInt(partsB[i] || '-1');
      if (numA > numB) {
        return 1;
      } else if (numA < numB) {
        return -1;
      }
    }
    return 0;
  },
};

module.exports = Utils;
