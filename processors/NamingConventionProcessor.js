/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import codeGenNameConventions from './CodeGenNameConventions';
import codeGenLanguages from './CodeGenLanguages';

import type {Processor} from '../common/types';

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
const processor: Processor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;
    const language: string = metadata.language || '';
    const languageDef = codeGenLanguages[language];

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      if (APIClsSpec['creation_parent_class']) {
        codeGenNameConventions.populateNameConventions(
          APIClsSpec,
          'creation_parent_class',
          codeGenNameConventions.parsePascalName(
            APIClsSpec['creation_parent_class'],
          ),
        );
      }
      if (APIClsSpec['creation_method']) {
        codeGenNameConventions.populateNameConventions(
          APIClsSpec,
          'creation_method',
          codeGenNameConventions.parseUnderscoreName(
            APIClsSpec['creation_method'],
          ),
        );
      }
    }

    // add naming convention for enums
    const enumMetadataMap = specs.enumMetadataMap;
    for (const index in enumMetadataMap) {
      const enumType = enumMetadataMap[index];
      const dedupchecker = {};
      if (enumType['node'] === 'AdReportRun') {
        // We want all insights enums to be in AdsInsights, not AdReportRun
        enumType['node'] = 'AdsInsights';
      }
      const valuesWithNamingConvention = [];
      for (const i in enumType['values']) {
        const value = enumType['values'][i];
        if (!value || value === '') {
          continue;
        }
        const entry = {value: value, is_irregular_name: false};
        if (
          languageDef.keywords.indexOf(value.toLowerCase()) > -1 ||
          !value.match ||
          !value.match(/^[a-zA-Z][a-zA-z0-9_]/)
        ) {
          entry.is_irregular_name = true;
        }
        codeGenNameConventions.populateNameConventions(
          entry,
          'value',
          codeGenNameConventions.parseUnderscoreName(
            codeGenNameConventions.removeIlligalChars(entry['value']),
          ),
        );
        if (!dedupchecker[entry['value'].toUpperCase()]) {
          dedupchecker[entry['value'].toUpperCase()] = true;
          valuesWithNamingConvention.push(entry);
        }
      }
      codeGenNameConventions.populateNameConventions(
        enumType,
        'field_or_param',
        codeGenNameConventions.parseUnderscoreName(enumType['field_or_param']),
      );
      if (enumType['node']) {
        codeGenNameConventions.populateNameConventions(
          enumType,
          'node',
          codeGenNameConventions.parsePascalName(enumType['node']),
        );
      }
      enumType['values_with_naming_convention'] = valuesWithNamingConvention;
    }

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      codeGenNameConventions.populateNameConventions(
        APIClsSpec,
        'name',
        codeGenNameConventions.parsePascalName(APIClsSpec['name']),
        'cls:',
      );

      for (const index in APIClsSpec['apis']) {
        const APISpec = APIClsSpec['apis'][index];
        codeGenNameConventions.populateNameConventions(
          APISpec,
          'name',
          codeGenNameConventions.parseUnderscoreName(APISpec['name']),
          'api:',
        );

        const params = APISpec['params'] || [];
        for (const index in params) {
          const paramSpec = params[index];
          codeGenNameConventions.populateNameConventions(
            paramSpec,
            'name',
            codeGenNameConventions.parseUnderscoreName(paramSpec['name']),
            'param:',
          );
          if (paramSpec['context']) {
            codeGenNameConventions.populateNameConventions(
              paramSpec,
              'context',
              codeGenNameConventions.parseUnderscoreName(paramSpec['context']),
            );
          }

          if (
            languageDef.keywords.indexOf(paramSpec['name'].toLowerCase()) > -1
          ) {
            paramSpec['is_keyword'] = true;
          }
        }
        if (APISpecs[APISpec['return']]) {
          codeGenNameConventions.populateNameConventions(
            APISpec,
            'return',
            codeGenNameConventions.parsePascalName(APISpec['return']),
          );
        }
      }

      for (const index in APIClsSpec['fields']) {
        const fieldSpec = APIClsSpec['fields'][index];
        codeGenNameConventions.populateNameConventions(
          fieldSpec,
          'name',
          codeGenNameConventions.parseUnderscoreName(fieldSpec['name']),
          'field:',
        );
        if (fieldSpec['context']) {
          codeGenNameConventions.populateNameConventions(
            fieldSpec,
            'context',
            codeGenNameConventions.parseUnderscoreName(fieldSpec['context']),
          );
        }
        if (
          languageDef.keywords.indexOf(fieldSpec['name'].toLowerCase()) > -1 ||
          !/^[$A-Z_][0-9A-Z_$]*$/i.test(fieldSpec['name'])
        ) {
          // This is to mark field names that are either keywords or
          // is not a valid identifier. We need special treatment to use
          // them in codegen.
          fieldSpec['is_irregular_name'] = true;
        }
      }
    }
    return specs;
  },
};

export default processor;
