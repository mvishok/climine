const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const base64 = require('js-base64').Base64;
const packages = JSON.parse(fs.readFileSync(path.dirname(process.execPath)+'\\lib\\packages.json', "utf8"));


const axios = require('axios');

async function boot(){

    if (argv['i'] || argv['install']){
        let package = argv['i'] || argv['install'];
        let owner = package.split("/")[0];
        let repo = package.split("/")[1];
        if (!owner || !repo){
            console.error("ERROR: Invalid package name");
            return;
        }

        let url = "https://api.github.com/repos/"+owner+"/"+repo+"/contents/package.json";

        let v = false;
        if (argv['version']){
            v = argv['v'] || argv['version'];
        }

        console.log("Fetching package.json from", url);
        var json;
        try {
        const response = await axios.get(url);
        let data = base64.decode(response.data.content);
        json = JSON.parse(data);}
        catch (e){
            console.error("ERROR: Package not found");
            return;
        }

        console.log("Installing", json.name, "version "+json.version);
        console.log("Description:", json.description);
        console.log("Author:", json.author);

        console.log("Downloading files...");
        var name = "";
        //download the repo
        try{
        let downloadUrl = "https://github.com/"+owner+"/"+repo+"/archive/master.zip";
        let downloadPath = path.dirname(process.execPath)+'\\lib';
        const download = require('download');
        name = await download(downloadUrl, downloadPath, {extract: true});
        name[0].path = path.dirname(process.execPath)+'\\lib\\'+name[0].path
        } catch (e){
            console.error("ERROR: Could not download package:", e);
            return;
        }
        console.log("Downloaded to", name[0].path);
        
        try {
        console.log("Renaming to", json.name);
        fs.renameSync(name[0].path, path.dirname(process.execPath)+'\\lib\\'+json.name);
        } catch (e){
            console.error("ERROR: Could not rename package:",e);
            return;
        }
        console.log("Setting package entry point to", json.entry);
        const entry = json.name+"\\"+json.entry;
        console.log("Appending to lib/packages.json");
        packages[""][json.name] = {
            "name": json.name,
            "version": json.version,
            "description": json.description,
            "author": json.author,
            "repo": owner+"/"+repo,
            "path": entry,
        }
        try{
        fs.writeFileSync(path.dirname(process.execPath)+'\\lib\\packages.json', JSON.stringify(packages, null, 2));
        } catch (e){
            console.error("ERROR: Could not write to lib/packages.json:", e);
            return;
        }
        console.log("Done!");
        console.log(json.name, "installed successfully.");
    }
    if (argv["uninstall"] || argv["remove"]){
        let package = argv["uninstall"] || argv["remove"];
        if (!packages[""][package]){
            console.error("ERROR: Package not found");
            return;
        }
        package = path.dirname(process.execPath)+'\\lib\\'+package;
        console.log("Removing", package);
        console.log("Deleting files...");
        try{
        fs.rmSync(package, { recursive: true });
        } catch (e){
            console.error("ERROR: Could not delete package");
            return;
        }
        console.log("Removing from lib/packages.json");
        delete packages[""][package];
        try{
        fs.writeFileSync(path.dirname(process.execPath)+'\\lib\\packages.json', JSON.stringify(packages, null, 2));
        } catch (e){
            console.error("ERROR: Could not write to lib/lib/packages.json");
            return;
        }
        console.log("Done!");
        console.log(package, "removed successfully.");
    }
}

boot();