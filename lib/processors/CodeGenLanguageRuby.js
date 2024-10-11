/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * 
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const typeStackToHash = typeStack => {
  const t = typeStack.shift();

  switch (t) {
    case 'list':
      if (typeStack.length > 0) {
        return '{ list: ' + typeStackToHash(typeStack) + ' }';
      } else {
        // handle list<list>, seems only AdImageCrop use this
        // we assume it's string
        return "{ list: 'string' }";
      }
    case 'enum':
      const enum_values = typeStack.shift();
      if (enum_values instanceof Array) {
        return '{ enum: %w{' + enum_values.join(' ') + ' }}';
      } else {
        return '{ enum: -> { ' + enum_values + ' }}';
      }
    default:
      return "'" + t + "'";
  }
};

const getTypeForRuby = (type, enumList, references) => {
  const typeStack = [];
  const listRegex = /^list(?:<(.*)>)?$/i;

  while (listRegex.test(type)) {
    typeStack.push('list');
    type = type.replace(listRegex, '$1');
  }

  // This is not perfect. But it's working for all types we have so far.
  const typeMapping = {
    string: /^string$/i,
    datetime: /^datetime$/i,
    bool: /^bool(ean)?$/i,
    int: /^(((unsigned\s*)?(int|long)))(?![a-zA-Z0-9_])$/i,
    double: /^(float|double)$/i,
    object: /^Object$/i,
    hash: /^map(?:\s*<\s*(?:[a-zA-Z0-9_]*)\s*,\s*(?:[a-zA-Z0-9_]*)\s*>)?$/i
  };

  for (const replace in typeMapping) {
    if (typeMapping[replace].test(type)) {
      typeStack.push(replace);
      type = type.replace(typeMapping[replace], '');
    }
  }

  if (enumList[type]) {
    typeStack.push('enum');
    typeStack.push(enumList[type]);
    type = '';
  }

  //non native, non enum type - should be other AdObject subclass
  if (type.length > 0) {
    if (references[type]) {
      typeStack.push(references[type]['names:strict_pascal_case']);
    } else {
      typeStack.push(type);
    }
  }

  return typeStackToHash(typeStack);
};

const CodeGenLanguageRuby = {
  formatFileName(clsName) {
    return clsName['name:underscore'] + '.rb';
  },

  preMustacheProcess(APISpecs) {
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];

      // Fields
      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];

        const enumList = {};
        for (const index2 in APIClsSpec.api_spec_based_enum_reference) {
          const enumSpec = APIClsSpec.api_spec_based_enum_reference[index2];
          enumList[enumSpec.name] = enumSpec['field_or_param:upper_case'];
        }

        const rubyType = getTypeForRuby(fieldSpec.type, enumList, APISpecs);

        fieldSpec['type:ruby'] = rubyType;
      }

      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];

        const enumList = {};
        for (const index2 in APISpec.referred_enums) {
          const enumSpec = APISpec.referred_enums[index2];
          if (enumSpec.metadata.node) {
            let node_name = enumSpec.metadata.node;
            if (APISpecs[node_name]) {
              node_name = APISpecs[node_name]['name:strict_pascal_case'];
            }
            enumList[enumSpec.metadata.name] = node_name + '::' + enumSpec.metadata['field_or_param:upper_case'];
          } else {
            enumList[enumSpec.metadata.name] = enumSpec.metadata.values;
          }
        }

        for (const index2 in APISpec.params) {
          const paramSpec = APISpec.params[index2];
          const rubyType = getTypeForRuby(paramSpec.type, enumList, APISpecs);
          paramSpec['type:ruby'] = rubyType;
        }

        if (APISpec.name == 'update' && APISpec.endpoint == '/') {
          APIClsSpec.has_update = true;
        }

        if (APISpec.name == 'delete' && APISpec.endpoint == '/') {
          APIClsSpec.has_delete = true;
        }
      }

      // Restructure Edges arrays
      let edgeArray = APIClsSpec.edges;
      const edgeObject = {};

      for (const index in APIClsSpec.edges) {
        const edgeSpec = APIClsSpec.edges[index];
        const edgeName = edgeSpec.endpoint.replace(/^\//, '');

        if (!edgeObject[edgeName]) {
          edgeObject[edgeName] = [];
        }
        edgeSpec['method:lower_case'] = edgeSpec.method.toLowerCase();

        if (edgeSpec.name == 'create_ad_image') {
          edgeSpec.return_a_list = true;
        }

        edgeObject[edgeName].push(edgeSpec);
      }

      edgeArray = [];
      for (const edgeName in edgeObject) {
        const edgeEndPoints = edgeObject[edgeName];
        edgeArray.push({
          edge_name: edgeName,
          end_points: edgeEndPoints
        });
      }

      APIClsSpec.edges = edgeArray;
    }

    return APISpecs;
  },
  getTypeForRuby: getTypeForRuby,
  keywords: ['class', 'begin', 'end', 'rescue', 'when', 'case', 'def', 'until', 'do']
};

exports.default = CodeGenLanguageRuby;