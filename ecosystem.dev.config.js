module.exports = {
  apps: [
    {
      name: 'sow-workbench-dev-api',
      namespace: 'sow-workbench',
      script: 'pnpm',
      args: ['--filter', 'api', 'dev'],
      cwd: '/root/thecustom',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5578
      },
      error_file: './logs/dev-api-error.log',
      out_file: './logs/dev-api-out.log',
      log_file: './logs/dev-api-combined.log',
      time: true,
      daemon: true,
      restart_delay: 4000,
      max_memory_restart: '300M',
      watch: [
        'apps/api/src',
        'packages/db/src',
        'pnpm-lock.yaml'
      ],
      ignore_watch: [
        'node_modules',
        '.git',
        'logs',
        'apps/web',
        'packages/ui'
      ]
    },
    {
      name: 'sow-workbench-dev-web',
      namespace: 'sow-workbench',
      script: 'pnpm',
      args: ['--filter', 'web', 'dev'],
      cwd: '/root/thecustom',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3009,
        HOST: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'http://localhost:5578',
        API_URL: 'http://localhost:5578'
      },
      error_file: './logs/dev-web-error.log',
      out_file: './logs/dev-web-out.log',
      log_file: './logs/dev-web-combined.log',
      time: true,
      daemon: true,
      restart_delay: 4000,
      max_memory_restart: '500M',
      watch: [
        'apps/web/src',
        'packages/ui/src',
        'pnpm-lock.yaml'
      ],
      ignore_watch: [
        'node_modules',
        '.git',
        'logs',
        'apps/api',
        'packages/db',
        'apps/web/.next',
        'apps/web/public'
      ]
    }
  ]
};
