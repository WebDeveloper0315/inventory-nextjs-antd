const config = require("./config.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DB_URI: config.DB_URI,
    JWT_SECRET: config.JWT_SECRET,
  },
  
  // webpack: (config) => {
  //     config.experiments = config.experiments || {}
  //     config.experiments.topLevelAwait = true
  //     return config
  // },
  // experimental: {
  //     serverComponentExternalPackages: ["mongoose"],
  // },
};

module.exports = nextConfig;
