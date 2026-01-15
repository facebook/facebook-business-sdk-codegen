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

var _CodeGenNameConventions = require('./CodeGenNameConventions');

var _CodeGenNameConventions2 = _interopRequireDefault(_CodeGenNameConventions);

var _CodeGenUtil = require('./CodeGenUtil');

var _CodeGenUtil2 = _interopRequireDefault(_CodeGenUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This processor handles the references between nodes and enums.
 */
const ReferenceProcessor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;
    const enumMetadataMap = specs.enumMetadataMap;

    // add enum reference info into class specs
    for (const index in enumMetadataMap) {
      const enumType = enumMetadataMap[index];
      const nodeName = enumType.node;
      if (nodeName && APISpecs[nodeName]) {
        const clsSpec = APISpecs[nodeName];
        if (!clsSpec.api_spec_based_enum_reference) {
          clsSpec.api_spec_based_enum_reference = [];
          clsSpec.api_spec_based_enum_list = {};
        }
        if (clsSpec.api_spec_based_enum_list[enumType.field_or_param]) {
          // already exists. do nothing
        } else {
          clsSpec.api_spec_based_enum_reference.push(enumType);
          clsSpec.api_spec_based_enum_list[enumType.field_or_param] = true;
        }

        // todo: move all flagging logics into FlaggingProcessor
        if (nodeName === 'AdsInsights' && enumType.field_or_param === 'breakdowns') {
          clsSpec.breakdowns = enumType;
        }
      }
    }

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      _CodeGenNameConventions2.default.populateNameConventions(APISpecs[clsName], 'names', _CodeGenNameConventions2.default.parsePascalName(clsName));

      // Initialize references based on API return types
      const references = {};
      if (APIClsSpec.references) {
        APIClsSpec.references.forEach(ref => {
          const ref_cls_name = ref;
          references[ref_cls_name] = true;
        });
      }

      // Initialize field references
      const fieldReferences = {};

      // Process API class
      APIClsSpec.node = [];
      APIClsSpec.edges = [];
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        const apiReferencedEnumTypes = {};
        const apiClassReferences = {};

        let hasParamFields = false;
        const params = APISpec.params || [];
        for (const index in params) {
          const paramSpec = params[index];
          if (paramSpec.name === 'fields') {
            hasParamFields = true;
          }
          if (paramSpec.type) {
            paramSpec['type:short'] = paramSpec.type;
            const baseType = _CodeGenUtil2.default.getBaseType(paramSpec.type);
            if (APISpecs[baseType]) {
              APISpecs[baseType]['can_be_data_type'] = true;
            }
            if (enumMetadataMap[baseType]) {
              const enumParamName = paramSpec.name + '_enum';
              const metadata = enumMetadataMap[baseType];
              const enumType = {
                name: enumParamName,
                metadata: metadata
              };
              _CodeGenNameConventions2.default.populateNameConventions(enumType, 'name', _CodeGenNameConventions2.default.parseUnderscoreName(enumType.name));
              paramSpec['type:short'] = paramSpec.type.replace(baseType, enumParamName);
              apiReferencedEnumTypes[baseType] = enumType;
            }
          }
        }

        // Standardize endpoints starting with "/"
        if (APISpec.endpoint.charAt(0) !== '/') {
          APISpec.endpoint = '/' + APISpec.endpoint;
        }

        // Resolve return types
        const returnClsSpec = APISpecs[APISpec.return];
        if (returnClsSpec) {
          // Add "fields" field
          if (APISpec.method === 'GET' && !hasParamFields) {
            APISpec.param_fields = returnClsSpec.fields.filter(field => {
              return !field.is_creation_field;
            });
          } else {
            APISpec.param_fields = false;
          }
        } else {
          delete APISpec.return;
        }

        if (APISpec.return) {
          references[APISpec.return] = true;
          apiClassReferences[APISpec.return] = true;

          _CodeGenNameConventions2.default.populateNameConventions(APISpec, 'return', _CodeGenNameConventions2.default.parsePascalName(APISpec.return));
        }

        if (Object.keys(apiReferencedEnumTypes).length) {
          const apiReferencedEnumList = [];
          for (const key in apiReferencedEnumTypes) {
            apiReferencedEnumList.push(apiReferencedEnumTypes[key]);
            const cls = apiReferencedEnumTypes[key]['metadata']['node'];
            if (cls) {
              apiClassReferences[cls] = true;
            }
          }
          APISpec.referred_enums = apiReferencedEnumList;
        }

        APISpec.referred_classes = [];
        for (const refName in apiClassReferences) {
          if (refName !== clsName) {
            const refObj = {};
            _CodeGenNameConventions2.default.populateNameConventions(refObj, 'name', _CodeGenNameConventions2.default.parsePascalName(refName), 'api-ref:');
            APISpec.referred_classes.push(refObj);
          }
        }

        if (APISpec.is_node_api === true) {
          APIClsSpec.node.push(APISpec);
        } else {
          APIClsSpec.edges.push(APISpec);
        }
      }

      // Process references
      APIClsSpec.references = [];
      for (const refName in references) {
        // no self-reference
        // no self-reference after overrides
        if (refName !== clsName && refName !== APIClsSpec.name) {
          const refObj = {};
          _CodeGenNameConventions2.default.populateNameConventions(refObj, 'name', _CodeGenNameConventions2.default.parsePascalName(refName), 'ref:');
          APIClsSpec.references.push(refObj);
        }
      }

      // Pure data type or not
      const isDataType = !APIClsSpec.apis || APIClsSpec.apis.length == 0;
      APIClsSpec.data_type = isDataType;

      // Process fields of current object
      let hasIdField = false;
      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];
        if (fieldSpec.name === 'id') {
          hasIdField = true;
          fieldSpec.is_id_field = true;
        }
        const referenceType = getReferenceType(fieldSpec.type, APISpecs);
        if (referenceType !== null && referenceType !== undefined) {
          fieldReferences[referenceType] = true;
        }
      }

      // Process references
      APIClsSpec.field_references = [];
      for (const refName in fieldReferences) {
        // no self-reference
        // no self-reference after overrihs
        if (refName !== clsName && refName !== APIClsSpec.name) {
          const refObj = {};
          _CodeGenNameConventions2.default.populateNameConventions(refObj, 'name', _CodeGenNameConventions2.default.parsePascalName(refName), 'ref:');
          APIClsSpec.field_references.push(refObj);
        }
      }

      if (!isDataType && !hasIdField) {
        throw Error('Root nodes ' + clsName + ' must have the "id" field!');
      }
    }

    return specs;
  }
};

const getReferenceType = (type, APISpecs) => {
  if (type) {
    const referenceType = _CodeGenUtil2.default.getBaseType(type);
    if (referenceType in APISpecs) {
      return referenceType;
    }
  }

  return null;
};

exports.default = ReferenceProcessor;
