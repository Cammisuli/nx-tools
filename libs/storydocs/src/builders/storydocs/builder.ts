import {
  BuilderContext,
  BuilderOutput,
  BuilderRun,
  createBuilder,
  Target,
  targetFromTargetString,
} from '@angular-devkit/architect';
import { StorydocsBuilderSchema } from './schema';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

async function isTargetAvailable(
  target: Target,
  context: BuilderContext,
): Promise<boolean> {
  try {
    await context.getTargetOptions(target);
    return true;
  } catch (e) {
    return false;
  }
}

async function getCompodocRun(
  options: StorydocsBuilderSchema,
  context: BuilderContext,
): Promise<BuilderRun> {
  const compodocTarget = targetFromTargetString(
    `${context.target.project}:compodoc`,
  );
  const compodocBuilder = '@twittwer/compodoc:compodoc';

  const compodocOptions = {
    ...(options.compodoc as any),
    exportFormat: 'json',
  };

  if (await isTargetAvailable(compodocTarget, context)) {
    return context.scheduleTarget(compodocTarget, compodocOptions);
  } else if (!options.compodoc) {
    return Promise.reject(
      `Missing Compodoc configuration: Configuration is required if targeted project does not have a 'compodoc' target.`,
    );
  } else {
    return context.scheduleBuilder(compodocBuilder, compodocOptions, {
      target: context.target,
      logger: context.logger.createChild('Compodoc'),
    });
  }
}

async function getStorybookRun(
  options: StorydocsBuilderSchema,
  context: BuilderContext,
): Promise<BuilderRun> {
  const storybookTarget = targetFromTargetString(
    `${context.target.project}:storybook`,
  );
  const storybookBuilder = '@nrwl/storybook:storybook';

  const storybookOptions = {
    ...(options.storybook as any),
    config: {
      ...((options.storybook as any)?.config as any),
    },
  };

  if (await isTargetAvailable(storybookTarget, context)) {
    return context.scheduleTarget(storybookTarget, storybookOptions);
  } else if (!options.storybook) {
    return Promise.reject(
      `Missing Storybook configuration: Configuration is required if targeted project does not have a 'storybook' target.`,
    );
  } else {
    return context.scheduleBuilder(storybookBuilder, storybookOptions, {
      target: context.target,
      logger: context.logger.createChild('Storybook'),
    });
  }
}

export function runBuilder(
  options: StorydocsBuilderSchema,
  context: BuilderContext,
): Observable<BuilderOutput> {
  return of(null).pipe(
    switchMap(() => getCompodocRun(options, context)),
    switchMap(compodocRun => compodocRun.result),
    switchMap(() => getStorybookRun(options, context)),
    switchMap(storybookRun => storybookRun.output),
    catchError(
      (error): Observable<BuilderOutput> =>
        of({
          success: false,
          error,
        }),
    ),
  );
}

export default createBuilder(runBuilder);
