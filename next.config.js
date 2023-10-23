/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.experiments = config.experiments || {}
        config.experiments.topLevelAwait = true
        return config
    },
    experimental: {
        serverComponentExternalPackages: ["mongoose"],
    },
}

module.exports = nextConfig
