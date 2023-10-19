/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 *  strict-local
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _CodeGenNameConventions = require('./CodeGenNameConventions');

var _CodeGenNameConventions2 = _interopRequireDefault(_CodeGenNameConventions);

var _CodeGenLanguages = require('./CodeGenLanguages');

var _CodeGenLanguages2 = _interopRequireDefault(_CodeGenLanguages);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This processor populates naming convention for the APISpecs.
 * It parses the current value and adds different naming styles.
 *
 * The spec is translated like so
 * @example
 *
 * {"name": "HelloWorld"} =>
 *
 * {
 *   "name": "HelloWorld",
 *   "name:hyphen": "hello-world",
 *   "name:underscore": "hello_world",
 *   "name:pascal_case": "HelloWorld",
 *   "name:camel_case": "helloWorld",
 *   "name:upper_case": "HELLO_WORLD",
 *   "name:all_lower_case": "helloworld"
 * }
 */
const processor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;
    const language = metadata.language || '';
    const languageDef = _CodeGenLanguages2.default[language];

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      if (APIClsSpec.creation_parent_class) {
        _CodeGenNameConventions2.default.populateNameConventions(APIClsSpec, 'creation_parent_class', _CodeGenNameConventions2.default.parsePascalName(APIClsSpec.creation_parent_class));
      }
      if (APIClsSpec.creation_method) {
        _CodeGenNameConventions2.default.populateNameConventions(APIClsSpec, 'creation_method', _CodeGenNameConventions2.default.parseUnderscoreName(APIClsSpec.creation_method));
      }
    }

    // add naming convention for enums
    const enumMetadataMap = specs.enumMetadataMap;
    for (const index in enumMetadataMap) {
      const enumType = enumMetadataMap[index];
      const dedupchecker = {};
      if (enumType.node === 'AdReportRun') {
        // We want all insights enums to be in AdsInsights, not AdReportRun
        enumType.node = 'AdsInsights';
      }
      const valuesWithNamingConvention = [];
      for (const i in enumType.values) {
        const value = enumType.values[i];
        if (!value || value === '') {
          continue;
        }
        const entry = { value: value, is_irregular_name: false };
        if (languageDef.keywords.indexOf(value.toLowerCase()) > -1 || !value.match || !value.match(/^[a-zA-Z][a-zA-z0-9_]/)) {
          entry.is_irregular_name = true;
        }
        _CodeGenNameConventions2.default.populateNameConventions(entry, 'value', _CodeGenNameConventions2.default.parseUnderscoreName(_CodeGenNameConventions2.default.removeIlligalChars(entry.value)));
        if (!dedupchecker[entry.value.toUpperCase()]) {
          dedupchecker[entry.value.toUpperCase()] = true;
          valuesWithNamingConvention.push(entry);
        }
      }
      _CodeGenNameConventions2.default.populateNameConventions(enumType, 'field_or_param', _CodeGenNameConventions2.default.parseUnderscoreName(enumType.field_or_param));
      if (enumType.node) {
        _CodeGenNameConventions2.default.populateNameConventions(enumType, 'node', _CodeGenNameConventions2.default.parsePascalName(enumType.node));
      }
      enumType.values_with_naming_convention = valuesWithNamingConvention;
    }

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      _CodeGenNameConventions2.default.populateNameConventions(APIClsSpec, 'name', _CodeGenNameConventions2.default.parsePascalName(APIClsSpec.name), 'cls:');

      for (const index in APIClsSpec.apis) {
        const APISpec = APIClsSpec.apis[index];
        _CodeGenNameConventions2.default.populateNameConventions(APISpec, 'name', _CodeGenNameConventions2.default.parseUnderscoreName(APISpec.name), 'api:');

        const params = APISpec.params || [];
        for (const index in params) {
          const paramSpec = params[index];
          _CodeGenNameConventions2.default.populateNameConventions(paramSpec, 'name', _CodeGenNameConventions2.default.parseUnderscoreName(paramSpec.name), 'param:');
          if (paramSpec.context) {
            _CodeGenNameConventions2.default.populateNameConventions(paramSpec, 'context', _CodeGenNameConventions2.default.parseUnderscoreName(paramSpec.context));
          }

          if (languageDef.keywords.indexOf(paramSpec.name.toLowerCase()) > -1) {
            paramSpec.is_keyword = true;
          }
        }
        if (APISpecs[APISpec.return]) {
          _CodeGenNameConventions2.default.populateNameConventions(APISpec, 'return', _CodeGenNameConventions2.default.parsePascalName(APISpec.return));
        }
      }

      for (const index in APIClsSpec.fields) {
        const fieldSpec = APIClsSpec.fields[index];
        _CodeGenNameConventions2.default.populateNameConventions(fieldSpec, 'name', _CodeGenNameConventions2.default.parseUnderscoreName(fieldSpec.name), 'field:');
        if (fieldSpec.context) {
          _CodeGenNameConventions2.default.populateNameConventions(fieldSpec, 'context', _CodeGenNameConventions2.default.parseUnderscoreName(fieldSpec.context));
        }
        if (languageDef.keywords.indexOf(fieldSpec.name.toLowerCase()) > -1 || !/^[$A-Z_][0-9A-Z_$]*$/i.test(fieldSpec.name)) {
          // This is to mark field names that are either keywords or
          // is not a valid identifier. We need special treatment to use
          // them in codegen.
          fieldSpec.is_irregular_name = true;
        }
      }
    }
    return specs;
  }
};

exports.default = processor;