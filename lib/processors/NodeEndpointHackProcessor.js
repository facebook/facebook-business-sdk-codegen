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


/**
 * We have special treatment for node APIs (i.e. GET/POST/DELETE on node)
 * Ideally these should be generated from API Specgen, but the current
 * status is that we use '#get' '#update' and '#delete' as name to indicate
 * it's an node endpoint.
 *
 * This processor normalizes these endpoints.
 * In addition, this processor also adds 'read_endpoint' to these nodes as
 * specified in codegen/api_specs/{version}/SDKCodegen.json
 */
const processor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        const name = APISpec.name;
        if (name === '#get') {
          APISpec.endpoint = '';
          APISpec.method = 'GET';
          APISpec.name = 'get';
          APISpec.return = clsName;
          APIClsSpec.has_get = true;
        } else if (name === '#update') {
          APISpec.endpoint = '';
          APISpec.method = 'POST';
          APISpec.name = 'update';
        } else if (name === '#delete') {
          APISpec.endpoint = '';
          APISpec.method = 'DELETE';
          APISpec.name = 'delete';
        }
      }
    }

    // handling read_endpoints
    const readEndpoints = metadata.mergedOverriding.read_endpoints;
    for (const clsName in readEndpoints) {
      if (APISpecs[clsName]) {
        APISpecs[clsName]['read_endpoint'] = readEndpoints[clsName];
      }
    }
    return specs;
  }
};

exports.default = processor;