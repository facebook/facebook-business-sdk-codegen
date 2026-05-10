/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * @format
 * 
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const getBaseType = type => type.replace(/(^|^list\s*<\s*)([a-zA-Z0-9_\s]*)($|\s*>\s*$)/i, '$2');

const getTypeForCSharp = type => {
  if (!type) {
    return null;
  }

  // This is not perfect. But it's working for all types we have so far.
  const typeMapping = {
    string: /string|datetime/gi,
    bool: /bool(ean)?/gi,
    long: /(((unsigned\s*)?(int|long)))(?![a-zA-Z0-9_])/gi,
    double: /(float|double)/gi,
    'List<$1>': /list\s*<\s*([a-zA-Z0-9_]*)\s*>/gi,
    'Dictionary<$1, $2>': /map\s*<\s*([a-zA-Z0-9_]*)\s*,\s*([a-zA-Z0-9_]*)\s*>/gi,
    '$1Dictionary<string, string>$2': /(^|<)map($|>)/i
  };

  let oldType;
  let newType = type;
  while (oldType !== newType) {
    oldType = newType;
    for (const replace in typeMapping) {
      newType = newType.replace(typeMapping[replace], replace);
    }
  }
  newType = newType.replace(/list/g, 'List<object>');
  newType = newType.replace(/^file$/i, 'FileInfo');
  return newType;
};

