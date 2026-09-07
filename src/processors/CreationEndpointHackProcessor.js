/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

/*
 * This processor is a hack for so-called 'creation endpoints'.
 * This is mainly for backward compatibility and we're deprecating the support
 * of it.
 * ===== Background =====
 * The creation endpoints is used in legacy Python and PHP SDK which
 * allows user to do something like:
 *   new AdCreative(parent_id)->setData(xxxx)->create()
 * When this happens, SDK automatically resolve it by knowing parent_id to be
 * an AdAccount ID and calls AdAccount/adcreatives (the creation endpoint) for
 * creation.
 * However, we prefer people to call AdAccount->createAdCreative() directly to
 * explicitly indicate which creation endpoint is desired, because in some
 * situations there could be multiple creation endpoints and the old-fashioned
 * creation syntax can be ambiguous.
 * ===== End of Background =====
 *
 * This processor tries to figure out the creation endpoints of nodes by
 * checking the return type of POST calls of certain nodes (clsWithCreationApi).
 * It will throw error if there are multiple creation endpoints for a node,
 * unless the preferred one is specified in codegen/api_specs/SDKCodegen.json
 */

import type {Processor} from '../common/types';

const processor: Processor = {
  process(specs, metadata) {
    const APISpecs = specs.api_specs;
    // Handling object creation endpoints
    const clsWithCreationApi = [
      'AdAccount',
      'Business',
      'ProductCatalog',
      'Hotel',
    ];
    for (let clsIndex = 0; clsIndex < clsWithCreationApi.length; clsIndex++) {
      const parentClsName = clsWithCreationApi[clsIndex];
      const parentClsSpec = APISpecs[parentClsName];
      if (!parentClsSpec) {
        continue;
      }
      for (const index in parentClsSpec.apis) {
        const APISpec = parentClsSpec.apis[index];
        // We check for POST method with return type
        if (APISpec.method === 'POST') {
          const createdCls = APISpec.return;
          if (createdCls && createdCls !== parentClsName) {
            const createdClsSpec = APISpecs[createdCls];
            const creationEndpoint = APISpec.endpoint;
            if (
              createdClsSpec &&
              !createdClsSpec.exclude_creation_endpoint &&
              creationEndpoint
            ) {
              if (createdClsSpec.creation_endpoint) {
                createdClsSpec.multi_creation_endpoints = true;
              }

              // we found multiple creation enpoints. only the one marked as
              // 'preferred_creation_endpoint' will be taken. Otherwise, throw
              if (
                !createdClsSpec.multi_creation_endpoints ||
                APISpec.preferred_creation_endpoint
              ) {
                createdClsSpec.creation_parent_class = parentClsSpec.name;
                createdClsSpec.creation_endpoint = creationEndpoint;
                createdClsSpec.creation_method = APISpec.name;
                if (APISpec.preferred_creation_endpoint) {
                  createdClsSpec.preferred_creation_endpoint =
                    APISpec.preferred_creation_endpoint;
                }
              }
              createdClsSpec.is_crud = true;
              if (APISpec.allow_file_upload) {
                createdClsSpec.creation_allow_file_upload = true;
              }
              // add creation params to fields
              for (const i in APISpec.params) {
                const param = APISpec.params[i];
                let fieldExists = false;
                for (const j in createdClsSpec.fields) {
                  if (param.name === createdClsSpec.fields[j]['name']) {
                    fieldExists = true;
                    break;
                  }
                }
                if (!fieldExists) {
                  createdClsSpec.fields.push({
                    name: param.name,
                    type: param.type,
                    api_name: param.api_name,
                    is_creation_field: true,
                  });
                }
              }
            }
          }
        }
      }
    } // End of creation handling

    return specs;
  },
};

export default processor;
