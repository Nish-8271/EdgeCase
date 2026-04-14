// services/codeExecutor.js
// Writes code to a temp dir, spins up a Docker container, captures output

const { execFile }    = require('child_process');
const fs              = require('fs');
const path            = require('path');
const os              = require('os');
const { v4: uuidv4 }  = require('uuid');
const { spawn } = require('child_process');
// ─── Language config ──────────────────────────────────────────────────────────

const LANG_CONFIG = {
  python: { image: 'cp-python', filename: 'solution.py'   },
  cpp:    { image: 'cp-cpp',    filename: 'solution.cpp'  },
  java:   { image: 'cp-java',   filename: 'Solution.java' },
  c:      { image: 'cp-c',      filename: 'solution.c'    },
  rust:   { image: 'cp-rust',   filename: 'solution.rs'   },
};

// ─── Execution limits ─────────────────────────────────────────────────────────

const LIMITS = {
  timeoutMs: 10000,   // 10 seconds
  memory:    '128m',
  cpus:      '0.5',
};

// ─── Main export ──────────────────────────────────────────────────────────────

async function executeCode({ code, language, input = '' }) {
  const config = LANG_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  // Create isolated temp directory for this run
  const runId  = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `cp-run-${runId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Write source code + stdin to temp files
  fs.writeFileSync(path.join(tmpDir, config.filename), code, 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'input.txt'), input, 'utf8');

  const startTime = Date.now();

  try {
    const result = await runContainer({ config, tmpDir, runId });
    result.executionTime = Date.now() - startTime;
    return result;
  } finally {
    // Always clean up — even if execution threw
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─── Docker runner ────────────────────────────────────────────────────────────

function runContainer({ config, tmpDir, runId }) {
  return new Promise((resolve) => {

    const mountPath = tmpDir.replace(/\\/g, '/').replace(/^([A-Z]):/, (_, d) => `/${d.toLowerCase()}`);

    const args = [
      'run',
      '--rm',
      '--name', `cp-run-${runId}`,
      '--memory', LIMITS.memory,
      '--cpus', LIMITS.cpus,
      '--network', 'none',
      '--read-only',
      '--tmpfs', '/tmp:rw,exec,nosuid,size=32m', // 🔥 FIXED
      '-v', `${mountPath}:/code:ro`,
      '-i',
      config.image,
    ];

    const proc = spawn('docker', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    // Capture output
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Pipe input
    const stdinStream = fs.createReadStream(path.join(tmpDir, 'input.txt'));
    stdinStream.pipe(proc.stdin);

    stdinStream.on('end', () => {
      proc.stdin.end(); // 🔥 VERY IMPORTANT
    });

    // Timeout
    const timer = setTimeout(() => {
      if (!finished) {
        proc.kill('SIGKILL');
        finished = true;
        resolve({
          stdout: '',
          stderr: '',
          compileError: null,
          timedOut: true,
          exitCode: null,
        });
      }
    }, LIMITS.timeoutMs);

    // On exit
    proc.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (stderr && isCompileError(stderr)) {
        return resolve({
          stdout: '',
          stderr: '',
          compileError: stderr.trim(),
          timedOut: false,
          exitCode: code,
        });
      }

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        compileError: null,
        timedOut: false,
        exitCode: code,
      });
    });
  });
}

// ─── Compile error heuristic ──────────────────────────────────────────────────

function isCompileError(stderr) {
  return (
    stderr.includes('error:')            ||  // gcc / g++ / rustc
    stderr.includes('error[')            ||  // Rust error codes
    stderr.includes('.java:')            ||  // Java
    stderr.includes('cannot find symbol')||  // Java
    stderr.includes('undefined reference')||  // C linker
    stderr.includes('expected')              // common parse errors
  );
}

module.exports = { executeCode };