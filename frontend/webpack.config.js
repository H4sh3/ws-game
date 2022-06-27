const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { DefinePlugin } = require("webpack");


//export const wsUrl = import.meta.env.MODE === 'development' ? local : prod
var API_WS_URL = {
  production: "'wss://game.gymcadia.com/websocket'",
  development: "'ws://127.0.0.1:6060'"
}


module.exports = (_, argv) => {
  console.log(`Websocket url: ${API_WS_URL[argv.mode]}`)
  const config = {
    devtool: 'source-map',
    entry: "./src/index.ts",
    mode: "development",
    devServer: {
      watchFiles: ["src/**/*"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          include: path.resolve(__dirname, "src"),
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'assets', to: 'assets' },
          { from: "src/index.html", to: "index.html" }
        ],
      }),
      new DefinePlugin({
        'process.env': {
          'WS_API': API_WS_URL[argv.mode]
        }
      })
    ],
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
  }
  return config
};
