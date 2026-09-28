const { spawn, execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, 'backend/.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const backendPort = parseInt(process.env.PORT, 10) || 5000;
const frontendPort = parseInt(process.env.VITE_PORT, 10) || 3000;

// Automatically free ports before launching if any orphaned process is lingering
function freePort(port) {
    try {
        if (process.platform === 'win32') {
            const output = execSync(`netstat -ano | findstr :${port}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
            const lines = output.trim().split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && pid !== process.pid.toString()) {
                    try {
                        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                    } catch (err) {}
                }
            }
        } else {
            execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
        }
    } catch (err) {
        // Port is free
    }
}

// Clean ports before startup based on .env
freePort(backendPort);
freePort(frontendPort);

console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  🚀 Starting PicPoster Fullstack Application (Dev Mode)');
console.log('\x1b[36m%s\x1b[0m', `  • Backend API:      http://localhost:${backendPort} (from .env)`);
console.log('\x1b[36m%s\x1b[0m', `  • Frontend UI:       http://localhost:${frontendPort} (from .env)`);
console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════\n');

// 1. Spawn Backend
const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
});

backend.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
        if (line.trim()) console.log(`\x1b[34m[BACKEND]\x1b[0m ${line}`);
    });
});

backend.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
        if (line.trim()) console.error(`\x1b[31m[BACKEND ERROR]\x1b[0m ${line}`);
    });
});

// 2. Spawn Frontend
const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
});

frontend.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
        if (line.trim()) console.log(`\x1b[35m[FRONTEND]\x1b[0m ${line}`);
    });
});

frontend.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
        if (line.trim()) console.error(`\x1b[31m[FRONTEND ERROR]\x1b[0m ${line}`);
    });
});

// Graceful cleanup on exit
const cleanup = () => {
    console.log('\n\x1b[33m%s\x1b[0m', '🛑 Stopping PicPoster processes...');
    try {
        if (process.platform === 'win32') {
            if (backend.pid) spawn('taskkill', ['/pid', backend.pid, '/f', '/t'], { stdio: 'ignore' });
            if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid, '/f', '/t'], { stdio: 'ignore' });
        } else {
            backend.kill('SIGINT');
            frontend.kill('SIGINT');
        }
    } catch (err) {}
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
