const { appendFileSync } = require('fs');
const { dirname } = require('path');

var variables = {
    "PATH": {value: "dist\\" || dirname(process.execPath), type: "StringLiteral"},
};
var scope = {};
var config = {
    scope: 'global',
}

function log(message) {
    if (config["log"]){
        appendFileSync(config["log"],message+"\n");
    }
}

function setVariable(name, value, type, index=undefined) {
    log('Setting variable: '+name+' with value: '+value+' type: '+type+' scope: '+config.scope+'\n');

    if (config.scope != "global"){
        if (type == "ArrayExpression"){
            if (typeof value != "object"){
                value = [value];
            }
        }

        //if updating a global variable
        if (variables[name]){
            index == undefined ? variables[name] = value : variables[name]["value"][index] = value;    
        } else {
            index == undefined ? scope[config.scope][name] = value : scope[config.scope][name][index] = value;
        }
        log('Set variable: '+name+' with value: '+value+' type: '+type+' scope: '+config.scope+' successfully\n');
        return;
    } else {
        if (type == "ArrayExpression"){
            if (typeof value != "object"){
                value = [value];
            }
        }
        index == undefined ? variables[name] = {value: value, type: type} : variables[name]["value"][index] = value;
        log('Set variable: '+name+' with value: '+value+' type: '+type+' scope: '+config.scope+' successfully\n');
    }
}

function getVariable(name, index) {
    if (config.scope != "global" && typeof scope[config.scope][name] != "undefined"){
        log('Got variable: '+name+' with value: '+scope[config.scope][name]);
        if (index != undefined){
            return [scope[config.scope][name][index]];
        } else {
            return [scope[config.scope][name]];
        }
    } else if (variables[name]) {
        log('Got variable: '+name+' with value: '+variables[name].value+' and type: '+variables[name].type+'\n');
        if (index != undefined){
            return [variables[name]["value"][index]];
        } else {
            return [variables[name].value, variables[name].type];
        }
    } else {
        return undefined; // or handle the case when the variable is not found
    }
}

function dump(def){
    log("Dumping variables\n");
    console.log(variables, scope, def);
}

function throwError(message) {
    log(`Error: ${message}\n`);
    
    if (config["mode"] == "script") {
        if (config['try']) {
            throw new throwError(`Error: ${message}`);
        } else {
            console.error(`Error: ${message}`);
            process.exit(1);
        }
    } else {
        console.error(`Error: ${message}`);
    }
}

module.exports = {
    setVariable,
    getVariable,
    dump,
    throwError,
    config,
    scope,
    log
}
