/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const merge = require('merge');
const JSONPath = require('jsonpath-plus');
const path = require('path');
const pluralize = require('pluralize');

const codeGenNameConventions = require('./CodeGenNameConventions');
const codeGenUtil = require('./CodeGenUtil');

/*
 * This processor handles the references between nodes and enums.
 */
const ReferenceProcessor = {};
ReferenceProcessor.process = function(
  specs,
  metadata
) {
  var APISpecs = specs.api_specs;
  var enumMetadataMap = specs.enumMetadataMap;

  // add enum reference info into class specs
  for (var index in enumMetadataMap) {
    var enumType = enumMetadataMap[index];
    var nodeName = enumType['node'];
    if (nodeName && APISpecs[nodeName]) {
      var clsSpec = APISpecs[nodeName];
      if (!clsSpec['api_spec_based_enum_reference']) {
        clsSpec['api_spec_based_enum_reference'] = [];
        clsSpec['api_spec_based_enum_list'] = {}
      }
      if (clsSpec['api_spec_based_enum_list'][enumType['field_or_param']]) {
        // already exists. do nothing
      } else {
        clsSpec['api_spec_based_enum_reference'].push(enumType);
        clsSpec['api_spec_based_enum_list'][enumType['field_or_param']] = true;
      }
    }
  }

  for (var clsName in APISpecs) {
    var APIClsSpec = APISpecs[clsName];
    codeGenNameConventions.populateNameConventions(
      APISpecs[clsName],
      'names',
      codeGenNameConventions.parsePascalName(clsName)
    );

    // Initialize references based on API return types
    var references = {};
    if (APIClsSpec['references']) {
      APIClsSpec['references'].forEach(function(ref) {
        var ref_cls_name = ref;
        references[ref_cls_name] = true;
      });
    }

    // Initialize field references
    var fieldReferences = {};

    // Process API class
    APIClsSpec['node'] = [];
    APIClsSpec['edges'] = [];
    for (var index in APIClsSpec['apis']) {
      var APISpec = APIClsSpec['apis'][index];
      var apiReferencedEnumTypes = {};
      var apiClassReferences = {};

      var hasParamFields = false;
      var params = APISpec['params'] || [];
      for (var index in params) {
        var paramSpec = params[index];
        if (paramSpec['name'] === 'fields') {
          hasParamFields = true;
        }
        if (paramSpec['type']) {
          paramSpec['type:short'] = paramSpec['type'];
          var baseType = codeGenUtil.getBaseType(paramSpec['type']);
          if (APISpecs[baseType]) {
            APISpecs[baseType]['can_be_data_type'] = true;
          }
          if (enumMetadataMap[baseType]) {
            var enumParamName = paramSpec['name'] + "_enum";
            var metadata = enumMetadataMap[baseType];
            var enumType = {
              name: enumParamName,
              metadata: metadata
            };
            codeGenNameConventions.populateNameConventions(
              enumType,
              'name',
              codeGenNameConventions.parseUnderscoreName(enumType['name'])
            );
            paramSpec['type:short'] =
              paramSpec['type'].replace(baseType, enumParamName);
            apiReferencedEnumTypes[baseType] = enumType;
          }
        }
      }

      // Standardize endpoints starting with "/"
      if (APISpec['endpoint'].charAt(0) !== '/') {
        APISpec['endpoint'] = '/' + APISpec['endpoint'];
      }

      // Resolve return types
      var returnClsSpec = APISpecs[APISpec['return']];
      if (returnClsSpec) {
        // Add "fields" field
        if (APISpec['method'] === 'GET' && !hasParamFields) {
          APISpec['param_fields'] = returnClsSpec['fields'].filter(
            function(field) {
              return !field['is_creation_field'];
            }
          );
        } else {
          APISpec['param_fields'] = false;
        }
      } else {
        delete APISpec['return'];
      }

      if (APISpec['return']) {
        references[APISpec['return']] = true;
        apiClassReferences[APISpec['return']] = true;

        codeGenNameConventions.populateNameConventions(
          APISpec,
          'return',
          codeGenNameConventions.parsePascalName(APISpec['return'])
        );
      }

      if (Object.keys(apiReferencedEnumTypes).length) {
        var apiReferencedEnumList = [];
        for(var key in apiReferencedEnumTypes) {
          apiReferencedEnumList.push(apiReferencedEnumTypes[key]);
          var cls = apiReferencedEnumTypes[key]['metadata']['node'];
          if (cls) {
            apiClassReferences[cls] = true;
          }
        }
        APISpec['referred_enums'] = apiReferencedEnumList;
      }

      APISpec['referred_classes'] = [];
      for (var refName in apiClassReferences) {
        if (refName !== clsName) {
          var refObj = {};
          codeGenNameConventions.populateNameConventions(
            refObj,
            'name',
            codeGenNameConventions.parsePascalName(refName),
            'api-ref:'
          );
          APISpec['referred_classes'].push(refObj);
        }
      }

      if (APISpec['is_node_api'] === true) {
        APIClsSpec['node'].push(APISpec);
      } else {
        APIClsSpec['edges'].push(APISpec);
      }
    }

    // Process references
    APIClsSpec['references'] = [];
    for (var refName in references) {
      // no self-reference
      // no self-reference after overrides
      if (refName !== clsName && refName !== APIClsSpec['name']) {
        var refObj = {};
        codeGenNameConventions.populateNameConventions(
          refObj,
          'name',
          codeGenNameConventions.parsePascalName(refName),
          'ref:'
        );
        APIClsSpec['references'].push(refObj);
      }
    }

    // Pure data type or not
    var isDataType = !APIClsSpec['apis'] || APIClsSpec['apis'].length == 0;
    APIClsSpec['data_type'] = isDataType;

    // Process fields of current object
    var hasIdField = false;
    for (var index in APIClsSpec['fields']) {
      var fieldSpec = APIClsSpec['fields'][index];
      if (fieldSpec['name'] === 'id') {
        hasIdField = true;
        fieldSpec['is_id_field'] = true;
      }
      var referenceType = getReferenceType(fieldSpec['type'], APISpecs);
      if (referenceType) {
        fieldReferences[referenceType] = true;
      }
    }

    // Process references
    APIClsSpec['field_references'] = [];
    for (var refName in fieldReferences) {
      // no self-reference
      // no self-reference after overrihs
      if (refName !== clsName && refName !== APIClsSpec['name']) {
        var refObj = {};
        codeGenNameConventions.populateNameConventions(
          refObj,
          'name',
          codeGenNameConventions.parsePascalName(refName),
          'ref:'
        );
        APIClsSpec['field_references'].push(refObj);
      }
    }

    if (!isDataType && !hasIdField) {
      throw Error('Root nodes ' + clsName + ' must have the "id" field!');
    }
  }

  return specs;
};

const getReferenceType = function(type, APISpecs) {
  if (type) {
    referenceType = codeGenUtil.getBaseType(type);
    if (referenceType in APISpecs) {
      return referenceType;
    }
  }
};

module.exports = ReferenceProcessor;
