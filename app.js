const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Prevent console write errors from crashing packaged Windows executables
function ignoreConsoleWriteError(error) {
  if (error && (error.code === 'EIO' || error.code === 'ERR_STREAM_DESTROYED')) {
    return;
  }

  try {
    process.stderr.write(`Console stream error: ${error && error.message ? error.message : error}\n`);
  } catch (_) {
    // Ignore secondary console errors
  }
}

process.stdout.on('error', ignoreConsoleWriteError);
process.stderr.on('error', ignoreConsoleWriteError);

// Set console encoding to UTF-8 for proper Korean character display
if (process.platform === 'win32') {
  try {
    process.stdout.setDefaultEncoding('utf8');
    process.stderr.setDefaultEncoding('utf8');
  } catch (e) {
    // Ignore if not supported
  }
}

// pkg 실행 파일 경로 처리
const APP_ROOT = process.pkg ? path.dirname(process.execPath) : __dirname;

// 언어 설정 (명령줄 인수에서 가져오기)
const args = process.argv.slice(2);
const langArg = args.find(arg => arg.startsWith('--lang='));
const LANGUAGE = langArg ? langArg.split('=')[1] : 'en';

// 간단한 CLI 인수 파서
function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq === -1) {
      out[a.slice(2)] = true;
    } else {
      const k = a.slice(2, eq);
      const v = a.slice(eq + 1);
      out[k] = v;
    }
  }
  return out;
}
const ARGS = parseArgs(args);

// 다국어 메시지
function buildEnMessages() {
  return {
    title: 'Server Telnet Connection Monitor',
    mainMenuTitle: 'Main Menu',
    menu1: '1. Server Telnet Connection Check (request/SERVER*.csv)',
    menu0: '0. Exit',
    selectPrompt: 'Select function to execute (0-1): ',
    invalidSelection: 'Invalid selection. Please select again.',
    exit: 'Exiting program.',
    pressEnter: 'Press Enter to continue...',
    createdResultsDir: 'Created results directory:',
    telnetTitle: 'Server Telnet Connection Check',
    DirNotFound: 'Telnet check CSV directory not found: request/',
    CreateDir: 'Please create the directory and add CSV files. (ex request/server_sample.csv)',
    NoFiles: 'No server CSV files found in request/ directory.',
    AddFiles: 'Please add server CSV files starting with "server" to the request/ directory. (ex server_sample.csv)',
    AvailableFiles: 'Available Telnet Check CSV Files:',
    SelectFile: 'Select CSV file number to use',
    InvalidFile: 'Invalid file selection.',
    SelectedFile: 'Selected CSV file:',
    TimeoutSettings: 'Timeout Settings:',
    Timeout: 'Timeout (seconds)',
    Starting: 'Starting telnet connection check...',
    Completed: 'Telnet connection check completed.',
    Error: 'Error occurred during telnet connection check:'
  };
}

function buildKrMessages() {
  return {
    title: '서버 텔넷 접속 모니터',
    mainMenuTitle: '메인 메뉴',
    menu1: '1. 서버 텔넷 접속 확인 (request/SERVER*.csv)',
    menu0: '0. 종료',
    selectPrompt: '실행할 기능을 선택하세요 (0-1): ',
    invalidSelection: '잘못된 선택입니다. 다시 선택해주세요.',
    exit: '프로그램을 종료합니다.',
    pressEnter: 'Enter를 눌러 계속...',
    createdResultsDir: 'results 디렉토리를 생성했습니다:',
    telnetTitle: '서버 텔넷 접속 확인',
    DirNotFound: '텔넷 확인용 CSV 디렉토리를 찾을 수 없습니다: request/',
    CreateDir: '디렉토리를 생성하고 CSV 파일을 추가해주세요. (ex request/server_sample.csv)',
    NoFiles: 'request/ 디렉토리에 server CSV 파일이 없습니다.',
    AddFiles: 'request/ 디렉토리에 "server"로 시작하는 .csv 파일을 추가해주세요. (ex server_sample.csv)',
    AvailableFiles: '사용 가능한 텔넷 확인 CSV 파일:',
    SelectFile: '사용할 CSV 파일 번호를 선택하세요',
    InvalidFile: '잘못된 파일 선택입니다.',
    SelectedFile: '선택된 CSV 파일:',
    TimeoutSettings: '타임아웃 설정:',
    Timeout: '타임아웃 (초)',
    Starting: '텔넷 접속 확인을 시작합니다...',
    Completed: '텔넷 접속 확인이 완료되었습니다.',
    Error: '텔넷 접속 확인 중 오류가 발생했습니다:'
  };
}

const messages = { en: buildEnMessages(), kr: buildKrMessages() };
const msg = messages[LANGUAGE] || messages.en;

// Module imports
const TelnetChecker = require('./src/TelnetChecker');

class AliveMonApp {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // results 디렉토리 미리 생성
    this.ensureResultsDirectory();
    
