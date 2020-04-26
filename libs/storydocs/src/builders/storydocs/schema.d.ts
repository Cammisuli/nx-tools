import { JsonObject } from '@angular-devkit/core';
import { CompodocBuilderSchema } from '@twittwer/compodoc';
import { StorybookBuilderOptions } from './storybook-schema';

export interface StorydocsBuilderSchema extends JsonObject {
  compodoc?: CompodocBuilderSchema;
  storybook?: StorybookBuilderOptions;

  quiet?: boolean;
}
