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

var _mustache = require('mustache');

var _CodeGenLanguageJava = require('./CodeGenLanguageJava');

var _CodeGenLanguageJava2 = _interopRequireDefault(_CodeGenLanguageJava);

var _CodeGenLanguageRuby = require('./CodeGenLanguageRuby');

var _CodeGenLanguageRuby2 = _interopRequireDefault(_CodeGenLanguageRuby);

var _CodeGenLanguageNodeJs = require('./CodeGenLanguageNodeJs');

var _CodeGenLanguageNodeJs2 = _interopRequireDefault(_CodeGenLanguageNodeJs);

var _CodeGenLanguageAdScripts = require('./CodeGenLanguageAdScripts');

var _CodeGenLanguageAdScripts2 = _interopRequireDefault(_CodeGenLanguageAdScripts);

var _CodeGenUtil = require('./CodeGenUtil');

var _CodeGenUtil2 = _interopRequireDefault(_CodeGenUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const generateFieldEnumReferences = (APISpecs, enumMetadataMap) => {
  for (const clsName in APISpecs) {
    const APIClsSpec = APISpecs[clsName];
    const fieldSpecs = APIClsSpec.fields;
    for (const fieldIndex in fieldSpecs) {
      const fieldSpec = fieldSpecs[fieldIndex];
      const baseType = _CodeGenUtil2.default.getBaseType(fieldSpec.type);
      if (enumMetadataMap[baseType]) {
        const type = enumMetadataMap[baseType]['field_or_param:pascal_case'];
        fieldSpec['type:short'] = fieldSpec.type.replace(baseType, type);
        continue;
      } else {
        fieldSpec['type:short'] = fieldSpec.type;
      }
    }
  }
// @fb-only


const CodeGenLanguages = {
  // @fb-only
  nodejs: _CodeGenLanguageNodeJs2.default,
  php: {
    formatFileName(clsName, template) {
      if (template.dir === '/src/FacebookAds/Object/Fields/') {
        return clsName['name:pascal_case'] + 'Fields.php';
      }
      return clsName['name:pascal_case'] + '.php';
    },
    preMustacheProcess(APISpecs, codeGenNameConventions, enumMetadataMap) {
      generateFieldEnumReferences(APISpecs, enumMetadataMap);
      for (const clsName in APISpecs) {
        const allEnumRefs = {};
        const ClsSpec = APISpecs[clsName];
        for (const index in ClsSpec.api_spec_based_enum_reference) {
          const enumMetadata = ClsSpec.api_spec_based_enum_reference[index];
          if (!enumMetadata.node) {
            continue;
          }
          const enumPHPClassName = enumMetadata['node:pascal_case'] + enumMetadata['field_or_param:pascal_case'] + 'Values';
          allEnumRefs[enumPHPClassName] = true;
        }
        for (const apiName in ClsSpec.apis) {
          const APISpec = ClsSpec.apis[apiName];
          for (const index in APISpec.referred_enums) {
            const enumMetadata = APISpec.referred_enums[index]['metadata'];
            if (!enumMetadata.node) {
              continue;
            }
            const enumPHPClassName = enumMetadata['node:pascal_case'] + enumMetadata['field_or_param:pascal_case'] + 'Values';
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

    generateFilenameToCodeMap(clsSpec, template, partialTemplates) {
      const filenameToCodeMap = {};
      if (template.dir === '/src/FacebookAds/Object/Values/') {
        if (!('api_spec_based_enum_reference' in clsSpec)) {
          return {};
        }
        const enumReferences = clsSpec.api_spec_based_enum_reference;
        enumReferences.forEach(enumReference => {
          const filename = enumReference['node:pascal_case'] + enumReference['field_or_param:pascal_case'] + 'Values.php';

          const code = (0, _mustache.render)(template.content, enumReference, partialTemplates);
          if (code && code.length > 0) {
            filenameToCodeMap[filename] = code;
          }
        });
      } else {
        const filename = this.formatFileName(clsSpec, template);

        const code = (0, _mustache.render)(template.content, clsSpec, partialTemplates);
        if (code && code.length > 0) {
          filenameToCodeMap[filename] = code;
        }
      }

      return filenameToCodeMap;
    },
    keywords: ['try', 'private', 'public', 'new', 'default', 'class', 'global', 'as', 'do', 'empty']
  },
  python: {
    formatFileName(clsName) {
      return clsName['name:all_lower_case'] + '.py';
    },
    preMustacheProcess(APISpecs, codeGenNameConventions, enumMetadataMap) {
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
    keywords: ['try', 'default', 'class', 'global', 'in', 'from', 'with', 'as', 'is']
  },
  java: _CodeGenLanguageJava2.default,
  ruby: _CodeGenLanguageRuby2.default
};

exports.default = CodeGenLanguages;