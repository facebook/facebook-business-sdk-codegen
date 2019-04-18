/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const pluralize = require('pluralize');
const codeGenNameConventions = require('./CodeGenNameConventions');
const codeGenLanguages = require('./CodeGenLanguages');

/*
 * This processor populates naming convention for the APISpecs.
 * It parses the current value and adds different naming styles.
 *
 * For example, if originally the spec is
 * {"name": "HelloWorld"}
 * It will now become:
 *{
 *   "name": "HelloWorld",
 *   "name:hyphen": "hello-world",
 *   "name:underscore": "hello_world",
 *   "name:pascal_case": "HelloWorld",
 *   "name:camel_case": "helloWorld",
 *   "name:upper_case": "HELLO_WORLD",
 *   "name:all_lower_case": "helloworld"
 * }
 */
var processor = {
  process: function(specs, metadata) {
    var APISpecs = specs.api_specs;
    var language = metadata.language;
    var languageDef = codeGenLanguages[language];

    for (var clsName in APISpecs) {
      var APIClsSpec = APISpecs[clsName];
      if (APIClsSpec['creation_parent_class']) {
        codeGenNameConventions.populateNameConventions(
          APIClsSpec,
          'creation_parent_class',
          codeGenNameConventions.parsePascalName(
            APIClsSpec['creation_parent_class']
          )
        );
      }
      if (APIClsSpec['creation_method']) {
        codeGenNameConventions.populateNameConventions(
          APIClsSpec,
          'creation_method',
          codeGenNameConventions.parseUnderscoreName(
            APIClsSpec['creation_method']
          )
        );
      }
    }

    // add naming convention for enums
    var enumMetadataMap = specs.enumMetadataMap;
    for (var index in enumMetadataMap) {
      var enumType = enumMetadataMap[index];
      var dedupchecker = {};
      if (enumType['node'] === 'AdReportRun') {
        // We want all insights enums to be in AdsInsights, not AdReportRun
        enumType['node'] = 'AdsInsights';
      }
      var valuesWithNamingConvention = [];
      for (var i in enumType['values']) {
        var value = enumType['values'][i];
        if (!value || value === '') continue;
        var entry = {value: value};
        if (languageDef.keywords.indexOf(value.toLowerCase()) > -1 ||
          !value.match ||
          !value.match(/^[a-zA-Z][a-zA-z0-9_]/)
        ) {
          entry['is_irregular_name'] = true;
        }
        codeGenNameConventions.populateNameConventions(
          entry,
          'value',
          codeGenNameConventions.parseUnderscoreName(
            codeGenNameConventions.removeIlligalChars(entry['value'])
          )
        );
        if (!dedupchecker[entry['value'].toUpperCase()]) {
          dedupchecker[entry['value'].toUpperCase()] = true;
          valuesWithNamingConvention.push(entry);
        }
      }
      codeGenNameConventions.populateNameConventions(
        enumType,
        'field_or_param',
        codeGenNameConventions.parseUnderscoreName(enumType['field_or_param'])
      );
      if (enumType['node']) {
        codeGenNameConventions.populateNameConventions(
          enumType,
          'node',
          codeGenNameConventions.parsePascalName(enumType['node'])
        );
      }
      enumType['values_with_naming_convention'] = valuesWithNamingConvention;
    }

    for (var clsName in APISpecs) {
      var APIClsSpec = APISpecs[clsName];
      codeGenNameConventions.populateNameConventions(
        APIClsSpec,
        'name',
        codeGenNameConventions.parsePascalName(APIClsSpec['name']),
        'cls:'
      );

      for (var index in APIClsSpec['apis']) {
        var APISpec = APIClsSpec['apis'][index];
        codeGenNameConventions.populateNameConventions(
          APISpec,
          'name',
          codeGenNameConventions.parseUnderscoreName(APISpec['name']),
          'api:'
        );

        var params = APISpec['params'] || [];
        for (var index in params) {
          var paramSpec = params[index];
          codeGenNameConventions.populateNameConventions(
            paramSpec,
            'name',
            codeGenNameConventions.parseUnderscoreName(paramSpec['name']),
            'param:'
          )
          if (paramSpec['context']) {
            codeGenNameConventions.populateNameConventions(
              paramSpec,
              'context',
              codeGenNameConventions.parseUnderscoreName(paramSpec['context'])
            );
          }

          if (languageDef.keywords.indexOf(paramSpec['name'].toLowerCase()) > -1) {
            paramSpec['is_keyword'] = true;
          }
        }
        if (APISpecs[APISpec['return']]) {
          codeGenNameConventions.populateNameConventions(
            APISpec,
            'return',
            codeGenNameConventions.parsePascalName(APISpec['return'])
          );
        }
      }

      for (var index in APIClsSpec['fields']) {
        var fieldSpec = APIClsSpec['fields'][index];
        codeGenNameConventions.populateNameConventions(
          fieldSpec,
          'name',
          codeGenNameConventions.parseUnderscoreName(fieldSpec['name']),
          'field:'
        );
        if (fieldSpec['context']) {
          codeGenNameConventions.populateNameConventions(
            fieldSpec,
            'context',
            codeGenNameConventions.parseUnderscoreName(fieldSpec['context'])
          );
        }
        if (languageDef.keywords.indexOf(fieldSpec['name'].toLowerCase()) > -1
          || !/^[$A-Z_][0-9A-Z_$]*$/i.test(fieldSpec['name'])
        ) {
          // This is to mark field names that are either keywords or
          // is not a valid identifier. We need special treatment to use
          // them in codegen.
          fieldSpec['is_irregular_name'] = true;
        }
      }
    }
    return specs;
  }
}

module.exports = processor;
