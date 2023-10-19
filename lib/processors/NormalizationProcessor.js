/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 *  strict-local
 */

'use strict';

// $FlowFixMe

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _CodeGenNameConventions = require('./CodeGenNameConventions');

var _CodeGenNameConventions2 = _interopRequireDefault(_CodeGenNameConventions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const processor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;

    let seenWords = [];
    for (const clsName in APISpecs) {
      seenWords = seenWords.concat(_CodeGenNameConventions2.default.parsePascalName(clsName));
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        if (APISpec.return) {
          seenWords = seenWords.concat(_CodeGenNameConventions2.default.parsePascalName(APISpec.return));
        }
      }
    }
    _CodeGenNameConventions2.default.initDecodeDictionary(seenWords);

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        const name = APISpec.name;
        if (!name) {
          const method = APISpec.method;
          const parts = _CodeGenNameConventions2.default.parseEndpointName(APISpec.endpoint, _CodeGenNameConventions2.default.parsePascalName(APISpec.return), clsName);

          if (APISpec.endpoint === 'insights') {
            if (APISpec.method === 'GET') {
              APISpec.name = 'get_insights';
            } else if (APISpec.method === 'POST') {
              APISpec.name = 'get_insights_async';
            }
          } else {
            if (method === 'GET') {
              parts.unshift('get');
            } else if (method === 'POST') {
              parts.unshift('create');
              // Hack for Business node because it has /adaccount and /adaccounts
              if (clsName != 'Business' || APISpec.endpoint != 'adaccounts') {
                parts[parts.length - 1] = (0, _pluralize2.default)(parts[parts.length - 1], 1);
              }
            } else if (method === 'DELETE') {
              parts.unshift('delete');
            } else {
              throw Error('invalid edge method: ' + method);
            }
            APISpec.name = parts.join('_');
          }
        }

        const params = APISpec.params || [];
        for (const index in params) {
          const paramSpec = params[index];
          paramSpec.api_name = paramSpec.name;
        }
      }

      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];
        fieldSpec.api_name = fieldSpec.name;
        // Add field that is normalized and has an underscore.
        const fieldName = fieldSpec.name.split('.').join('_');
        fieldSpec['api_name:underscore_excluding_digit_suffix'] = isNaN(fieldName.charAt(0)) ? fieldName : 'value_' + fieldName;
      }
    }

    const enumMetadataMap = specs.enumMetadataMap;
    for (const index in enumMetadataMap) {
      const metadata = enumMetadataMap[index];
      if (!APISpecs[metadata.node]) {
        metadata.node = null;
      }
    }

    return specs;
  }
};

exports.default = processor;