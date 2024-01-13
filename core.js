const eval = require("./eval");
const {setVariable, getVariable, dump, throwError} = require("./mem");
const {execSync} = require('child_process');
const fs = require("fs");

function display_(params) {
    const val = eval(params, def);
    if (typeof val == "object") {
        console.log(val.join(" "));
    } else {
        console.log(val);
    }
    return [0, "NumberLiteral"];
}

function set_(statement) {
    const varName = statement[1].value;
    let i = 0;
    if (statement[2].type == "ArrayExpression") {
        var index = eval(statement[2].value, def);
        if (index.length > 1) {
            throwError("Array index cannot be more than 1 (core)");
            return undefined;
        }
        i = 1;
    }

    if (statement[i+3].type == "CallExpression") {
        const val = eval(statement[i+3].params, def);
        if (typeof val == "number") {
            setVariable(varName, val, "NumberLiteral", index);
        } else if (typeof val == "string") {
            setVariable(varName, val, "StringLiteral", index);
        } else {
            setVariable(varName, val, "FloatLiteral", index);
        }
    } else if (statement[i+3].type == "ArrayExpression") {
        const val = eval(statement[i+3].value, def);
        setVariable(varName, val, "ArrayExpression", index);

    } else if (statement[i+3].type == "Identifier") {
        
        //if it is a call expression
        if (statement[i+4].type == "CallExpression") {
            if (def[statement[i+3].value]){
                const val = def[statement[i+3].value](statement[i+4].params);
                if (val){
                setVariable(varName, val[0], val[1], index);
                } else {
                setVariable(varName, undefined, "Undefined", index);
                }
            } else {
                throwError(`${statement[i+3].value} is not defined (core)`);
            }
        } else {
            if (statement[i+4].type == "ArrayExpression") {
                var second_index = eval(statement[i+4].value, def);
            }
            const val = getVariable(statement[i+3].value, second_index || index);
            if (val) {
                if (!Array.isArray(val[0])) {
                    setVariable(varName, val[0], val[1], index);
                } else {
                    setVariable(varName, val[0][0], val[0][1], index);
                }
            } else {
                throwError(
                    `Variable ${statement[i+3].value} is not defined`
                );
                return undefined;
            }
        }
    } else {
        const val = statement[i+3].value;
        setVariable(varName, val, statement[i+3].type, index);
    }
}

function input_(params) {
    const prompt = require("prompt-sync")();
    let input;
    val = eval(params, def);
    if (countParams(params) > 1) {
        input = prompt(val.join(" "));
    }
    else {
        input = prompt(val);
    }
    return [input, "StringLiteral"];
}

function sum_(params) {
    let sum = 0;
    params.forEach(element => {
        if (element.type == "NumberLiteral" || element.type == "FloatLiteral"){
            sum += parseFloat(element.value);
        }
    });
    return [sum, "NumberLiteral"];
}


function now(){
    return [Date.now(), "NumberLiteral"];
}

//to conevrt a string to a number
function num_(params) {
    const val = eval(params, def);
    
    if (!isNaN(parseFloat(val))) {
        return [parseFloat(val), "NumberLiteral"];
    } else {
        throwError(`${val} is not a number (core)`);
        return [0, "NumberLiteral"];
    }
}

//to read file
function read_(params) {
    const val = eval(params, def);
    try {
        return [fs.readFileSync(val, "utf8"), "StringLiteral"];
    } catch (err) {
        throwError(`${val} is not a file (core)`);
        return [0, "NumberLiteral"];
    }
}

//to write to file (overwrites)
function write_(params) {
    const val = eval(params, def);
    try {
        console.log(val[0], val[1]);
        fs.writeFileSync(val[0], val[1]);
    } catch (err) {
        throwError(`${val} is not a file (core)`);
    }
    return [0, "NumberLiteral"];
}

//to append to file
function append_(params) {
    const val = eval(params, def);
    try {
        fs.appendFileSync(val[0], val[1]);
    } catch (err) {
        throwError(`${val} is not a file (core)`);
    }
    return [0, "NumberLiteral"];
}

//to delete a file
function delete_(params) {
    const val = eval(params, def);
    try {
        fs.unlinkSync(val);
    } catch (err) {
        throwError(`${val} is not a file (core)`);
    }
    return [0, "NumberLiteral"];
}

//to check if a file exists
function exists_(params) {
    const val = eval(params, def);
    try {
        fs.accessSync(val);
        return [0, "NumberLiteral"];
    } catch (err) {
        return [1, "NumberLiteral"];
    }
}

//to split "StringLiteral" into an "ArrayExpression"
function split_(params) {
    const val = eval(params, def);
    const delimiter = val[1];
    const final = val[0].split(delimiter);
    return [final, "ArrayExpression"];
}

//to calculate the length of an "ArrayExpression"
function len_(params) {
    const val = eval(params, def);
    return [val.length, "NumberLiteral"];
}

//to pop an element from an "ArrayExpression" and delete it, also return the popped element
function pop_(params) {
    const val = eval(params, def);
    const index = val[1];
    val[0].splice(index, 1);
    return [val[0], "ArrayExpression"];
}

//to run os shell commands
function cmd_(params) {
    const command = eval(params, def);

    try {
        // execute command synchronously and capture the output
        const output = execSync(command, { encoding: 'utf-8' });
        return [output, "StringLiteral"];
    } catch (error) {
        return [`${error.message} (core)`, "StringLiteral"];
    }
}

function changecwd_(params) {
    const val = eval(params, def);
    try{
        process.chdir(val);
    } catch (err){
        throwError(`Error: ${err} (core)`);
    }
    setVariable("cwd", val, "StringLiteral");
    return [val, "NumberLiteral"];
}

function countParams(params){
    var count = 1;
    params.forEach(element => {
        if (element.type == "Delimiter" && element.value == ","){
            count++;
        }
    });
    return count;

}

const def = {
    display: function (statement){
        return display_(statement);
    },
    set: function (statement){
        return set_(statement);
    },
    input: function (params){
        return input_(params);
    },
    sum: function (params){
        return sum_(params);
    },
    now: function (){
        return now();
    },
    num: function (params){
        return num_(params);
    },
    read: function (params){
        return read_(params);
    },
    write: function (params){
        write_(params);
    },
    append: function (params){
        append_(params);
    },
    delete: function (params){
        delete_(params);
    },
    exists: function (params){
        return exists_(params);
    },
    split: function (params){
        return split_(params);
    },
    len: function (params){
        return len_(params);
    },
    pop: function (params){
        return pop_(params);
    },
    changecwd: function (params){
        return changecwd_(params);
    },
    cmd: function (params){
        return cmd_(params);
    },
    exit: function (){
        process.exit(0);
    },
    dump: function (){
        dump(def);
    },
};

module.exports = {def, display_, set_};