/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

const merge = require('merge');
const path = require('path');

const utils = require('./Utils');
const commonUtils = require('../common/Utils');
const codeGenVersions = require('../api_specs/versions.json');

var SpecFileLoader = {
  load: function(version) {
    var APISpecDir = path.resolve(__dirname, '..', 'api_specs');
    var overriddenAPISpecName = 'SDKCodegen';
    var overriddenAPISpecs = utils.loadJSONFile(
      path.join(APISpecDir, overriddenAPISpecName + '.json'),
    );

    // Compute version features
    var versionedFeatures = {};
    var versionedFeaturesWithDepreciation = {};
    const codeGenFileDepreciationSign = commonUtils.getCodeGenFileDepreciationSign();
    for (var currentVersion in codeGenVersions) {
      if (utils.versionCompare(currentVersion, version) <= 0) {
        if (codeGenVersions[currentVersion]) {
          codeGenVersions[currentVersion].forEach(function(feature) {
            var hasFeatureName = 'has_' + feature;
            versionedFeatures[hasFeatureName] = true;
            versionedFeaturesWithDepreciation[hasFeatureName] = {
              '@remove_file': codeGenFileDepreciationSign,
            };
          });
        }
      }
    }

    // Load API specs
    var loadedAPISpecs = utils.loadSpecsFromFile(APISpecDir);

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
  isAsync: false,
};

module.exports = SpecFileLoader;
