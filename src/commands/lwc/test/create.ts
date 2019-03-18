import { core, flags, SfdxCommand } from '@salesforce/command';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages('sfdx-lwc-test', 'create');

export default class Run extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    `$ sfdx force:lightning:lwc:test:create -f force-app/main/default/lwc/myButton/myButton.js`,
  ];

  protected static flagsConfig = {
    filepath: flags.string({char: 'p', description: messages.getMessage('filepathFlagDescription'), required: true}),
  };
  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  public async run(): Promise<core.AnyJson> {
    const testDirName = '__tests__';
    const filepath = this.flags.filepath;

    const modulePath = path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath);
    if (path.extname(modulePath) !== '.js') {
      throw new core.SfdxError(messages.getMessage('errorFileNotJs', [this.flags.filepath]));
    }
    if (!fs.existsSync(modulePath)) {
      throw new core.SfdxError(messages.getMessage('errorFileNotFound', [this.flags.filepath]));
    }

    const bundlePath = path.dirname(modulePath);
    const testDirPath = path.join(bundlePath, testDirName);

    const moduleName = path.basename(modulePath, '.js');
    const testName = `${moduleName}.test.js`;
    const testPath = path.join(testDirPath, testName);
    if (fs.existsSync(testPath)) {
      throw new core.SfdxError(messages.getMessage('errorFileExists', [testPath]));
    }

    const className = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    const elementName = 'c-' + moduleName.replace(/[A-Z]/g, '-$&').toLowerCase();

    const testSuiteTemplate = `import { createElement } from 'lwc';
import ${className} from 'c/${moduleName}';

describe('${elementName}', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('TODO: test case generated by CLI command, please fill in test logic', () => {
        const element = createElement('${elementName}', {
            is: ${className}
        });
        document.body.appendChild(element);
        expect(1).toBe(2);
    });
});`;

    if (!fs.existsSync(testDirPath)) {
      fs.mkdirSync(testDirPath);
    }
    fs.writeFileSync(testPath, testSuiteTemplate);

    this.ux.log('Test case successfully created');
    return {
      message: 'Test case successfully created',
      exitCode: 0,
    }
  }
}
