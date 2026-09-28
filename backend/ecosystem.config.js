module.exports = {
  apps: [
    {
      name: 'picposter-admin-backend',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      listen_timeout: 10000,
      kill_timeout: 10000,
      wait_ready: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
