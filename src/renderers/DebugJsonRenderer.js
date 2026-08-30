/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import fs from 'fs';
import path from 'path';

import type {Renderer} from '../common/types';

const DebugJsonRenderer: Renderer = {
  render(specs, language, version, outputDir, cleandir) {
    const outputFile = path.join(outputDir, 'compiled.json');
    fs.writeFileSync(outputFile, JSON.stringify(specs.APISpecs, null, 2));
  },
};

export default DebugJsonRenderer;
