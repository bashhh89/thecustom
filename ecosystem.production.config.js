module.exports = {
  apps: [
    {
      name: 'sow-workbench-api',
      script: './apps/api/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      daemon: true,
      restart_delay: 4000,
      max_memory_restart: '200M',
      // Environment file
      env_file: './apps/api/.env.production'
    },
    {
      name: 'sow-workbench-web',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3009
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      daemon: true,
      restart_delay: 4000,
      max_memory_restart: '300M',
      // Environment file
      env_file: './apps/web/.env.production'
    }
  ],

  deploy: {
    production: {
      user: 'root', // Change to your server user
      host: 'YOUR_VPS_IP_OR_DOMAIN',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/sow-workbench.git', // Update with your repo
      path: '/home/ubuntu/sow-workbench', // Deployment path
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.production.config.js',
      'pre-setup': ''
    }
  }
};
