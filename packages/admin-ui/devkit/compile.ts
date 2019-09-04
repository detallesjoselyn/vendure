import { AdminUiExtension } from '@vendure/common/lib/shared-types';
import { exec, spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

const EXTENSIONS_DIR = path.join(__dirname, '../src/app/extensions');
const EXTENSIONS_MODULES_DIR = 'modules';

const originalExtensionsModuleFile = path.join(EXTENSIONS_DIR, 'extensions.module.ts');
const tempExtensionsModuleFile = path.join(EXTENSIONS_DIR, 'extensions.module.ts.temp');

/**
 * Builds the admin-ui app using the Angular CLI `ng build --prod` command.
 */
export function compileAdminUiApp(outputPath: string, extensions: Array<Required<AdminUiExtension>>) {
    const cwd = path.join(__dirname, '..');
    const relativeOutputPath = path.relative(cwd, outputPath);
    return new Promise((resolve, reject) => {
        deleteExistingExtensionModules();
        copyExtensionModules(extensions);
        createExtensionsModule(extensions);

        const buildProcess = spawn(
            'yarn',
            [
                'build',
                /*'--prod=true', */
                `--outputPath=${relativeOutputPath}`,
            ],
            {
                cwd,
                shell: true,
                stdio: 'inherit',
            },
        );
        buildProcess.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(code);
            }
        });
        buildProcess.on('error', err => {
            reject(err);
        });
    }).finally(() => {
        restoreOriginalExtensionsModule();
    });
}

function deleteExistingExtensionModules() {
    fs.removeSync(path.join(EXTENSIONS_DIR, EXTENSIONS_MODULES_DIR));
}

function copyExtensionModules(extensions: Array<Required<AdminUiExtension>>) {
    for (const extension of extensions) {
        const dirName = path.basename(path.dirname(extension.ngModulePath));
        const dest = path.join(EXTENSIONS_DIR, EXTENSIONS_MODULES_DIR, extension.id);
        fs.copySync(extension.ngModulePath, dest);
    }
}

function createExtensionsModule(extensions: Array<Required<AdminUiExtension>>) {
    const removeTsExtension = (filename: string): string => filename.replace(/\.ts$/, '');
    const importPath = (e: Required<AdminUiExtension>): string =>
        `./${EXTENSIONS_MODULES_DIR}/${e.id}/${removeTsExtension(e.ngModuleFileName)}`;
    fs.renameSync(originalExtensionsModuleFile, tempExtensionsModuleFile);

    const source = generateExtensionModuleTsSource(
        extensions.map(e => ({ className: e.ngModuleName, path: importPath(e) })),
    );
    fs.writeFileSync(path.join(EXTENSIONS_DIR, 'extensions.module.ts'), source, 'utf-8');
}

function restoreOriginalExtensionsModule() {
    fs.renameSync(originalExtensionsModuleFile, path.join(EXTENSIONS_DIR, 'extensions.module.ts.generated'));
    fs.renameSync(tempExtensionsModuleFile, originalExtensionsModuleFile);
}

function generateExtensionModuleTsSource(modules: Array<{ className: string; path: string }>): string {
    return `/** This file is generated by the build() function. Do not edit. */
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

${modules.map(e => `import { ${e.className} } from '${e.path}';`).join('\n')}

@NgModule({
    imports: [
        CommonModule,
        ${modules.map(e => e.className + ',').join('\n')}
    ],
})
export class ExtensionsModule {}
`;
}
