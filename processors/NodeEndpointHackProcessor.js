/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

/*
 * We have special treatment for node APIs (i.e. GET/POST/DELETE on node)
 * Ideally these should be generated from API Specgen, but the current
 * status is that we use '#get' '#update' and '#delete' as name to indicate
 * it's an node endpoint.
 *
 * This processor normalizes these endpoints.
 * In addition, this processor also adds 'read_endpoint' to these nodes as
 * specified in codegen/api_specs/{version}/SDKCodegen.json
 */

var processor = {
  process: function(specs, metadata) {
    var APISpecs = specs.api_specs;
    for (var clsName in APISpecs) {
      var APIClsSpec = APISpecs[clsName];
      for (var index in APIClsSpec['apis']) {
        var APISpec = APIClsSpec['apis'][index];
        var name = APISpec['name'];
        if (name === '#get') {
          APISpec['endpoint'] = '';
          APISpec['method'] = 'GET';
          APISpec['name'] = 'get';
          APISpec['return'] = clsName;
          APIClsSpec['has_get'] = true;
        } else if (name === '#update') {
          APISpec['endpoint'] = '';
          APISpec['method'] = 'POST';
          APISpec['name'] = 'update';
        } else if (name === '#delete') {
          APISpec['endpoint'] = '';
          APISpec['method'] = 'DELETE';
          APISpec['name'] = 'delete';
        }
      }
    }

    // handling read_endpoints
    var readEndpoints = metadata.mergedOverriding.read_endpoints;
    for (var clsName in readEndpoints) {
      if (APISpecs[clsName]) {
        APISpecs[clsName]['read_endpoint'] = readEndpoints[clsName];
      }
    }
    return specs;
  },
};

module.exports = processor;
