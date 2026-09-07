/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * @format
 *  strict-local
 */

'use strict';

// $FlowFixMe

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Procedure = require('./common/Procedure');

var _Procedure2 = _interopRequireDefault(_Procedure);

var _Utils = require('./common/Utils');

var _Utils2 = _interopRequireDefault(_Utils);

var _SpecFileLoader = require('./loaders/SpecFileLoader');

var _SpecFileLoader2 = _interopRequireDefault(_SpecFileLoader);

var _AutoAddIdFieldForRootNodeProcessor = require('./processors/AutoAddIdFieldForRootNodeProcessor');

var _AutoAddIdFieldForRootNodeProcessor2 = _interopRequireDefault(_AutoAddIdFieldForRootNodeProcessor);

var _CreationEndpointHackProcessor = require('./processors/CreationEndpointHackProcessor');

var _CreationEndpointHackProcessor2 = _interopRequireDefault(_CreationEndpointHackProcessor);

var _FlaggingProcessor = require('./processors/FlaggingProcessor');

var _FlaggingProcessor2 = _interopRequireDefault(_FlaggingProcessor);

var _LanguageSpecificProcessor = require('./processors/LanguageSpecificProcessor');

var _LanguageSpecificProcessor2 = _interopRequireDefault(_LanguageSpecificProcessor);

var _NamingConventionProcessor = require('./processors/NamingConventionProcessor');

var _NamingConventionProcessor2 = _interopRequireDefault(_NamingConventionProcessor);

var _NodeEndpointHackProcessor = require('./processors/NodeEndpointHackProcessor');

var _NodeEndpointHackProcessor2 = _interopRequireDefault(_NodeEndpointHackProcessor);

var _NormalizationProcessor = require('./processors/NormalizationProcessor');

var _NormalizationProcessor2 = _interopRequireDefault(_NormalizationProcessor);

var _ReferenceProcessor = require('./processors/ReferenceProcessor');

var _ReferenceProcessor2 = _interopRequireDefault(_ReferenceProcessor);

var _SpecOverridingProcessor = require('./processors/SpecOverridingProcessor');

var _SpecOverridingProcessor2 = _interopRequireDefault(_SpecOverridingProcessor);

var _DebugJsonRenderer = require('./renderers/DebugJsonRenderer');

var _DebugJsonRenderer2 = _interopRequireDefault(_DebugJsonRenderer);

var _MustacheRenderer = require('./renderers/MustacheRenderer');

var _MustacheRenderer2 = _interopRequireDefault(_MustacheRenderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const procedure = new _Procedure2.default({
  loader: _SpecFileLoader2.default,
  processors: [_SpecOverridingProcessor2.default, _AutoAddIdFieldForRootNodeProcessor2.default, _NodeEndpointHackProcessor2.default, _NormalizationProcessor2.default, _FlaggingProcessor2.default, _CreationEndpointHackProcessor2.default, _NamingConventionProcessor2.default, _ReferenceProcessor2.default, _LanguageSpecificProcessor2.default],
  renderers: [_MustacheRenderer2.default, _DebugJsonRenderer2.default]
});

const args = (0, _minimist2.default)(process.argv.slice(2));

const language = args._[0];
_Utils2.default.validateLanguage(language);

const version = args.v || _Utils2.default.loadDefaultVersion();
const sdk_version = _Utils2.default.loadDefaultSDKVersion(language);
const outputDir = args.o || _path2.default.resolve(__dirname, '../../', './sdk/servers/' + language + '/release');
const cleandir = args.c ? args.c.split(',') : [];

procedure.run(version, sdk_version, language, outputDir, cleandir);