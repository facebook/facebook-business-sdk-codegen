/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {Processor} from '../common/types';

/*
 * This processor add id field to fields if the class contains apis, which
 * means it is a root node. This processor need to run earlier in the pipeline
 */
const AutoAddIdFieldForRootNodeProcessor: Processor = {
  process(specs) {
    const APISpecs = specs.api_specs;
    for (const clsName in APISpecs) {
      const APIClsSpec = APISpecs[clsName];
      let hasIdField = false;
      for (const index in APIClsSpec['fields']) {
        const fieldSpec = APIClsSpec['fields'][index];
        if (fieldSpec['name'] === 'id') {
          hasIdField = true;
          break;
        }
      }
      if (!hasIdField && APIClsSpec['apis'] && APIClsSpec['apis'].length > 0) {
        APIClsSpec['fields'].push({
          name: 'id',
          type: 'string',
        });
      }
    }

    return specs;
  },
};

export default AutoAddIdFieldForRootNodeProcessor;
