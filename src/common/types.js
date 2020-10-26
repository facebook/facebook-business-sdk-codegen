/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow
 */

'use strict';

export type APIInputMetadata = {
  version: string,
  sdk_version: string,
  language?: string,
  outputDir?: string,
  cleandir?: string[],
  mergedOverriding: any,
  versionedFeatures: any,
  versionedFeaturesWithDepreciation: any,
};

export type APIInputSpecs = {
  api_specs: any,
  enumMetadataMap: any,
};

export interface Renderer {
  render(
    specs: {|
      APISpecs: any,
      SDKConfig: {|
        api_specs?: any[],
        api_version: string,
        sdk_version: string,
        api_version_num_only: string,
        version: any,
      |},
    |},
    language: string,
    version: string,
    outputDir: string,
    cleandir: string[],
  ): void;
}

export interface Processor {
  process(specs: APIInputSpecs, metadata: APIInputMetadata): any;
}

export interface Loader {
  load(version: string, sdk_version: string): {|specs: APIInputSpecs, metadata: APIInputMetadata|};
}
