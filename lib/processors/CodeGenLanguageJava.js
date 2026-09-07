/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * @format
 * 
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const getBaseType = type => {
  return type.replace(/(^|^list\s*<\s*)([a-zA-Z0-9_\s]*)($|\s*>\s*$)/i, '$2');
};

const CodeGenLanguageJava = {
  formatFileName(clsName) {
    return clsName['name:pascal_case'] + '.java';
  },

  specOverrideProcessing(APISpecs) {
    // Handling fields that are gated by capabilities
    // There fields will break requestAllFields in Java SDK
    for (const className in APISpecs) {
      const APIClsSpec = APISpecs[className];
      for (const fieldIndex in APIClsSpec.fields) {
        let fieldSpec = APIClsSpec.fields[fieldIndex];
        fieldSpec.not_visible |= fieldSpec['java:not_visible'];
      }
    }
    return APISpecs;
  },

  preMustacheProcess(APISpecs, codeGenNameConventions, enumMetadataMap) {
    let javaBaseType;

    // Process APISpecs for Java
    // 1. type normalization
    // 2. enum type naming and referencing
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        for (const index2 in APISpec.params) {
          const paramSpec = APISpec.params[index2];
          /* when we have a param called 'params',
           * see GraphProductFeedRulesPost,
           * We will have two SetParams functions in the api. One is
           * to set all params for the api, which is of type
           * Map<String, Object>. Another is to set the individual parameter
           * named 'params'. If the type of the parameter is some kind of Map,
           * it will cause "have the same erasure" error in Java because
           * Java cannot distinguish different Map during runtime.
           * So we add a flag here to indicate the 'params' param and in
           * template, we generate it as SetParamParams to avoid conflict
           */
          if (paramSpec.name == 'params') {
            paramSpec.param_name_params = true;
          }
          if (['file', 'bytes', 'zipbytes'].indexOf(paramSpec.name) != -1) {
            APISpec.params[index2] = undefined;
            APISpec.allow_file_upload = true;
            continue;
          }
          if (paramSpec.type) {
            const baseType = getBaseType(paramSpec.type);
            if (enumMetadataMap[baseType]) {
              paramSpec.is_enum_param = true;
              const metadata = enumMetadataMap[baseType];
              if (!metadata.node) {
                if (!APIClsSpec.api_spec_based_enum_reference) {
                  APIClsSpec.api_spec_based_enum_reference = [];
                  APIClsSpec.api_spec_based_enum_list = {};
                }
                if (!APIClsSpec.api_spec_based_enum_list[metadata.field_or_param]) {
                  APIClsSpec.api_spec_based_enum_reference.push(metadata);
                  APIClsSpec.api_spec_based_enum_list[metadata.field_or_param] = true;
                }
                javaBaseType = 'Enum' + metadata['field_or_param:pascal_case'];
              } else {
                javaBaseType = metadata.node + '.Enum' + metadata['field_or_param:pascal_case'];
              }
              paramSpec['type:java'] = this.getTypeForJava(paramSpec.type.replace(baseType, javaBaseType));
              paramSpec['basetype:java'] = javaBaseType;
            } else {
              paramSpec['type:java'] = this.getTypeForJava(paramSpec.type);
              if (paramSpec['type:java'] == 'String') {
                paramSpec.is_string = true;
              }
            }
          }
        }
        if (APISpec.params) {
          APISpec.params = APISpec.params.filter(element => element != null);
        }
      }

      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];
        const fieldCls = APISpecs[fieldSpec.type];
        if (fieldCls && fieldCls.has_get && fieldCls.has_id) {
          fieldSpec.is_root_node = true;
        }
        if (fieldSpec.type) {
          if (enumMetadataMap[fieldSpec.type]) {
            fieldSpec.is_enum_field = true;
          }
          const baseType = getBaseType(fieldSpec.type);
          if (APISpecs[baseType]) {
            fieldSpec.is_node = true;
            fieldSpec['java:node_base_type'] = this.getTypeForJava(baseType);
          }
          if (enumMetadataMap[baseType]) {
            const metadata = enumMetadataMap[baseType];
            javaBaseType = 'Enum' + metadata['field_or_param:pascal_case'];
            fieldSpec['type:java'] = this.getTypeForJava(fieldSpec.type.replace(baseType, javaBaseType));
            if (!APIClsSpec.api_spec_based_enum_reference) {
              APIClsSpec.api_spec_based_enum_reference = [];
              APIClsSpec.api_spec_based_enum_list = {};
            }
            if (!APIClsSpec.api_spec_based_enum_list[metadata.field_or_param]) {
              APIClsSpec.api_spec_based_enum_reference.push(metadata);
              APIClsSpec.api_spec_based_enum_list[metadata.field_or_param] = true;
            }
          } else {
            if (fieldSpec.keyvalue) {
              fieldSpec['type:java'] = 'List<KeyValue>';
            } else if (fieldSpec.targeting_optimization_types) {
              fieldSpec['type:java'] = 'List<com.facebook.ads.sdk.customtype.TargetingOptimizationTuple>';
            } else {
              fieldSpec['type:java'] = this.getTypeForJava(fieldSpec.type);
            }
          }
        }
      }
    }
    return APISpecs;
  },

  getTypeForJava(type) {
    if (!type) {
      return null;
    }

    // This is not perfect. But it's working for all types we have so far.
    const typeMapping = {
      String: /string|datetime/gi,
      Boolean: /bool(ean)?/gi,
      Long: /(((unsigned\s*)?(\bint|long)))(?![a-zA-Z0-9_])/gi,
      Double: /(float|double)/gi,
      'List<$1>': /list\s*<\s*([a-zA-Z0-9_.<>,\s]*?)\s*>/g,
      '$1Map<String, String>$2': /(^|<)map($|>)/i,
      'Map<$1, $2>': /map\s*<\s*([a-zA-Z0-9_]*?)\s*,\s*([a-zA-Z0-9_<>, ]*?)\s*>/g
    };

    let oldType;
    let newType = type;
    while (oldType !== newType) {
      oldType = newType;
      for (const replace in typeMapping) {
        newType = newType.replace(typeMapping[replace], replace);
      }
    }
    // This is to make a type named as list to JsonArray.
    // However the 'list' should not be preceden by any word,
    // which might be 'blacklist', and should not be replaced
    newType = newType.replace(/(?<!\w)list(?!<)/g, 'JsonArray');
    newType = newType.replace(/^file$/i, 'File');
    // List<file> => List<File>
    newType = newType.replace(/<file>/i, '<File>');
    return newType;
  },
  keywords: ['try', 'private', 'public', 'new', 'default', 'class']
};

exports.default = CodeGenLanguageJava;
