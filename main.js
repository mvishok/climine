const lexer = require("./lexer");
const parser = require("./parser");
const { def} = require("./core");
const eval = require("./eval");
const {readFileSync} = require('fs');
const { dirname } = require('path');
var argv = require('minimist')(process.argv.slice(2));
const { throwError, config, log, getVariable, scope, setVariable } = require("./mem");
const packages = JSON.parse(readFileSync("dist\\lib\\packages.json" || dirname(process.execPath)+'\\lib\\packages.json', "utf8"));

const VERSION = "0.1.4";

const axios = require('axios');
async function getVersion() {
    try {
      const response = await axios.get('https://api.github.com/repos/mvishok/climine/releases/latest');
      return response.data.tag_name;
    } catch (error) {
      console.error('Error fetching release tag:', error.message);
      // Handle the error as needed
      return null;
    }
  }

if (argv['v']) {
    console.log("Climine v" + VERSION);
    process.exit(0);
}

if (argv['log']){
    config["log"] = argv["log"];
    log('\n----------------\nClimine v'+VERSION+'\n\n---- START ----\n');
}

async function boot(){
    if (argv['_'].length > 0) {
        log('Reading script: ' + argv['_'][0] + '\n\n');
        const filePath = argv['_'][0];
        setVariable("CWD", dirname(filePath)+"\\", "StringLiteral");
        let fileContent;
        try {
            fileContent = readFileSync(filePath, "utf8").replace(/[\r\n]+/g, "");
        } catch (error) {
            throwError(`Error reading the file: ${error.message}`);
        }
        config["mode"] = "script";
        start(fileContent);
    } else {
        setVariable("CWD", dirname(process.execPath)+"\\", "StringLiteral");
        const latestVersion = await getVersion();
        if (latestVersion != VERSION){
            console.log("New version available:", latestVersion, "\nCheck it out at https://climine.vishok.tech/\n");
        }
        log('Interactive mode\n\n');
        config["mode"] = "interactive";
        const prompt = require("prompt-sync")();
        console.log("Welcome to Climine v"+VERSION+".\nType 'exit' to exit.");

        while(true){
            const input = prompt("> ");
            if(input === 'exit'){
                process.exit(0);
            }
            start(input);
        }
    }
}

boot();

function start(input) {
    const tokens = lexer(input);
    log("----LEXING----\nTokens: "+JSON.stringify(tokens, null, 2)+"\n\n");
    const ast = parser(tokens);
    log("----PARSING----\nAST: "+JSON.stringify(ast, null, 2)+"\n\n");
    log("----MAIN----\n");
    main(ast);
}

