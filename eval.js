const { getVariable, throwError, log } = require('./mem');

function eval(node, def) {
    if (node.length == 0) {
        return "";
    }
    if (node[0].type == 'CallExpression') {
        return eval(node[0].params, def);;
    }
    //if has multiple params, call eval recursively and return the result as []
    //find no. of params by counting no. of commas
    if (node.length > 1) {
        var params = [];
        var param = [];
        var count = 0;
        for (let i = 0; i < node.length; i++) {
            if (node[i].type === 'Delimiter' && node[i].value === ',') {
                params.push(param);
                param = [];
                count++;
            } else {
                param.push(node[i]);
            }
        }
        params.push(param);
        count++;
        if (count > 1) {
            var result = [];
            for (let i = 0; i < count; i++) {
                result.push(eval(params[i], def));
            }
            return result;
        }
    }
    var variableValue;
    if (node[0].type === 'Identifier' && node.length === 1 || node[0].type === 'Identifier' && node[1].type === 'ArrayExpression') {
        if (getVariable(node[0].value)) {
            //if it is an array with index, return the value at that index
            if (node[1] && node[1].type === 'ArrayExpression') {
                index = eval(node[1].value, def);
                variableValue = getVariable(node[0].value, index)[0];
                operand = variableValue;
            } else {
                variableValue = getVariable(node[0].value)[0];
                operand = variableValue;
            }
        }
        else {
            throwError(`Variable ${node[0].value} is not defined (eval)`);
            return undefined;
        }

        if (typeof variableValue == 'object') {
            return variableValue;
        } else if (isNaN(parseFloat(variableValue))) {
            return variableValue;
        } else {
            return parseFloat(variableValue);
        }
    }
    
    var result = '';
    //if node[0] is string, let result = node[0].value.tosring()
    if (node[0].type === 'StringLiteral') {
        result = node[0].value;
    }
    else if (node[0].type === 'Identifier') {

        if (node[1]&&node[1].type === 'CallExpression') {
            if (def[node[0].value]) {
                log('Calling function: '+node[0].value+' with params: '+JSON.stringify(node[1].params)+'\n');
                variableValue = def[node[0].value](node[1].params);
                log('Function returned: '+JSON.stringify(variableValue)+'\n');
                if (variableValue === undefined) {
                    variableValue = [0, 'NumberLiteral'];
                }
                if (variableValue[0] === undefined) {
                    result = variableValue;
                } else {
                    result = variableValue[0];
                }
            } else {
                throwError(`${node[0].value} is not defined (eval)`);
            }
        } else {
            const variableValue = getVariable(node[0].value);
            if (variableValue === undefined || variableValue === null || variableValue === '' || variableValue === NaN) {
                throwError(`Variable ${node[0].value} is not defined (eval)`);
                return undefined;
            }

            if (isNaN(parseFloat(variableValue[0]))) {
                result = variableValue[0];
            } else {
                result = parseFloat(variableValue[0]);
            }
        }
    } else {
        result = parseFloat(node[0].value);
    }
    for (let i = 1; i < node.length; i += 2) {
        const operator = node[i].value;
        let operand;
        var variableValue;

        if (node[i+1]===undefined){
            node[i+1] = {type: 'NumberLiteral', value: 0};
        }
        
        if (node[i + 1].type === 'Identifier') {
            if (node[i+2] && node[i + 2].type === 'CallExpression') {
                if (def[node[i+1].value]) {
                    log('Calling function: '+node[i+1].value+' with params: '+JSON.stringify(node[i+2].params)+'\n');

                    variableValue = def[node[i+1].value](node[i+2].params);
                    log('Function returned: '+JSON.stringify(variableValue)+'\n\n');

                    if (variableValue === undefined) {
                        variableValue = [0, 'NumberLiteral'];
                    }
                    operand = variableValue[0];
                } else {
                    throwError(`${node[i+1].value} is not defined (eval)`);
                }
            } else {
                variableValue = getVariable(node[i + 1].value);
                //if is array, get first element
                if (typeof variableValue == "object") {
                    variableValue = variableValue[0];
                }
                if (variableValue === undefined) {
                    throwError(`Variable ${node[i + 1].value} is not defined (eval)`);
                    return undefined;
                }

                if (typeof variableValue[0] == "string" || variableValue[1] === 'StringLiteral') {
                    operand = variableValue;
                } else {
                    operand = parseFloat(variableValue[0]);
                }
            }
        } else {
            if (node[i + 1].type === 'StringLiteral') {
                operand = node[i + 1].value;
            } else {
                operand = parseFloat(node[i + 1].value);
            }
        }

        switch (operator) {
            case '+':
                result += operand;
                break;
            case '-':
                result -= operand;
                break;
            case '*':
                result *= operand;
                break;
            case '/':
                result /= operand;
                break;
            case '%':
                result %= operand;
                break;
            case '**':
                result **= operand;
                break;
            case '&':
                result = result.toString() + operand.toString();
                break;
            case '==':
                result = result == operand ? 1 : 0;
                break;
            case '!=':
                result = result != operand ? 1 : 0;
                break;
            case '<':
                result = result < operand ? 1 : 0;
                break;
            case '>':
                result = result > operand ? 1 : 0;
                break;
            case undefined:
                break;
            default:
                throwError(`Operator ${operator} is not supported`);
                return undefined;
        }
    }
    return result;
}

module.exports = eval;
