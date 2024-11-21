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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Utils = require('./Utils');

var _Utils2 = _interopRequireDefault(_Utils);

var _versions = require('../../api_specs/versions.json');

var _versions2 = _interopRequireDefault(_versions);

var _Utils3 = require('../common/Utils');

var _Utils4 = _interopRequireDefault(_Utils3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const SpecFileLoader = {
  load(version, sdk_version) {
    const APISpecDir = _path2.default.resolve(__dirname, '..', '..', 'api_specs');
    const overriddenAPISpecName = 'SDKCodegen';
    const overriddenAPISpecs = _Utils2.default.loadJSONFile(_path2.default.join(APISpecDir, overriddenAPISpecName + '.json'));

    // Compute version features
    const versionedFeatures = {};
    const versionedFeaturesWithDepreciation = {};
    const codeGenFileDepreciationSign = _Utils4.default.codeGenFileDepreciationSign;
    for (const currentVersion in _versions2.default) {
      if (_Utils2.default.versionCompare(currentVersion, version) <= 0) {
        if (_versions2.default[currentVersion]) {
          const currentVersions = _versions2.default[currentVersion];
          currentVersions.forEach(feature => {
            const hasFeatureName = 'has_' + feature;
            versionedFeatures[hasFeatureName] = true;
            versionedFeaturesWithDepreciation[hasFeatureName] = {
              '@remove_file': codeGenFileDepreciationSign
            };
          });
        }
      }
    }

    // Load API specs
    const loadedAPISpecs = _Utils2.default.loadSpecsFromFile(APISpecDir);

    // merge versioned overridden API specs
    return {
      specs: loadedAPISpecs,
      metadata: {
        version: version,
        sdk_version: sdk_version,
        mergedOverriding: overriddenAPISpecs,
        versionedFeatures: versionedFeatures,
        versionedFeaturesWithDepreciation: versionedFeaturesWithDepreciation
      }
    };
  }
};

exports.default = SpecFileLoader;