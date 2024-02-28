const config = require("./config.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode : true,
  env: {
    DB_URI: config.DB_URI,
    JWT_SECRET: config.JWT_SECRET,
    NEXT_PUBLIC_IMAGES_PATH: '/productImage',
  },
  images: {
    domains:["mydomain.com"],
    path: '/.next/static/images',
  },
  
};

module.exports = nextConfig;
