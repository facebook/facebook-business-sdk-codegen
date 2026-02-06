/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow
 */

'use strict';

import {render} from 'mustache';
import codegenLanguageJava from './CodeGenLanguageJava';
import codegenLanguageRuby from './CodeGenLanguageRuby';
import codegenLanguageNodeJs from './CodeGenLanguageNodeJs';
import codegenLanguageCs from './CodeGenLanguageCs';
// @fb-only
import CodeGenUtil from './CodeGenUtil';

const generateFieldEnumReferences = (
  APISpecs: {[x: string]: any},
  enumMetadataMap: {[x: string]: {[x: string]: any}},
) => {
  for (const clsName in APISpecs) {
    const APIClsSpec = APISpecs[clsName];
    const fieldSpecs = APIClsSpec.fields;
    for (const fieldIndex in fieldSpecs) {
      const fieldSpec = fieldSpecs[fieldIndex];
      const baseType = CodeGenUtil.getBaseType(fieldSpec.type);
      if (enumMetadataMap[baseType]) {
        const type = enumMetadataMap[baseType]['field_or_param:pascal_case'];
        fieldSpec['type:short'] = fieldSpec.type.replace(baseType, type);
        continue;
      } else {
        fieldSpec['type:short'] = fieldSpec.type;
      }
    }
  }
};

const CodeGenLanguages = {
  // @fb-only
  nodejs: codegenLanguageNodeJs,
  php: {
    formatFileName(clsName: {[x: string]: string}, template: {dir: string}) {
      if (template.dir === '/src/FacebookAds/Object/Fields/') {
        return clsName['name:pascal_case'] + 'Fields.php';
      }
      return clsName['name:pascal_case'] + '.php';
    },
    preMustacheProcess(
      APISpecs: {[x: string]: any},
      codeGenNameConventions: any,
      enumMetadataMap: any,
    ) {
      generateFieldEnumReferences(APISpecs, enumMetadataMap);
      for (const clsName in APISpecs) {
        const allEnumRefs = {};
        const ClsSpec = APISpecs[clsName];
        for (const index in ClsSpec.api_spec_based_enum_reference) {
          const enumMetadata = ClsSpec.api_spec_based_enum_reference[index];
          if (!enumMetadata.node) {
            continue;
          }
          const enumPHPClassName =
            enumMetadata['node:pascal_case'] +
            enumMetadata['field_or_param:pascal_case'] +
            'Values';
          allEnumRefs[enumPHPClassName] = true;
        }
        for (const apiName in ClsSpec.apis) {
          const APISpec = ClsSpec.apis[apiName];
          for (const index in APISpec.referred_enums) {
            const enumMetadata = APISpec.referred_enums[index]['metadata'];
            if (!enumMetadata.node) {
              continue;
            }
            const enumPHPClassName =
              enumMetadata['node:pascal_case'] +
              enumMetadata['field_or_param:pascal_case'] +
              'Values';
            allEnumRefs[enumPHPClassName] = true;
          }
        }
        ClsSpec['php:all_referred_enum_names'] = [];
        for (const enumName in allEnumRefs) {
          ClsSpec['php:all_referred_enum_names'].push(enumName);
        }
        ClsSpec['php:all_referred_enum_names'].sort();
      }
      return APISpecs;
    },

    generateFilenameToCodeMap(
      clsSpec: {[x: string]: any},
      template: {dir: string, content: string},
      partialTemplates: any,
    ) {
      const filenameToCodeMap = {};
      if (template.dir === '/src/FacebookAds/Object/Values/') {
        if (!('api_spec_based_enum_reference' in clsSpec)) {
          return {};
        }
        const enumReferences = clsSpec.api_spec_based_enum_reference;
        enumReferences.forEach((enumReference: {[x: string]: string}) => {
          const filename =
            enumReference['node:pascal_case'] +
            enumReference['field_or_param:pascal_case'] +
            'Values.php';

          const code = render(
            template.content,
            enumReference,
            partialTemplates,
          );
          if (code && code.length > 0) {
            filenameToCodeMap[filename] = code;
          }
        });
      } else {
        const filename = this.formatFileName(clsSpec, template);

        const code = render(template.content, clsSpec, partialTemplates);
        if (code && code.length > 0) {
          filenameToCodeMap[filename] = code;
        }
      }

      return filenameToCodeMap;
    },
    keywords: ['try', 'private', 'public', 'new', 'default', 'class', 'global', 'as', 'do', 'empty'],
  },
  python: {
    formatFileName(clsName: {[x: string]: string}) {
      return clsName['name:all_lower_case'] + '.py';
    },
    preMustacheProcess(
      APISpecs: {[x: string]: any},
      codeGenNameConventions: any,
      enumMetadataMap: any,
    ) {
      for (const clsName in APISpecs) {
        const APIClsSpec = APISpecs[clsName];
        for (const index in APIClsSpec.fields) {
          const fieldSpec = APIClsSpec.fields[index];
          fieldSpec.index = index;
        }
      }

      generateFieldEnumReferences(APISpecs, enumMetadataMap);
      return APISpecs;
    },
    keywords: ['try', 'default', 'class', 'global', 'in', 'from', 'with', 'as', 'is'],
  },
  java: codegenLanguageJava,
  ruby: codegenLanguageRuby,
  csharp: codegenLanguageCs,
};

export default CodeGenLanguages;
