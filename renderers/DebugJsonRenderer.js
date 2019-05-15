/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

const fs = require('fs');
const path = require('path');

var DebugJsonRenderer = {};

DebugJsonRenderer.render = function(
  specs,
  language,
  version,
  outputDir,
  keepgit,
) {
  outputFile = path.join(outputDir, 'compiled.json');
  fs.writeFileSync(outputFile, JSON.stringify(specs['APISpecs'], null, 2));
};

module.exports = DebugJsonRenderer;