    this.telnetChecker = new TelnetChecker();
  }

  ensureResultsDirectory() {
    try {
      const resultsDir = path.join(APP_ROOT, 'results');
      
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
        console.log(`📁 ${msg.createdResultsDir} ${resultsDir}`);
      }
    } catch (error) {
      console.error('❌ Error: Could not create results directory:', error.message);
    }
  }

  async start() {
    console.clear();
    console.log('='.repeat(50));
    console.log(`    ${msg.title}`);
    console.log('='.repeat(50));
    console.log();
    // 비대화형 실행 경로 우선 처리
    const handled = await this.maybeRunFromCliArgs();
    if (handled) return;
    await this.showMainMenu();
  }

  async showMainMenu() {
    console.log(`📋 ${msg.mainMenuTitle}`);
    console.log('------------------------------------------------');
    console.log(msg.menu1);
    console.log(msg.menu0);
    console.log('------------------------------------------------');
    console.log();

    const choice = await this.askQuestion(msg.selectPrompt);
    
    switch(choice.trim()) {
      case '1':
        await this.runTelnetCheck();
        break;
      case '0':
        await this.exitApp();
        break;
      default:
        console.log(`❌ ${msg.invalidSelection}`);
        await this.waitAndContinue();
        await this.showMainMenu();
    }
  }

  async runTelnetCheck(options = undefined) {
    console.clear();
    console.log(`🌐 ${msg.telnetTitle}`);
    console.log('='.repeat(40));
    
    try {
      // Get CSV file list from request folder
      const telnetCheckDir = path.join(APP_ROOT, 'request');
      
      if (!fs.existsSync(telnetCheckDir) && !(options && options.csvPath)) {
        console.log(`❌ ${msg.DirNotFound}`);
        console.log(msg.CreateDir);
        if (!(options && options.nonInteractive)) {
          await this.waitAndContinue();
          await this.showMainMenu();
        }
        return;
      }

      let csvPath;
      let timeout;
      if (options && options.csvPath) {
        csvPath = path.isAbsolute(options.csvPath) ? options.csvPath : path.join(APP_ROOT, options.csvPath);
        timeout = options.timeout ?? 3;
      } else {
        const csvFiles = fs.readdirSync(telnetCheckDir)
          .filter(file => file.endsWith('.csv') && file.toLowerCase().startsWith('server'));

        if (csvFiles.length === 0) {
          console.log(`❌ ${msg.NoFiles}`);
          console.log(msg.AddFiles);
          if (!(options && options.nonInteractive)) {
            await this.waitAndContinue();
            await this.showMainMenu();
          }
          return;
        }

        console.log(`\n📄 ${msg.AvailableFiles}`);
        csvFiles.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file}`);
        });
        console.log();

        const fileChoice = await this.askQuestion(
          `${msg.SelectFile} (1-${csvFiles.length}): `
        );
        
        const selectedFileIndex = parseInt(fileChoice) - 1;
        if (selectedFileIndex < 0 || selectedFileIndex >= csvFiles.length) {
          console.log(`❌ ${msg.InvalidFile}`);
          if (!(options && options.nonInteractive)) {
            await this.waitAndContinue();
            await this.showMainMenu();
          }
          return;
        }

        const selectedFile = csvFiles[selectedFileIndex];
        csvPath = path.join(telnetCheckDir, selectedFile);
        console.log(`✅ ${msg.SelectedFile} ${selectedFile}`);
        
        console.log(`\n⏱️  ${msg.TimeoutSettings}`);
        timeout = await this.askQuestion(
          msg.Timeout,
          3
        );
      }

      console.log(`\n🚀 ${msg.Starting}`);
      console.log('-'.repeat(40));
      
      await this.telnetChecker.run({
        csvPath: csvPath,
        timeout: parseInt(timeout) || 3
      });
      
      console.log(`\n✅ ${msg.Completed}`);
      
    } catch (error) {
      console.error(`❌ ${msg.Error}`, error.message);
    }
    if (!(options && options.nonInteractive)) {
      await this.waitAndContinue();
      await this.showMainMenu();
    }
  }

  async exitApp() {
    console.log(`\n👋 ${msg.exit}`);
    this.rl.close();
    process.exit(0);
  }

  askQuestion(question, defaultValue = '') {
    return new Promise((resolve) => {
      const prompt = defaultValue ? `${question} (default: ${defaultValue}): ` : `${question} `;
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  async waitAndContinue() {
    console.log(`\n⏳ ${msg.pressEnter}`);
    return new Promise((resolve) => {
      this.rl.once('line', () => resolve());
    });
  }

  // 비대화형 CLI 실행기
  async maybeRunFromCliArgs() {
    // --help 처리
    if (ARGS.help) {
      this.printUsage();
      await this.exitApp();
      return true;
    }
    const mode = ARGS.mode; // telnet
    if (!mode) return false;
    
    if (mode === 'telnet') {
      await this.runTelnetCheck({
        nonInteractive: true,
        csvPath: ARGS.csv,
        timeout: ARGS.timeout ? parseInt(ARGS.timeout) : undefined
      });
      await this.exitApp();
      return true;
    }
    
    console.log(`❌ Unknown mode: ${mode}`);
    await this.exitApp();
    return true;
  }

  printUsage() {
    console.log(`
Usage: alive-mon-app [options]

Options:
  --mode=telnet          Run telnet connection check
  --csv=<path>           CSV file path (required for non-interactive mode)
  --timeout=<seconds>    Connection timeout in seconds (default: 3)
  --lang=<en|kr>         Language (default: en)
  --help                 Show this help message

Examples:
  # Interactive mode
  node app.js

  # Non-interactive mode with CSV file
  node app.js --mode=telnet --csv=request/server_list.csv --timeout=5

  # Korean language
  node app.js --lang=kr
    `);
  }
}

// Run the application
const app = new AliveMonApp();
app.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
