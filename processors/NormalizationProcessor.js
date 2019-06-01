/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

// $FlowFixMe
import pluralize from 'pluralize';
import codeGenNameConventions from './CodeGenNameConventions';

import type {Processor} from '../common/types';

const processor: Processor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;

    let seenWords: string[] = [];
    for (const clsName in APISpecs) {
      seenWords = seenWords.concat(
        codeGenNameConventions.parsePascalName(clsName),
      );
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec['apis']) {
        const APISpec = APIClsSpec['apis'][index];
        if (APISpec['return']) {
          seenWords = seenWords.concat(
            codeGenNameConventions.parsePascalName(APISpec['return']),
          );
        }
      }
    }
    codeGenNameConventions.initDecodeDictionary(seenWords);

    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      for (const index in APIClsSpec['apis']) {
        const APISpec = APIClsSpec['apis'][index];
        const name = APISpec['name'];
        if (!name) {
          const method = APISpec['method'];
          const parts = codeGenNameConventions.parseEndpointName(
            APISpec['endpoint'],
            codeGenNameConventions.parsePascalName(APISpec['return']),
            clsName,
          );

          if (APISpec['endpoint'] === 'insights') {
            if (APISpec['method'] === 'GET') {
              APISpec['name'] = 'get_insights';
            } else if (APISpec['method'] === 'POST') {
              APISpec['name'] = 'get_insights_async';
            }
          } else {
            if (method === 'GET') {
              parts.unshift('get');
            } else if (method === 'POST') {
              parts.unshift('create');
              // Hack for Business node because it has /adaccount and /adaccounts
              if (
                clsName != 'Business' ||
                APISpec['endpoint'] != 'adaccounts'
              ) {
                parts[parts.length - 1] = pluralize(parts[parts.length - 1], 1);
              }
            } else if (method === 'DELETE') {
              parts.unshift('delete');
            } else {
              throw Error('invalid edge method: ' + method);
            }
            APISpec['name'] = parts.join('_');
          }
        }

        const params = APISpec['params'] || [];
        for (const index in params) {
          const paramSpec = params[index];
          paramSpec['api_name'] = paramSpec['name'];
        }
      }

      for (const index in APIClsSpec['fields']) {
        const fieldSpec = APIClsSpec['fields'][index];
        fieldSpec['api_name'] = fieldSpec['name'];
        // Add field that is normalized and has an underscore.
        const fieldName = fieldSpec['name'].split('.').join('_');
        fieldSpec['api_name:underscore_excluding_digit_suffix'] = isNaN(
          fieldName.charAt(0),
        )
          ? fieldName
          : 'value_' + fieldName;
      }
    }

    const enumMetadataMap = specs.enumMetadataMap;
    for (const index in enumMetadataMap) {
      const metadata = enumMetadataMap[index];
      if (!APISpecs[metadata['node']]) {
        metadata['node'] = null;
      }
    }

    return specs;
  },
};

export default processor;
