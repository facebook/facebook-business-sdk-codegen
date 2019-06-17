/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

/**
 * @typedef { import("../common/typedefs").Renderer } Renderer
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @type {Renderer}
 */
const DebugJsonRenderer = {
  render(specs, language, version, outputDir, cleandir) {
    const outputFile = path.join(outputDir, 'compiled.json');
    fs.writeFileSync(outputFile, JSON.stringify(specs['APISpecs'], null, 2));
  },
};

module.exports = DebugJsonRenderer;
