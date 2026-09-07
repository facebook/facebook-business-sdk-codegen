/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * @format
 * 
 */

'use strict';

// Any node whose name contains any of these strings will be omitted from the
// generated SDK code. Any edge whose return type's name contains any of these
// strings will also be omitted.

Object.defineProperty(exports, "__esModule", {
  value: true
});
const blacklistedNodes = ['CustomAudience', 'OfflineConversionDataSet'];

// Any edge with an endpoint exactly matching any of these strings will be
// omitted from the generated SDK code.
const blacklistedEdges = ['/audiencereplace', '/batchreplace', '/batchupload', '/partnerdata', '/partnerrequests', '/usermatch', '/usersofanyaudience'];

const isBlacklistedNode = name => blacklistedNodes.some(node => name.includes(node));

const isBlacklistedEdge = name => blacklistedEdges.some(edge => name == edge);

const CodeGenLanguageNodeJs = {
  formatFileName(clsName) {
    return clsName['name:hyphen'] + '.js';
  },

  preMustacheProcess(APISpecs, codeGenNameConventions, enumMetadataMap) {
    for (const clsName in APISpecs) {
      if (isBlacklistedNode(clsName)) {
        delete APISpecs[clsName];
        continue;
      }

      const APIClsSpec = APISpecs[clsName];
      if (APIClsSpec.apis !== undefined && APIClsSpec.apis !== null) {
        APIClsSpec.apis = APIClsSpec.apis.filter(apiSpec => {
          return (!apiSpec.return || !isBlacklistedNode(apiSpec.return)) && !isBlacklistedEdge(apiSpec.endpoint);
        });
      }

      for (const _index in APIClsSpec.fields) {
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

  keywords: ['try', 'private', 'public', 'new', 'default', 'class']
};

exports.default = CodeGenLanguageNodeJs;