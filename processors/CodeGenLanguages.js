/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 */

var mustache = require('mustache');
var codegenLanguageJava = require('./CodeGenLanguageJava');
var codegenLanguageRuby = require('./CodeGenLanguageRuby');
var codegenLanguageNodeJs = require('./CodeGenLanguageNodeJs');
// @fb-only
var codeGenUtil = require('./CodeGenUtil');
var codeGenNameConventions = require('./CodeGenNameConventions');

var CodeGenLanguages = {
  // @fb-only
  nodejs: codegenLanguageNodeJs,
  php: {
    formatFileName: function(clsName, template) {
      if (template.dir === '/src/FacebookAds/Object/Fields/') {
        return clsName['name:pascal_case'] + 'Fields' + '.php';
      }
      return clsName['name:pascal_case'] + '.php';
    },
    preMustacheProcess: function(
      APISpecs,
      codeGenNameConventions,
      enumMetadataMap,
    ) {
      generateFieldEnumReferences(
        APISpecs,
        codeGenNameConventions,
        enumMetadataMap,
      );
      for (var clsName in APISpecs) {
        var allEnumRefs = {};
        var ClsSpec = APISpecs[clsName];
        for (var index in ClsSpec['api_spec_based_enum_reference']) {
          var enumMetadata = ClsSpec['api_spec_based_enum_reference'][index];
          if (!enumMetadata['node']) continue;
          var enumPHPClassName =
            enumMetadata['node:pascal_case'] +
            enumMetadata['field_or_param:pascal_case'] +
            'Values';
          allEnumRefs[enumPHPClassName] = true;
        }
        for (var apiName in ClsSpec['apis']) {
          var APISpec = ClsSpec['apis'][apiName];
          for (var index in APISpec['referred_enums']) {
            var enumMetadata = APISpec['referred_enums'][index]['metadata'];
            if (!enumMetadata['node']) continue;
            var enumPHPClassName =
              enumMetadata['node:pascal_case'] +
              enumMetadata['field_or_param:pascal_case'] +
              'Values';
            allEnumRefs[enumPHPClassName] = true;
          }
        }
        ClsSpec['php:all_referred_enum_names'] = [];
        for (var enumName in allEnumRefs) {
          ClsSpec['php:all_referred_enum_names'].push(enumName);
        }
        ClsSpec['php:all_referred_enum_names'].sort();
      }
      return APISpecs;
    },
    generateFilenameToCodeMap: function(clsSpec, template, partialTemplates) {
      var self = this;
      var filenameToCodeMap = {};
      if (template.dir === '/src/FacebookAds/Object/Values/') {
        if (!('api_spec_based_enum_reference' in clsSpec)) {
          return {};
        }
        var enumReferences = clsSpec['api_spec_based_enum_reference'];
        enumReferences.forEach(function(enumReference) {
          var filename =
            enumReference['node:pascal_case'] +
            enumReference['field_or_param:pascal_case'] +
            'Values.php';

          var code = mustache.render(
            template.content,
            enumReference,
            partialTemplates,
          );
          if (code && code.length > 0) {
            filenameToCodeMap[filename] = code;
          }
        });
      } else {
        var filename = self.formatFileName(clsSpec, template);

        var code = mustache.render(template.content, clsSpec, partialTemplates);
        if (code && code.length > 0) {
          filenameToCodeMap[filename] = code;
        }
      }

      return filenameToCodeMap;
    },
    keywords: ['try', 'private', 'public', 'new', 'default', 'class', 'global'],
  },
  python: {
    formatFileName: function(clsName) {
      return clsName['name:all_lower_case'] + '.py';
    },
    preMustacheProcess: function(
      APISpecs,
      codeGenNameConventions,
      enumMetadataMap,
    ) {
      for (var clsName in APISpecs) {
        var APIClsSpec = APISpecs[clsName];
        for (var index in APIClsSpec['fields']) {
          var fieldSpec = APIClsSpec['fields'][index];
          fieldSpec['index'] = index;
        }
      }

      generateFieldEnumReferences(
        APISpecs,
        codeGenNameConventions,
        enumMetadataMap,
      );
      return APISpecs;
    },
    keywords: ['try', 'default', 'class', 'global', 'in', 'from', 'with'],
  },
  java: codegenLanguageJava,
  ruby: codegenLanguageRuby,
};

function generateFieldEnumReferences(
  APISpecs,
  codeGenNameConventions,
  enumMetadataMap,
) {
  for (var clsName in APISpecs) {
    var APIClsSpec = APISpecs[clsName];
    var fieldSpecs = APIClsSpec['fields'];
    var fieldReferencedEnumTypes = {};
    for (var fieldIndex in fieldSpecs) {
      var fieldSpec = fieldSpecs[fieldIndex];
      var baseType = codeGenUtil.getBaseType(fieldSpec['type']);
      if (enumMetadataMap[baseType]) {
        var type = enumMetadataMap[baseType]['field_or_param:pascal_case'];
        fieldSpec['type:short'] = fieldSpec['type'].replace(baseType, type);
        continue;
      } else {
        fieldSpec['type:short'] = fieldSpec['type'];
      }
    }
  }
}
module.exports = CodeGenLanguages;
