module.exports = {
  apps: [
    {
      name: "museum-companion",
      // Production: use compiled standalone output (faster, no tsx overhead)
      // Dev fallback: tsx src/server.ts
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
