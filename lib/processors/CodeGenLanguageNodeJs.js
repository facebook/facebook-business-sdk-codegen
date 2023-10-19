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
const CodeGenLanguageNodeJs = {
  formatFileName(clsName) {
    return clsName['name:hyphen'] + '.js';
  },

  preMustacheProcess(APISpecs, codeGenNameConventions, enumMetadataMap) {
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      let containsGenericReferece = false;
      let containsReadEdges = false;
      for (const index in APIClsSpec.apis) {
        const apiSpec = APIClsSpec.apis[index];
        if (!apiSpec.return) {
          containsGenericReferece = true;
        }
        if (apiSpec.method == 'GET' && apiSpec.endpoint != '/') {
          containsReadEdges = true;
        }
      }
      if (containsGenericReferece) {
        APIClsSpec.has_generic_reference = true;
      }
      if (containsReadEdges) {
        APIClsSpec.has_read_edges = true;
      }

      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];

        const enumList = {};
        const newEnumSpecList = [];
        for (const index2 in APIClsSpec.api_spec_based_enum_reference) {
          const enumSpec = APIClsSpec.api_spec_based_enum_reference[index2];
          if (enumSpec['field_or_param:all_lower_case'] != 'fields') {
            enumList[enumSpec.name] = enumSpec['field_or_param:all_lower_case'];
            newEnumSpecList.push(enumSpec);
          }
        }
        APIClsSpec.api_spec_based_enum_reference = newEnumSpecList;
      }
    }
    return APISpecs;
  },

  keywords: ['try', 'private', 'public', 'new', 'default', 'class', 'do']
};

exports.default = CodeGenLanguageNodeJs;