declare module '../../api_specs/versions.json' {
  declare type CodegenVersions = {
    [version: string]: string[],
  };

  declare module.exports: CodegenVersions;
}
