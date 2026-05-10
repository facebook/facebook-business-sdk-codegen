/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * 
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const CodeGenUtil = {
  getBaseType(type) {
    return type.replace(/(^|^list\s*<\s*)([a-zA-Z0-9_\s]*)($|\s*>\s*$)/i, '$2');
  },

  preProcessMainTemplates(mainTemplates, clsSpec) {
    return mainTemplates.map(template => {
      const newTemplate = JSON.parse(JSON.stringify(template));
      newTemplate.content = newTemplate.content.replace(/{{\s*>.*(%([a-zA-Z:_]+)%).*}}/gi, (m, p1, p2) => m.replace(p1, clsSpec[p2]));
      return newTemplate;
    });
  },

  versionCompare(verA, verB) {
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
  }
};

exports.default = CodeGenUtil;