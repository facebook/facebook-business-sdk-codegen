/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const codeGenNameConventions = require('./CodeGenNameConventions');

/*
 * This processor adds 'flags' in the APISpecs which are needed when generating
 * the SDKs from templates. It does not change existing fields. It just add
 * flags for our convenience.
 *
 * Currently it adds these flags:
 * (1) 'cls_is_xxxx' flag
 * (2) versioned features
 * (3) 'is_method_get|post|delete'
 * (4) 'is_node_api' 'return_single_node'
 * (5) 'is_insights' 'is_insights_sync' 'is_insights_async'
 * (6) 'context'
 * (7) 'has_id' 'is_crud'
 */
var processor = {
  process: function(specs, metadata) {
    var APISpecs = specs.api_specs;
    var versionedFeatures = metadata.versionedFeatures;

    for (var clsName in APISpecs) {
      var APIClsSpec = APISpecs[clsName];
      APIClsSpec['name'] = clsName;
      APIClsSpec['cls_is_' + clsName] = true;
      // add versioned features for SDK
      APIClsSpec['version'] = versionedFeatures;
      for (var index in APIClsSpec['apis']) {
        var APISpec = APIClsSpec['apis'][index]
        var method = APISpec['method'];
        APISpec['is_method_get'] = (method === 'GET');
        APISpec['is_method_post'] = (method === 'POST');
        APISpec['is_method_delete'] = (method === 'DELETE');
        if (
          APISpec['name'] === 'get' ||
          APISpec['name'] === 'update' ||
          APISpec['name'] === 'delete'
        ) {
          APISpec['is_node_api'] = true;
          APISpec['return_single_node'] = true;
        }

        if (APISpec['endpoint'] === 'insights') {
          APISpec['is_insights'] = true;
          if (APISpec['method'] === 'GET') {
            APISpec['is_insights_sync'] = true;
          } else if (APISpec['method'] === 'POST') {
            APISpec['is_insights_async'] = true;
            APISpec['return_single_node'] = true;
          }
        } else {
          if (method === 'POST') {
            APISpec['return_single_node'] = true;
          }
        }
      }

      for (var index in APIClsSpec['fields']) {
        var fieldSpec = APIClsSpec['fields'][index];
        if (fieldSpec['name'] === 'id') {
          var parts = codeGenNameConventions.parsePascalName(clsName)
            .concat(['id']);
          fieldSpec['context'] = parts.join('_');
          APIClsSpec['has_id'] = true;
          APIClsSpec['is_crud'] = true;
        }
      }
    }

    return specs;
  }
}

module.exports = processor;
