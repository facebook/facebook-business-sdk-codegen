/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const fs = require('fs');
const path = require('path');

var DebugJsonRenderer = {};

DebugJsonRenderer.render = function(specs, language, version, outputDir, outputFile) {
  if (!outputFile) outputFile = path.join(outputDir, 'compiled.json');
  fs.writeFileSync(outputFile, JSON.stringify(specs['APISpecs'], null, 2));
};

module.exports = DebugJsonRenderer;
