async function run(){
const rcedit = require("rcedit");

    await rcedit( `C:/Users/dell/.pkg-cache/v3.4/built-v18.5.0-win-x64`, {
        "product-version": "0.1.4",
        "file-version": "1.0.0",
        icon: "img/climine.ico",
        "version-string": {
            FileDescription: "Climine Interpreter",
            ProductName: "Clinime Interpreter",
            LegalCopyright: "Copyright © 2024 Vishok Manikantan",
            OriginalFilename: "climine.exe",
            CompanyName: "Vishok Manikantan (Climine)",
            InternalName: "climine.exe",
        },
    });
}

run();