/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 * @flow
 */

'use strict';

import minimist from 'minimist';

import Procedure from './common/Procedure';
import Utils from './common/Utils';
import SpecFileLoader from './loaders/SpecFileLoader';
import AutoAddIdFieldForRootNodeProcessor from './processors/AutoAddIdFieldForRootNodeProcessor';
import CreationEndpointHackProcessor from './processors/CreationEndpointHackProcessor';
import FlaggingProcessor from './processors/FlaggingProcessor';
import LanguageSpecificProcessor from './processors/LanguageSpecificProcessor';
import NamingConventionProcessor from './processors/NamingConventionProcessor';
import NodeEndpointHackProcessor from './processors/NodeEndpointHackProcessor';
import NormalizationProcessor from './processors/NormalizationProcessor';
import ReferenceProcessor from './processors/ReferenceProcessor';
import SpecOverridingProcessor from './processors/SpecOverridingProcessor';
import DebugJsonRenderer from './renderers/DebugJsonRenderer';
import MustacheRenderer from './renderers/MustacheRenderer';

const procedure = new Procedure({
  loader: SpecFileLoader,
  processors: [
    SpecOverridingProcessor,
    AutoAddIdFieldForRootNodeProcessor,
    NodeEndpointHackProcessor,
    NormalizationProcessor,
    FlaggingProcessor,
    CreationEndpointHackProcessor,
    NamingConventionProcessor,
    ReferenceProcessor,
    LanguageSpecificProcessor,
  ],
  renderers: [MustacheRenderer, DebugJsonRenderer],
});

const args = minimist(process.argv.slice(2));

const language: string = args._[0];
Utils.validateLanguage(language);

const version: string = args.v || Utils.loadDefaultVersion();
const outputDir: string = args.o || 'sdk/servers/' + language + '/release';
const cleandir: string[] = args.c ? args.c.split(',') : [];

procedure.run(version, language, outputDir, cleandir);