const CodeGenLanguageCSharp = {
  formatFileName(clsName) {
    return clsName['name:pascal_case'] + '.cs';
  },

  preMustacheProcess(APISpecs, enumTypes, codeGenNameConventions) {
    // Process APISpecs for CSharp
    // 1. type normalization
    // 2. enum type naming and referencing
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      const clsReferencedEnumTypes = {};
      const nameConflictCheck = {
        /**
         * @param {string | number} enumName
         */
        hasConflict(enumName) {
          if (this[enumName] == undefined) {
            throw Error('Unexpected enum name!');
          }
          return this[enumName] >= 2;
        },
        /**
         * @param {string | number} enumName
         */
        add(enumName) {
          this[enumName] = this[enumName] || 0;
          this[enumName]++;
        }
      };
      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        for (const index2 in APISpec.params) {
          const paramSpec = APISpec.params[index2];
          if (['file', 'bytes', 'zipbytes'].indexOf(paramSpec.name) != -1) {
            APISpec.params[index2] = undefined;
            APISpec.allow_file_upload = true;
            continue;
          }
          if (paramSpec.type) {
            const baseType = getBaseType(paramSpec.type);
            const enumType = {};
            if (enumTypes[baseType]) {
              enumType.type = baseType;
              enumType.name = paramSpec.name;
              codeGenNameConventions.populateNameConventions(enumType, 'name', codeGenNameConventions.parseUnderscoreName(enumType.name));
              enumType['type:csharp:short'] = 'Enum' + enumType['name:pascal_case'];
              enumType['type:csharp:long'] = 'Enum' + (APISpec['return:pascal_case'] || APISpec['name:pascal_case'].replace(/^create(.*?)$/i, '$1')) + enumType['name:pascal_case'];
              enumType.obj = paramSpec;
              enumType.api_spec = APISpec;
              nameConflictCheck.add(enumType['type:csharp:short']);
              nameConflictCheck.add(enumType['type:csharp:long']);
              if (!clsReferencedEnumTypes[baseType]) {
                clsReferencedEnumTypes[baseType] = [enumType];
              } else {
                clsReferencedEnumTypes[baseType].push(enumType);
              }
            } else {
              paramSpec['type:csharp'] = getTypeForCSharp(paramSpec.type);
              if (paramSpec['type:csharp'] == 'string') {
                paramSpec.is_string = true;
              }
            }
          }
        }
        if (APISpec.params) {
          APISpec.params = APISpec.params.filter(element => {
            return element != null;
          });
        }
      }

      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];
        const fieldCls = APISpecs[fieldSpec.type];
        if (fieldCls && fieldCls.has_get && fieldCls.has_id) {
          fieldSpec.is_root_node = true;
        }
        if (fieldSpec.type) {
          const baseType = getBaseType(fieldSpec.type);
          // HACKHACK
          if (APISpecs[baseType] || baseType === 'Campaign' || baseType === 'AdSet') {
            fieldSpec.is_node = true;
            fieldSpec['csharp:node_base_type'] = getTypeForCSharp(baseType);
          } else {
            const baseCSType = getTypeForCSharp(baseType);
            fieldSpec['csharp:base_type'] = baseCSType;
            if (baseCSType === 'string') {
              fieldSpec.is_string_base_type = true;
            } else if (baseCSType === 'long') {
              fieldSpec.is_long_base_type = true;
            } else if (baseCSType === 'double') {
              fieldSpec.is_double_base_type = true;
            } else if (baseCSType === 'bool') {
              fieldSpec.is_bool_base_type = true;
            } else if (baseCSType === 'object' || baseCSType === 'Object') {
              fieldSpec.is_object_base_type = true;
            }
          }
          if (/^list</.test(fieldSpec.type)) {
            fieldSpec.is_list = true;
          } else if (/^map</.test(fieldSpec.type)) {
            fieldSpec.is_map = true;
          }
          if (enumTypes[baseType]) {
            const enumType = {
              type: baseType,
              name: fieldSpec.name
            };
            codeGenNameConventions.populateNameConventions(enumType, 'name', codeGenNameConventions.parseUnderscoreName(enumType.name));
            enumType['type:csharp:short'] = 'Enum' + enumType['name:pascal_case'];
            enumType['type:csharp:long'] = 'Enum' + APIClsSpec.name + enumType['name:pascal_case'];
            enumType.obj = fieldSpec;
            nameConflictCheck.add(enumType['type:csharp:short']);
            nameConflictCheck.add(enumType['type:csharp:long']);
            if (!clsReferencedEnumTypes[baseType]) {
              clsReferencedEnumTypes[baseType] = [enumType];
            } else {
              clsReferencedEnumTypes[baseType].push(enumType);
            }
          } else {
            fieldSpec['type:csharp'] = getTypeForCSharp(fieldSpec.type);
          }
        }
      }
      APIClsSpec.cls_referenced_enum_types = Object.keys(clsReferencedEnumTypes).map(key => {
        const enumType = clsReferencedEnumTypes[key][0];
        const baseType = enumType.type;
        const enumValues = [];
        for (const i in enumTypes[baseType]) {
          const apiValue = enumTypes[baseType][i];
          let csharpName = apiValue;
          if (apiValue.split) {
            const parts = [];
            apiValue.split(/[._:\s]/).map(
            /**
             * @param {{ toUpperCase: () => void; }} part
             */
            part => {
              parts.push(part.toUpperCase());
            });
            csharpName = parts.join('_');
            csharpName = csharpName.replace(/[^a-zA-Z0-9_]/g, '');
          }
          // this is to handle situations where we allow both
          // "IN_STOCK" and "in stock" (or similar) in api,
          // but we only need to support one in SDK because they
          // are the same.
          let valueExists = false;
          for (let i = 0; i < enumValues.length; i++) {
            if (enumValues[i]['csharp_name'] === csharpName) {
              valueExists = true;
              break;
            }
          }
          if (!valueExists) {
            enumValues.push({
              api_value: apiValue,
              csharp_name: csharpName
            });
          }
        }
        enumType.values = enumValues;

        let realName;
        let isApiEnum = false;
        if (clsReferencedEnumTypes[key].length > 1) {
          realName = enumType['type:csharp:short'];
        } else if (!nameConflictCheck.hasConflict(enumType['type:csharp:short'])) {
          realName = enumType['type:csharp:short'];
        } else if (!nameConflictCheck.hasConflict(enumType['type:csharp:long'])) {
          realName = enumType['type:csharp:long'];
        } else if (!enumType.api_spec) {
          realName = enumType['type:csharp:long'];
        } else {
          const apiSpec = enumType.api_spec;
          if (!apiSpec.api_referenced_enum_types) {
            apiSpec.api_referenced_enum_types = [enumType];
          } else {
            apiSpec.api_referenced_enum_types.push(enumType);
          }
          realName = enumType['type:csharp:short'];
          isApiEnum = true;
        }

        enumType['type:csharp'] = realName;
        clsReferencedEnumTypes[key].map(
        /**
         * @param {{ [x: string]: any; }} e
         */
        e => {
          const obj = e.obj;
          obj.is_enum = true;
          obj['type:csharp'] = getTypeForCSharp(obj.type.replace(baseType, enumType['type:csharp']));
          obj.is_enum = true;
          delete e.obj;
        });
        delete enumType['type:csharp:short'];
        delete enumType['type:csharp:long'];
        delete enumType.api_spec;
        return isApiEnum ? null : enumType;
      });
      APIClsSpec.cls_referenced_enum_types = APIClsSpec['cls_referenced_enum_types'].filter(
      /**
       * @param {null} element
       */
      element => {
        return element != null;
      });
    }
    return APISpecs;
  },
  getTypeForCSharp: getTypeForCSharp,
  keywords: ['try', 'private', 'public', 'new', 'default', 'class']
};

exports.default = CodeGenLanguageCSharp;