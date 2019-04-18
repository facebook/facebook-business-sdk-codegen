/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const pluralize = require('pluralize');
const codeGenUtil = require('./CodeGenUtil');
const codeGenNameConventions = require('./CodeGenNameConventions');
var processor = {
  process: function(specs, metadata) {
    var APISpecs = specs.api_specs;
    var enumMetadataMap = specs.enumMetadataMap;

    var seenWords = [];
    for (var clsName in APISpecs) {
      seenWords = seenWords.concat(
        codeGenNameConventions.parsePascalName(clsName)
      );
      var APIClsSpec = APISpecs[clsName];
      for (var index in APIClsSpec['apis']) {
        var APISpec = APIClsSpec['apis'][index];
        if (APISpec['return']) {
          seenWords = seenWords.concat(
            codeGenNameConventions.parsePascalName(APISpec['return'])
          );
        }
      }
    }
    codeGenNameConventions.initDecodeDictionary(seenWords);

    for (var clsName in APISpecs) {
      var APIClsSpec = APISpecs[clsName];
      for (var index in APIClsSpec['apis']) {
        var APISpec = APIClsSpec['apis'][index]
        var name = APISpec['name'];
        if (!name) {
          var method = APISpec['method'];
          var parts = codeGenNameConventions.parseEndpointName(
            APISpec['endpoint'],
            codeGenNameConventions.parsePascalName(APISpec['return']),
            clsName
          );

          if (APISpec['endpoint'] === 'insights') {
            if (APISpec['method'] === 'GET') {
              APISpec['name'] = 'get_insights';
            } else if (APISpec['method'] === 'POST') {
              APISpec['name'] = 'get_insights_async';
            }
          } else {
            if (method === 'GET') {
              parts.unshift('get');
            } else if (method === 'POST') {
              parts.unshift('create');
              // Hack for Business node because it has /adaccount and /adaccounts
              if (clsName != 'Business' || APISpec['endpoint'] != 'adaccounts') {
                parts[parts.length - 1] = pluralize(parts[parts.length - 1], 1);
              }
            } else if (method === 'DELETE') {
              parts.unshift('delete');
            } else {
              throw Error('invalid edge method: ' + method);
            }
            APISpec['name'] = parts.join('_');
          }
        }

        var params = APISpec['params'] || [];
        for (var index in params) {
          var paramSpec = params[index];
          paramSpec['api_name'] = paramSpec['name'];
        }
      }

      for (var index in APIClsSpec['fields']) {
        var fieldSpec = APIClsSpec['fields'][index];
        fieldSpec['api_name'] = fieldSpec['name'];
        // Add field that is normalized and has an underscore.
        var fieldName = fieldSpec['name'].split('.').join('_');
        fieldSpec['api_name:underscore_excluding_digit_suffix'] = isNaN(
          fieldName.charAt(0))
          ? fieldName
          : 'value_' + fieldName;
      }
    }

    var enumMetadataMap = specs.enumMetadataMap;
    for (var index in enumMetadataMap) {
      var metadata = enumMetadataMap[index];
      if (!APISpecs[metadata['node']]) {
        metadata['node'] = null;
      }
    }

    return specs;
  }
}

module.exports = processor;
