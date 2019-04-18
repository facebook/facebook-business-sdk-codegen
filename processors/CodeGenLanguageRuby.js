/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const fs = require('fs');
const path = require('path');

var CodeGenLanguageRuby = {
  formatFileName: function(clsName) {
    return clsName['name:underscore'] + '.rb';
  },
  preMustacheProcess: function (
    APISpecs,
    enumTypes,
    codeGenNameConventions
  ) {
    for (var clsName in APISpecs) {
      var APIClsSpec = APISpecs[clsName];

      // Fields
      for (var index in APIClsSpec['fields']) {
        var fieldSpec = APIClsSpec['fields'][index];

        var enumList = {};
        for (var index2 in APIClsSpec['api_spec_based_enum_reference']) {
          var enumSpec = APIClsSpec['api_spec_based_enum_reference'][index2];
          enumList[enumSpec['name']] = enumSpec['field_or_param:upper_case'];
        }

        var rubyType = getTypeForRuby(
          fieldSpec['type'],
          enumList,
          APISpecs
        );

        fieldSpec['type:ruby'] = rubyType;
      }

      for (var index in APIClsSpec['apis']) {
        var APISpec = APIClsSpec['apis'][index];

        var enumList = {};
        for (var index2 in APISpec['referred_enums']) {
          var enumSpec = APISpec['referred_enums'][index2];
          if (enumSpec['metadata']['node']) {
            enumList[enumSpec['metadata']['name']] =
              enumSpec['metadata']['node'] + '::' +
              enumSpec['metadata']['field_or_param:upper_case'];
          } else {
            enumList[enumSpec['metadata']['name']] =
              enumSpec['metadata']['values'];
          }
        }

        for (var index2 in APISpec['params']) {
          var paramSpec = APISpec['params'][index2];
          var rubyType = getTypeForRuby(
            paramSpec['type'],
            enumList,
            APISpecs
          )
          paramSpec['type:ruby'] = rubyType;
        }

        if (APISpec['name'] == 'update' &&
            APISpec['endpoint'] == '/') {
          APIClsSpec['has_update'] = true;
        }

        if (APISpec['name'] == 'delete' &&
            APISpec['endpoint'] == '/') {
          APIClsSpec['has_delete'] = true;
        }
      }

      // Restructure Edges arrays
      var edgeArray = APIClsSpec['edges'];
      var edgeObject = {};

      for (var index in APIClsSpec['edges']) {
        var edgeSpec = APIClsSpec['edges'][index];
        var edgeName = edgeSpec['endpoint'].replace(/^\//,"");

        if (!edgeObject[edgeName]) {
          edgeObject[edgeName] = [];
        }
        edgeSpec['method:lower_case'] = edgeSpec['method'].toLowerCase();

        if (edgeSpec['name'] == 'create_ad_image') {
          edgeSpec['return_a_list'] = true;
        }

        edgeObject[edgeName].push(edgeSpec)
      }

      edgeArray = [];
      for (var edgeName in edgeObject) {
        edgeEndPoints = edgeObject[edgeName];
        edgeArray.push({
          edge_name: edgeName,
          end_points: edgeEndPoints
        })
      }

      APIClsSpec['edges'] = edgeArray;
    }

    return APISpecs;
  },
  getTypeForRuby: getTypeForRuby,
  keywords: ['class', 'begin', 'end', 'rescue', 'when', 'case', 'def', 'until']
}

function typeStackToHash(typeStack) {
  var t = typeStack.shift();

  switch (t) {
    case 'list':
      if (typeStack.length > 0) {
        return '{ list: ' + typeStackToHash(typeStack) + ' }';
      } else {
        // handle list<list>, seems only AdImageCrop use this
        // we assume it's string
        return '{ list: \'string\' }';
      }
    case 'enum':
      var enum_values = typeStack.shift();
      if (enum_values instanceof Array) {
        return '{ enum: %w{' + enum_values.join(' ') + ' }}';
      } else {
        return '{ enum: -> { ' + enum_values + ' }}';
      }
      break;
    default:
      return "'" + t + "'";
  }
}

function getTypeForRuby(type, enumList, references) {
  var typeStack = [];
  var listRegex = /^list(?:<(.*)>)?$/i;

  while (listRegex.test(type)) {
    typeStack.push('list');
    type = type.replace(listRegex, '$1')
  }

  // This is not perfect. But it's working for all types we have so far.
  var typeMapping = {};
  typeMapping['string'] = /^string$/i;
  typeMapping['datetime'] = /^datetime$/i;
  typeMapping['bool'] = /^bool(ean)?$/i;
  typeMapping['int'] = /^(((unsigned\s*)?(int|long)))(?![a-zA-Z0-9_])$/i;
  typeMapping['double'] = /^(float|double)$/i;
  typeMapping['object'] = /^Object$/i;
  typeMapping['hash'] = /^map(?:\s*<\s*(?:[a-zA-Z0-9_]*)\s*,\s*(?:[a-zA-Z0-9_]*)\s*>)?$/i;

  for (var replace in typeMapping) {
    if (typeMapping[replace].test(type)) {
      typeStack.push(replace);
      type = type.replace(typeMapping[replace], '');
    }
  }

  if (enumList[type]) {
    typeStack.push('enum');
    typeStack.push(enumList[type])
    type = '';
  }

  //non native, non enum type - should be other AdObject subclass
  if (type.length > 0) {
    if (references[type]) {
      typeStack.push(references[type]["names:strict_pascal_case"]);
    } else {
      typeStack.push(type);
    }
  }

  return typeStackToHash(typeStack);
}

module.exports = CodeGenLanguageRuby;
