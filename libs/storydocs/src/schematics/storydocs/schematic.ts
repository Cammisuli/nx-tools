import { chain, externalSchematic, Rule } from '@angular-devkit/schematics';
import { ProjectType, updateWorkspace } from '@nrwl/workspace';
import { StorydocsSchematicSchema } from './schema';
import { StorydocsBuilderSchema } from '@twittwer/storydocs';
import {
  ProjectDefinition,
  WorkspaceDefinition,
} from '@angular-devkit/core/src/workspace';

type TypedProjectDefinition = ProjectDefinition & { projectType: ProjectType };

function getProject(
  workspace: WorkspaceDefinition,
  projectName,
): TypedProjectDefinition {
  return workspace.projects.get(projectName) as TypedProjectDefinition;
}

function addStorydocsTarget(schema: StorydocsSchematicSchema): Rule {
  return updateWorkspace(workspace => {
    const projectDefinition = getProject(workspace, schema.project);

    projectDefinition.targets.set('storydocs', {
      builder: '@twittwer/storydocs:storydocs',
      options: {},
    });
  });
}

function configureCompodoc(schema: StorydocsSchematicSchema): Rule {
  return updateWorkspace(workspace => {
    const projectDefinition = getProject(workspace, schema.project);

    const hasCompodocTarget = projectDefinition.targets.has('compodoc');
    if (hasCompodocTarget) {
      return;
    }

    if (schema.externalCompodoc) {
      throw new Error(
        `Missing Compodoc target: The schematic was configured to use an existing Compodoc target, which could not be found.`,
      );
    }

    const tsConfig =
      projectDefinition.projectType === ProjectType.Application
        ? `${projectDefinition.root}/tsconfig.app.json`
        : `${projectDefinition.root}/tsconfig.lib.json`;
    const compodoc: Partial<StorydocsBuilderSchema['compodoc']> = {
      tsConfig,
    };

    const storydocsTarget = projectDefinition.targets.get('storydocs');
    storydocsTarget.options = {
      ...storydocsTarget.options,
      compodoc,
    };
  });
}

function configureStorybook(schema: StorydocsSchematicSchema): Rule {
  return updateWorkspace(workspace => {
    const projectDefinition = getProject(workspace, schema.project);

    const hasStorybookTarget = projectDefinition.targets.has('storybook');
    if (hasStorybookTarget) {
      return;
    }

    if (schema.externalStorybook) {
      throw new Error(
        `Missing Storybook target: The schematic was configured to use an existing Storybook target, which could not be found.`,
      );
    }

    const configFolder = `${projectDefinition.root}/.storybook`;
    const storybook: Partial<StorydocsBuilderSchema['storybook']> = {
      uiFramework: '@storybook/angular',
      port: 4400,
      config: { configFolder },
    };

    const storydocsTarget = projectDefinition.targets.get('storydocs');
    storydocsTarget.options = {
      ...storydocsTarget.options,
      storybook,
    };
  });
}

function addCypressProject(schema: StorydocsSchematicSchema): Rule[] {
  return [
    externalSchematic('@nrwl/storybook', 'cypress-project', {
      name: schema.project,
    }),
    updateWorkspace(workspace => {
      const e2eProjectDefinition = getProject(
        workspace,
        `${schema.project}-e2e`,
      );

      const e2eTarget = e2eProjectDefinition.targets.get('e2e');
      e2eProjectDefinition.targets.delete('e2e');
      e2eProjectDefinition.targets.set('e2e', {
        builder: e2eTarget.builder,
        options: {
          ...e2eTarget.options,
          devServerTarget: `${schema.project}:storydocs`,
        },
      });
    }),
  ];
}

export default function(schema: StorydocsSchematicSchema): Rule {
  return chain([
    addStorydocsTarget(schema),
    configureCompodoc(schema),
    configureStorybook(schema),
    ...(schema.configureCypress ? addCypressProject(schema) : []),
  ]);
}
