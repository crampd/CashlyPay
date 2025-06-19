module.exports = {
  apps: [
    {
      name: "cashly-bot",
      script: "./bot.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        // Add your environment variables here or use .env file
      }
    },
    {
      name: "cashly-webhook",
      script: "./webhook/index.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        // Add your environment variables here or use .env file
      }
    }
  ]
};