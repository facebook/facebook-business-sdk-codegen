/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

var fs = require('fs');
var path = require('path');
var mustache = require('mustache');

var CodeGenUtil = {
  getBaseType: function(type) {
    return type.replace(/(^|^list\s*<\s*)([a-zA-Z0-9_\s]*)($|\s*>\s*$)/i, '$2');
  },
  preProcessMainTemplates: function(mainTemplates, clsSpec) {
    var self = this;
    return mainTemplates.map(function(template) {
      var newTemplate = JSON.parse(JSON.stringify(template));
        newTemplate.content = newTemplate.content.replace(
        /{{\s*>.*(%([a-zA-Z:_]+)%).*}}/ig,
        function(m, p1, p2) {
          return m.replace(p1, clsSpec[p2]);
        }
      );
      return newTemplate;
    });
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
  }
};

module.exports = CodeGenUtil;
