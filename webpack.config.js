const html_extractor = require("html-webpack-plugin");
const path = require("path");

module.exports = {

    mode: "production",
    entry: {
        ".": "./src/httpdocs/index.ts",
        "./admin": "./src/httpdocs/admin/index.ts"
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: "[name]/index.js",
        path: path.resolve(__dirname, "dist", "httpdocs")
    },
    plugins: [
        new html_extractor({
            filename: "./index.html",
            template: "./src/httpdocs/index.html",
            inject: false
        }),
        new html_extractor({
            filename: "./admin/index.html",
            template: "./src/httpdocs/admin/index.html",
            inject: false
        })
    ],
    optimization: {
        minimize: true
    }

};