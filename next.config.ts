import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Image optimization configuration
    images: {
        domains: ["i.pravatar.cc"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.public.blob.vercel-storage.com",
            },
        ],
    },

    // ESLint configuration
    eslint: {
        // Ignore all ESLint errors during build (useful for Vercel deployment)
        ignoreDuringBuilds: true,
    },

    // Remove console.log in production builds
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? {
            exclude: ["error", "warn"],
        } : false,
    },

    // Enable SWC minification for smaller bundles
    swcMinify: true,

    // Optimize production builds
    productionBrowserSourceMaps: false,

    // Experimental features for better performance
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-separator',
            'recharts',
            'chart.js',
            'react-chartjs-2',
        ],
    },

    // Security headers
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
