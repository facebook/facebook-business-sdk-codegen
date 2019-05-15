/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

/**
 * @typedef { import("../common/typedefs").Loader } Loader
 */

'use strict';

const path = require('path');
const Utils = require('./Utils');
const codeGenVersions = require('../api_specs/versions.json');
const CommonUtils = require('../common/Utils');

/**
 * @type {Loader}
 */
const SpecFileLoader = {
  load(version) {
    const APISpecDir = path.resolve(__dirname, '..', 'api_specs');
    const overriddenAPISpecName = 'SDKCodegen';
    const overriddenAPISpecs = Utils.loadJSONFile(
      path.join(APISpecDir, overriddenAPISpecName + '.json'),
    );

    // Compute version features
    var versionedFeatures = {};
    var versionedFeaturesWithDepreciation = {};
    const codeGenFileDepreciationSign = commonUtils.codeGenFileDepreciationSign;
    for (var currentVersion in codeGenVersions) {
      if (utils.versionCompare(currentVersion, version) <= 0) {
        if (codeGenVersions[currentVersion]) {
          /** @type {string[]} */
          const currentVersions = codeGenVersions[currentVersion];
          currentVersions.forEach(feature => {
            const hasFeatureName = 'has_' + feature;
            versionedFeatures[hasFeatureName] = true;
            versionedFeaturesWithDepreciation[hasFeatureName] = {
              '@remove_file': codeGenFileDepreciationSign,
            };
          });
        }
      }
    }

    // Load API specs
    const loadedAPISpecs = Utils.loadSpecsFromFile(APISpecDir);

    // merge versioned overridden API specs
    return {
      specs: loadedAPISpecs,
      metadata: {
        version: version,
        mergedOverriding: overriddenAPISpecs,
        versionedFeatures: versionedFeatures,
        versionedFeaturesWithDepreciation: versionedFeaturesWithDepreciation,
      },
    };
  },
};

module.exports = SpecFileLoader;
