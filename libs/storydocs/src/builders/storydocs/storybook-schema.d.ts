import { JsonObject } from '@angular-devkit/core';

/**
 * Storybook Dev Builder Options
 *
 * Interfaces & schema.json are copied from the @nrwl/storybook builder
 * https://github.com/nrwl/nx/blob/master/packages/storybook/src/builders/storybook
 */

export interface StorybookConfig extends JsonObject {
  configFolder?: string;
  configPath?: string;
  pluginPath?: string;
  srcRoot?: string;
}

export interface StorybookBuilderOptions extends JsonObject {
  uiFramework: string;
  config: StorybookConfig;
  host?: string;
  port?: number;
  quiet?: boolean;
  ssl?: boolean;
  sslCert?: string;
  sslKey?: string;
  staticDir?: number[];
  watch?: boolean;
}
