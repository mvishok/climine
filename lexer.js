const { throwError } = require('./mem');
function lexer(input){
    const keywords = ['if', 'else', 'let', ,'until', 'while', 'for', 'try', 'handle', 'define', 'return', 'include'];
    const operators = ['+', '-', '*', '/', '%', '**', '=', '>', '<', '==', '!=', '<=', '>=', '&&', '||', '!', '&'];
    const delimiters = ['(', ')', '{', '}', ';', ',', '[', ']'];

    let tokens = [];
    let current = 0;

    if (!input) {
        process.exit(0);
    }
    
    while(current < input.length){
        let char = input[current];

        if(char === '"'){
            let value = '';
            char = input[++current];

            while(char !== '"'){
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'string', value });
            current++;
            continue;
        }

        //if it is ' string
        if(char === "'"){
            let value = '';
            char = input[++current];

            while(char !== "'"){
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'string', value });
            current++;
            continue;
        }

        //if it is #, it is a comment
        if(char === '#'){
            let value = '';
            char = input[++current];
            
            while(char !== '\n'){
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'comment', value });
            current++;
            continue;
        }

        if(char === ' '){
            current++;
            continue;
        }

        if(/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(input[current+1]))){
            let value = '';

            while(/[0-9]/.test(char)){
                value += char;
                char = input[++current];
            }

            if(char === '.'){
                value += char;
                char = input[++current];
            }

            while(/[0-9]/.test(char)){
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'float', value });
            continue;
        }

        if(/[0-9]/.test(char)){
            let value = '';

            while(/[0-9]/.test(char)){
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'number', value });
            continue;
        }

        if(/[a-z]/i.test(char)){
            let value = '';

            while(/[a-z]/i.test(char)){
                value += char;
                char = input[++current];
            }

            if(keywords.includes(value)){
                tokens.push({ type: 'keyword', value });
            } else {
                tokens.push({ type: 'identifier', value });
            }

            continue;
        }

        if(operators.includes(char)){
            let value = '';

            while(operators.includes(char)){
                value += char;
                char = input[++current];
            }

            tokens.push({ type: 'operator', value });
            continue;
        }

        if(delimiters.includes(char)){
            tokens.push({ type: 'delimiter', value: char });
            current++;
            continue;
        }

        throwError('Unexpected character: ' + char);
    }

    return tokens;
   
}

module.exports = lexer;