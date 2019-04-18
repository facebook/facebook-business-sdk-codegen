/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

var CodeGenLanguageNodeJs = {
    formatFileName: function(clsName) {
      return clsName['name:hyphen'] + '.js';
    },
    preMustacheProcess: function (
      APISpecs,
      codeGenNameConventions,
      enumMetadataMap
    ) {
      for (var clsName in APISpecs) {
        var APIClsSpec = APISpecs[clsName];
        var containsGenericReferece = false;
        for (var index in APIClsSpec['apis']) {
          var apiSpec = APIClsSpec['apis'][index];
          if(!apiSpec.return) {
            containsGenericReferece = true;
          }
        }
        if(containsGenericReferece) {
          APIClsSpec['has_generic_reference'] = true;
        }

        for (var index in APIClsSpec['fields']) {
          var fieldSpec = APIClsSpec['fields'][index];

          var enumList = {};
          var newEnumSpecList = [];
          for (var index2 in APIClsSpec['api_spec_based_enum_reference']) {
            var enumSpec = APIClsSpec['api_spec_based_enum_reference'][index2];
            if (enumSpec['field_or_param:all_lower_case'] != 'fields') {
              enumList[enumSpec['name']] =
                enumSpec['field_or_param:all_lower_case'];
              newEnumSpecList.push(enumSpec);
            }
          }
          APIClsSpec['api_spec_based_enum_reference'] = newEnumSpecList;
        }
      }
      return APISpecs;
    },

    keywords: ['try', 'private', 'public', 'new', 'default', 'class']
  }

module.exports = CodeGenLanguageNodeJs;
