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
    exit: 'Exiting program.',
    pressEnter: 'Press Enter to continue...',
    createdResultsDir: 'Created results directory:',
    telnetTitle: 'Server Telnet Connection Check',
    DirNotFound: 'Telnet check CSV directory not found: request/',
    CreateDir: 'Please create the directory and add CSV files. (ex request/server_sample.csv)',
    NoFiles: 'No CSV files found in request/ directory.',
    AddFiles: 'Please add CSV files to the request/ directory. (ex server_sample.csv)',
    AvailableFiles: 'Available CSV Files:',
    SelectFile: 'Select CSV file number to use',
    InvalidFile: 'Invalid file selection.',
    SelectedFile: 'Selected CSV file:',
    TimeoutSettings: 'Timeout Settings:',
    Timeout: 'Timeout (seconds)',
    Starting: 'Starting telnet connection check...',
    Completed: 'Telnet connection check completed.',
    Error: 'Error occurred during telnet connection check:',
    runAgain: 'Run again? (y/n): '
  };
}

function buildKrMessages() {
  return {
    title: '서버 텔넷 접속 모니터',
    exit: '프로그램을 종료합니다.',
    pressEnter: 'Enter를 눌러 계속...',
    createdResultsDir: 'results 디렉토리를 생성했습니다:',
    telnetTitle: '서버 텔넷 접속 확인',
    DirNotFound: '텔넷 확인용 CSV 디렉토리를 찾을 수 없습니다: request/',
    CreateDir: '디렉토리를 생성하고 CSV 파일을 추가해주세요. (ex request/server_sample.csv)',
    NoFiles: 'request/ 디렉토리에 CSV 파일이 없습니다.',
    AddFiles: 'request/ 디렉토리에 CSV 파일을 추가해주세요. (ex server_sample.csv)',
    AvailableFiles: '사용 가능한 CSV 파일:',
    SelectFile: '사용할 CSV 파일 번호를 선택하세요',
    InvalidFile: '잘못된 파일 선택입니다.',
    SelectedFile: '선택된 CSV 파일:',
    TimeoutSettings: '타임아웃 설정:',
    Timeout: '타임아웃 (초)',
    Starting: '텔넷 접속 확인을 시작합니다...',
    Completed: '텔넷 접속 확인이 완료되었습니다.',
    Error: '텔넷 접속 확인 중 오류가 발생했습니다:',
    runAgain: '다시 실행하시겠습니까? (y/n): '
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
    // 대화형 모드: 바로 텔넷 체크 실행
    await this.runTelnetCheckLoop();
  }

  async runTelnetCheckLoop() {
    while (true) {
      await this.runTelnetCheck();
      
      const runAgain = await this.askQuestion(msg.runAgain);
      if (runAgain.toLowerCase() !== 'y' && runAgain.toLowerCase() !== 'yes') {
        await this.exitApp();
        return;
      }
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
          .filter(file => file.endsWith('.csv'));

        if (csvFiles.length === 0) {
          console.log(`❌ ${msg.NoFiles}`);
          console.log(msg.AddFiles);
          if (!(options && options.nonInteractive)) {
            await this.waitAndContinue();
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
    // 비대화형 모드가 아니면 루프에서 다시 실행 여부를 묻음
    if (!(options && options.nonInteractive)) {
      return;
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
    // CSV 파일이 직접 지정된 경우 비대화형 모드로 실행
    if (ARGS.csv) {
      await this.runTelnetCheck({
        nonInteractive: true,
        csvPath: ARGS.csv,
        timeout: ARGS.timeout ? parseInt(ARGS.timeout) : undefined
      });
      await this.exitApp();
      return true;
    }
    // 그 외에는 대화형 모드로 진행
    return false;
  }

  printUsage() {
    console.log(`
Usage: alive-mon-app [options]

Options:
  --csv=<path>           CSV file path (for non-interactive mode)
  --timeout=<seconds>    Connection timeout in seconds (default: 3)
  --lang=<en|kr>         Language (default: en)
  --help                 Show this help message

Examples:
  # Interactive mode (select CSV file from menu)
  node app.js

  # Non-interactive mode with CSV file
  node app.js --csv=request/server_list.csv --timeout=5

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
