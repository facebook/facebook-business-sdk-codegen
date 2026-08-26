/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 *  strict-local
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DebugJsonRenderer = {
  render(specs, language, version, outputDir, cleandir) {
    const outputFile = _path2.default.join(outputDir, 'compiled.json');
    _fs2.default.writeFileSync(outputFile, JSON.stringify(specs.APISpecs, null, 2));
  }
};

exports.default = DebugJsonRenderer;