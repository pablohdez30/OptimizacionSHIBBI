/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack, nextRuntime }) => {
    // El Edge Runtime (donde corre el middleware) no expone __dirname/__filename.
    // Algunas deps transitivas de @supabase/* los referencian sin comprobar,
    // causando ReferenceError en runtime aunque el bundle compile bien.
    // Definirlos como string vacío desactiva esas referencias de forma segura.
    if (nextRuntime === "edge") {
      config.plugins.push(
        new webpack.DefinePlugin({
          __dirname: JSON.stringify(""),
          __filename: JSON.stringify(""),
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