function main(ast) {
    let current = [];

    let finalAST = [];

    ast["body"].forEach((token) => {
        current.push(token);
        if (token.type == "Delimiter" && token.value == ";") {
            finalAST.push({ statement: current });
            current = [];
        }
    });
    
    let i=0;
    mainFlow: while (i<finalAST.length){
        const statement = finalAST[i];
        for (const [index, token] of statement["statement"].entries()){
            if (token.type == "Identifier") {
                if (statement["statement"][index+1].type == "CallExpression"){
                    if (def[token.value]){
                        log('Calling function: '+token.value+' with params: '+JSON.stringify(statement["statement"][index+1].params)+'\n');
                        const r = def[token.value](statement["statement"][index+1].params);
                        log('Function returned: '+JSON.stringify(r)+'\n\n');
                        return r;
                    } else {
                        throwError(`${token.value} is not defined (ast)`);
                    }
                }
                else {
                    throwError(`${token.value} is not defined (ast)`);
                }
                i++;continue mainFlow;
            }
            if (token.type == "Keyword"){
                //if it is return statement, return
                if (token.value == "return"){
                    log('--RETURN-- [\n');
                    
                    if (!statement["statement"][1]){
                        log('Returning: undefined\n');
                        log(']\n--END RETURN--\n\n');
                        return undefined;
                    }
                    if (statement["statement"][1].type == "Identifier" && statement["statement"][2].type == "CallExpression"){
                        let val = def[statement["statement"][1].value](statement["statement"][2].params);
                        log('Returning: '+val+'\n');
                        log(']\n--END RETURN--\n\n');
                        return val;
                    }
                    if (statement["statement"][1].type == "Identifier"){
                        let val = getVariable(statement["statement"][1].value);
                        log('Returning: '+val+'\n');
                        log(']\n--END RETURN--\n\n');
                        return val;
                    }
                    if (statement["statement"][1].type == "CallExpression"){
                        let val = eval(statement["statement"][1].params, def);
                        log('Returning: '+val+'\n');
                        log(']\n--END RETURN--\n\n');
                        return val;
                    }
                    if (statement["statement"][1].type == "StringLiteral"){
                        let val = statement["statement"][1].value;
                        log('Returning: '+val+'\n');
                        log(']\n--END RETURN--\n\n');
                        return val;
                    }
                    if (statement["statement"][1].type == "NumberLiteral"){
                        let val = statement["statement"][1].value;
                        log('Returning: '+val+'\n');
                        log(']\n--END RETURN--\n\n');
                        return val;
                    }
                    if (statement["statement"][1].type == "FloatLiteral"){
                        let val = statement["statement"][1].value;
                        log('Returning: '+val+'\n');
                        log(']\n--END RETURN--\n\n');
                        return val;
                    }
                    return undefined;
                }

                if (token.value == "include"){
                    log('--INCLUDE-- [\n');
                    
                    if (statement["statement"][1].type != "StringLiteral"){
                        throwError(`Include statement must have string literal as a parameter`);
                    }
                    let filePath = statement["statement"][1].value;
                    if (Object.keys(packages[""]).includes(filePath)){
                        filePath = ("dist\\lib\\" || dirname(process.execPath)+'\\lib\\') +packages[""][filePath].path;
                    }
                    let fileContent;
                    try {
                        fileContent = readFileSync(filePath, "utf8").replace(/[\r\n]+/g, "");
                    } catch (error) {
                        throwError(`Error reading the file: ${error.message}`);
                    }

                    log('Reading script: '+filePath+'\n\n');
                    
                    includeAST = parser(lexer(fileContent));

                    let includeFinalAST = [];

                    let current =[];

                    includeAST["body"].forEach((token) => {
                        current.push(token);
                        if (token.type == "Delimiter" && token.value == ";") {
                            includeFinalAST.push({ statement: current });
                            current = [];
                        }
                    });

                    //append it to main finalAST
                    finalAST.splice(i + 1, 0, ...includeFinalAST);
                    
                    log(']\n--END INCLUDE--\n\n');
                    i++;continue mainFlow;
                }

                if (token.value=="if"){
                    log('--IF-- [\n');

                    let condition = statement["statement"][1].params;
                    let body = statement["statement"][2].statements;
                    let elseBody;

                    if (statement["statement"][3].type == "Keyword" && statement["statement"][3].value == "else"){
                        log('--ELSE-- [\n');
                        elseBody = statement["statement"][4].statements;
                    }

                    if (eval(condition, def) == 1){ 
                        log('Condition is true, executing body\n');
                        main({body: body});
                    } else {
                        if (elseBody){
                            log('Condition is false, executing elseBody\n');

                            main({body: elseBody});
                        }
                    }
                    log(']\n\n--END IF--\n\n');
                    i++;continue mainFlow;
                } 
                if (token.value == "until"){
                    log('--UNTIL-- [\n');
                    let condition = statement["statement"][1].params;
                    let body = statement["statement"][2].statements;
                    let elseBody;

                    if (statement["statement"][3].type == "Keyword" && statement["statement"][3].value == "else"){
                        log('Else statement: '+JSON.stringify(statement["statement"][4].statements, null, 2)+'\n');
                        elseBody = statement["statement"][4].statements;
                    }
                    while (eval(condition, def) != 1){
                        log('Condition is false, executing body\n');
                        main({body: body});
                    }
                    if (elseBody){
                        log('Condition is true, executing elseBody\n');
                        main({body: elseBody});
                    }
                    log(']\n--END UNTIL--\n\n');
                    i++;continue mainFlow;
                }
                if (token.value == "while"){
                    log('--WHILE-- [\n');
                    let condition = statement["statement"][1].params;
                    let body = statement["statement"][2].statements;
                    let elseBody;

                    if (statement["statement"][3].type == "Keyword" && statement["statement"][3].value == "else"){
                        log('--ELSE-- [\n');
                        elseBody = statement["statement"][4].statements;
                    }
                    while (eval(condition, def) == 1){
                        log('Condition is true, executing body\n');
                        main({body: body});
                    }
                    if (elseBody){
                        log('Condition is false, executing elseBody\n');
                        main({body: elseBody});
                    }
                    log(']\n--END WHILE--\n\n');
                    i++;continue mainFlow;
                }
                if (token.value == "try"){
                    config["try"] = true;
                    log('--TRY-- [\n');
                    let body = statement["statement"][1].statements;
                    let handleBody;
                    let finallyBody;
                    
                    if (statement['statement'].length > 2 && statement["statement"][2].type == "Keyword" && statement["statement"][2].value == "handle"){
                        log('--HANDLE-- [\n');
                        handleBody = statement["statement"][3].statements;
                    }

                    if (statement['statement'].length > 4 && statement["statement"][4].type == "Keyword" && statement["statement"][4].value == "finally"){
                        log('--FINALLY-- [\n');
                        finallyBody = statement["statement"][5].statements;
                    }

                    try {
                        log('Executing body\n');
                        main({body: body});
                    } catch (e) {
                        if (handleBody){
                            log('Executing handleBody\n');

                            main({body: handleBody});
                        }
                    }
                    if (finallyBody){
                        log('Executing finallyBody\n');
                        main({body: finallyBody});
                    }
                    
                    log(']\n--END TRY--\n\n');
                    config["try"] = false;
                    i++;continue mainFlow;
                }
                //user defined functions with scope
                if (token.value == "define"){
                    log('--DEFINE-- [\n');
                    let name = statement["statement"][1].value;
                    let params = statement["statement"][2].params;
                    let body = statement["statement"][3].statements;
                    scope[name] = [];
                    params.forEach((param) => {
                        if (param.type == "Identifier"){
                            scope[name][param.value] = null;
                        }
                    });

                    log('Defining function: '+name+' with params: '+JSON.stringify(params)+'\n');

                    def[name] = function(params){
                        params = eval(params, def);
                        //if params is not array, make it array
                        if (!Array.isArray(params)) params = [params];

                        Object.keys(scope[name]).forEach((key, index) => {
                            scope[name][key] = params[index];
                        });

                        log('Executing body\n');
                        config["lastScope"] = config["scope"];
                        config["scope"] = name;
                        const r = main({body: body});
                        config["scope"] = config["lastScope"];
                        log('Function returned: '+r+'\n');
                        return r;
                    }
                    
                    log(']\n--END DEFINE--\n\n');
                    i++;continue mainFlow;
                }

                if (token.value == "let"){
                    log('Calling setVariable with name: '+statement["statement"][1].value+' and value: '+JSON.stringify(statement["statement"][3])+'\n');

                    def['set'](statement["statement"]);
                    i++;continue mainFlow;
                }
            } 
            
        }
    }
}
