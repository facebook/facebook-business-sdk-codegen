/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * @format
 * @flow
 */

'use strict';

const getBaseType = (type: string) => {
  return type.replace(/(^|^list\s*<\s*)([a-zA-Z0-9_\s]*)($|\s*>\s*$)/i, '$2');
};

const CodeGenLanguageCs = {
  formatFileName(clsName: {[x: string]: string}) {
    return clsName['name:pascal_case'] + '.cs';
  },

  specOverrideProcessing(APISpecs: {[x: string]: any}) {
    // Handling fields that are gated by capabilities
    // These fields might break requestAllFields in C# SDK
    for (const className in APISpecs) {
      const APIClsSpec = APISpecs[className];
      for (const fieldIndex in APIClsSpec.fields) {
        let fieldSpec = APIClsSpec.fields[fieldIndex];
        fieldSpec.not_visible |= fieldSpec['cs:not_visible'];
      }
    }
    return APISpecs;
  },

  preMustacheProcess(
    APISpecs: {[x: string]: any},
    codeGenNameConventions: any,
    enumMetadataMap: {[x: string]: any},
  ) {
    let csBaseType: string;

    // Process APISpecs for C#
    // 1. type normalization
    // 2. enum type naming and referencing
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        for (const index2 in APISpec.params) {
          const paramSpec = APISpec.params[index2];
          /* Similar to Java, when we have a param called 'params',
           * we add a flag to avoid conflicts with the general params Map
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
                if (
                  !APIClsSpec.api_spec_based_enum_list[metadata.field_or_param]
                ) {
                  APIClsSpec.api_spec_based_enum_reference.push(metadata);
                  APIClsSpec.api_spec_based_enum_list[
                    metadata.field_or_param
                  ] = true;
                }
                csBaseType = metadata['field_or_param:pascal_case'];
              } else {
                csBaseType = metadata['field_or_param:pascal_case'];
              }
              paramSpec['type:cs'] = this.getTypeForCs(
                paramSpec.type.replace(baseType, csBaseType),
              );
              paramSpec['basetype:cs'] = csBaseType;
            } else {
              paramSpec['type:cs'] = this.getTypeForCs(paramSpec.type);
              if (paramSpec['type:cs'] == 'string') {
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
            fieldSpec['cs:node_base_type'] = this.getTypeForCs(baseType);
          }
          if (enumMetadataMap[baseType]) {
            const metadata = enumMetadataMap[baseType];
            csBaseType = metadata['field_or_param:pascal_case'];
            fieldSpec['type:cs'] = this.getTypeForCs(
              fieldSpec.type.replace(baseType, csBaseType),
            );
            if (!APIClsSpec.api_spec_based_enum_reference) {
              APIClsSpec.api_spec_based_enum_reference = [];
              APIClsSpec.api_spec_based_enum_list = {};
            }
            if (!APIClsSpec.api_spec_based_enum_list[metadata.field_or_param]) {
              APIClsSpec.api_spec_based_enum_reference.push(metadata);
              APIClsSpec.api_spec_based_enum_list[
                metadata.field_or_param
              ] = true;
            }
          } else {
            if (fieldSpec.keyvalue) {
              fieldSpec['type:cs'] = 'Dictionary<string, object>';
            } else {
              fieldSpec['type:cs'] = this.getTypeForCs(fieldSpec.type);
            }
          }
        }
      }
    }
    return APISpecs;
  },

  getTypeForCs(type: string): ?string {
    if (!type) {
      return null;
    }

    // Type mapping for C#
    // C# uses nullable reference types (?), different naming for types
    const typeMapping = {
      'string': /string|datetime/gi,
      'bool': /bool(ean)?/gi,
      'long': /(((unsigned\s*)?(\bint|long)))(?![a-zA-Z0-9_])/gi,
      'double': /(float|double)/gi,
      'List<$1>': /list\s*<\s*([a-zA-Z0-9_.<>,\s]*?)\s*>/g,
      'Dictionary<string, object>': /(^|<)map($|>)/i,
      'Dictionary<$1, $2>': /map\s*<\s*([a-zA-Z0-9_]*?)\s*,\s*([a-zA-Z0-9_<>, ]*?)\s*>/g,
    };

    let oldType;
    let newType = type;
    while (oldType !== newType) {
      oldType = newType;
      for (const replace in typeMapping) {
        newType = newType.replace(typeMapping[replace], replace);
      }
    }

    // Replace 'list' with 'List<object>'
    newType = newType.replace(/(?<!\w)list(?!<)/g, 'List<object>');
    newType = newType.replace(/^file$/i, 'Stream');
    // List<file> => List<Stream>
    newType = newType.replace(/<file>/i, '<Stream>');
    return newType;
  },

  keywords: [
    'try',
    'catch',
    'finally',
    'private',
    'public',
    'protected',
    'internal',
    'new',
    'default',
    'class',
    'struct',
    'interface',
    'namespace',
    'async',
    'await',
  ],
};

export default CodeGenLanguageCs;
