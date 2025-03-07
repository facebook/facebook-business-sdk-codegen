/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module '../../api_specs/versions.json' {
  declare type CodegenVersions = {
    [version: string]: string[],
  };

  declare module.exports: CodegenVersions;
}
