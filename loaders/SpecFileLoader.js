/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import path from 'path';
import Utils from './Utils';
import codeGenVersions from '../../api_specs/versions.json';
import CommonUtils from '../common/Utils';

import type {Loader} from '../common/types';

const SpecFileLoader: Loader = {
  load(version) {
    const APISpecDir = path.resolve(__dirname, '..', '..', 'api_specs');
    const overriddenAPISpecName = 'SDKCodegen';
    const overriddenAPISpecs = Utils.loadJSONFile(
      path.join(APISpecDir, overriddenAPISpecName + '.json'),
    );

    // Compute version features
    const versionedFeatures = {};
    const versionedFeaturesWithDepreciation = {};
    const codeGenFileDepreciationSign = CommonUtils.codeGenFileDepreciationSign;
    for (const currentVersion in codeGenVersions) {
      if (Utils.versionCompare(currentVersion, version) <= 0) {
        if (codeGenVersions[currentVersion]) {
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

export default SpecFileLoader;
