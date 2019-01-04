import * as esprima from 'esprima';
import * as codegen from 'escodegen';
import * as expreval from 'expr-eval';
var parser = expreval.Parser;

var places = [];
var edges = [];
var index = 1;
var inputvec = [];

const parseCode = (codeToParse, input) => {
    places = [];
    edges = [];
    index = 1;
    var nodeList = [];

    var parsedCode = esprima.parseScript(codeToParse, {loc: true,range: true});
    if (input != '') {
        inputvec = fixInputVector(input);
    }

    something(parsedCode, nodeList, true);
    var fcPlaces = makeFlowChartPlaces();
    var fcEdges = makeFlowChartEdges();
    return fcPlaces.join('\n') + '\n' + fcEdges.join('\n');
};

function makeFlowChartPlaces() {
    var ans = [];
    for (var x in places) {
        var cur = places[x];
        var color = cur.color;
        if (Object.keys(inputvec).length == 0) {
            color = false;
        }
        ans.push(cur.number + '=>' + cur.type + ': ' + cur.str + '|' + color);
    }
    return ans;
}
function makeFlowChartEdges() {
    var ans = [];
    for (var x in edges) {
        var cur = edges[x];
        if (cur.cond == undefined) {
            ans.push(cur.from + '->' + cur.to);
        } else if (cur.cond) {
            ans.push(cur.from + '(yes)->' + cur.to);
        } else {
            ans.push(cur.from + '(no)->' + cur.to);
        }
    }
    return ans;
}

function parseProgram(p, nodeList, cond) {
    for (var x in p.body) {
        return something(p.body[x], nodeList, cond);
    }
}
function parseVariableDeclaration(p, nodeList, cond) {
    for (var x in p.declarations) {
        return something(p.declarations[x], nodeList, cond);
    }
}
function parseVariableDeclarator(p, nodeList) {
    var name = p.id.name;
    var line = p.loc.start.line;
    var val;
    try {
        val = parser.evaluate(val, addNodes(nodeList, p.loc.start.line));
    } catch (e) {
        val = codegen.generate(p.init);
    }
    nodeList.push({name: name, line: line, val: val});
}
function parseFunctionDeclaration(p, nodeList, cond) {
    var body = p.body.body;
    var i = 0;
    var place = {number: index,str: '',type: 'operation',color: cond};
    if(body.length != 0){
        while (body[i].type === esprima.Syntax.VariableDeclaration) {
            something(body[i], nodeList, cond);
            place['str'] += codegen.generate(body[i]) + ' ';
            i++;
        }
        places.push(place);
        edges.push({from: index,to: index + 1,cond: undefined});
        index++;
        for (i; i < body.length; i++) {
            something(body[i], nodeList, cond);
        }
    }
}
function helper1(p,nodeList,cond,x){
    var newBody = '';
    while (p.body[x] != undefined && p.body[x].type != esprima.Syntax.IfStatement && p.body[x].type != esprima.Syntax.WhileStatement) {
        something(p.body[x], nodeList, cond);
        newBody += codegen.generate(p.body[x]) + ' ';
        x++;
    }
    return [newBody, x];
}

function parseBlockStatement(p, nodeList, cond) {
    var lastIx;
    for (var x = 0; x < p.body.length; x++) {
        var ans = helper1(p,nodeList,cond, x);
        lastIx = index;
        x = ans[1];
        places.push({number: index, str: ans[0], type: 'operation', color: cond});
        index++;
        if (p.body[x] != undefined && (p.body[x].type == esprima.Syntax.IfStatement || p.body[x].type == esprima.Syntax.WhileStatement)){
            edges.push({from: index - 1,to: index,cond: undefined});
            lastIx = something(p.body[x], nodeList, cond);
        }
    }
    return lastIx;
}
function parseIfStatement(p, nodeList, cond) {
    var test = p.test;
    var consequent = p.consequent;
    var alternate = p.alternate;
    places.push({number: index,str: codegen.generate(test),type: 'condition',color: cond});
    edges.push({from: index,to: index + 1,cond: true});
    var ifindex = index; index++;
    var x = checkTest(test, nodeList);
    var newNodeList = nodeList.slice();
    var conqLastIx = something(consequent, newNodeList, x);
    newNodeList = nodeList.slice();
    var altLastIx = something(alternate, newNodeList, !x);
    var iXNow = conqLastIx;
    if(ifindex + 1 == conqLastIx) iXNow = ifindex + 2;
    edges.push({from: ifindex, to: iXNow ,cond: false});
    if(altLastIx != undefined) edges.push({from: altLastIx, to: index, cond: undefined});
    if(conqLastIx != index) edges.push({from: conqLastIx, to: index, cond: undefined});
    return index;
}
function parseBinaryExpression(p, nodeList, cond) {
    something(p.left, nodeList, cond);
    something(p.right, nodeList, cond);
}
// function parseIdentifier(p, nodeList, cond) {}
function parseExpressionStatement(p, nodeList, cond) {
    something(p.expression, nodeList, cond);
}
function parseReturnStatement(p, nodeList, cond) {
    places.push({number: index++,str: codegen.generate(p),type: 'operation',color: cond});
}
function parseAssignmentExpression(p, nodeList,cond) {
    var name = p.left.name;
    var line = p.loc.start.line;
    var val;
    try {
        val = parser.evaluate(val, addNodes(nodeList, p.loc.start.line));
    } catch (e) {
        val = codegen.generate(p.right);
    }
    nodeList.push({name: name, line: line, val: val});
    something(p.right, nodeList, cond);
}
function parseWhileStatement(p, nodeList, cond) {
    var test = p.test;
    var body = p.body;
    places.push({number: index, str: 'NULL', type: 'operation', color: cond});
    var nullIx = index;
    edges.push({from: index,to: index + 1,cond: undefined});
    index++;
    //TODO: cond?!?
    places.push({number: index,str: codegen.generate(test),type: 'condition',color: cond});
    edges.push({from: index,to: index + 1,cond: true});
    edges.push({from: index,to: index + 2,cond: false});
    index++;
    var newNodeList = nodeList.slice();
    var bodyLastIx = something(body, newNodeList, cond);
    edges.push({from: bodyLastIx, to: nullIx, cond: undefined});
    return index;
}

function something(p, nodeList, cond) {
    if (p == null || p == undefined) 
        return;
    var myMap = {
        'Program': parseProgram,
        'VariableDeclaration': parseVariableDeclaration,
        'VariableDeclarator': parseVariableDeclarator,
        'FunctionDeclaration': parseFunctionDeclaration,
        'BlockStatement': parseBlockStatement,
        'IfStatement': parseIfStatement,
        'BinaryExpression': parseBinaryExpression,
        //'Identifier': parseIdentifier,
        'ExpressionStatement': parseExpressionStatement,
        'ReturnStatement': parseReturnStatement,
        'AssignmentExpression': parseAssignmentExpression,
        'WhileStatement': parseWhileStatement
    };
    if(myMap.hasOwnProperty(p.type))
        return myMap[p.type](p, nodeList, cond);
}

function checkTest(test, nodeList) {
    var withNodes = addNodes(nodeList, test.loc.start.line);
    var test2 = codegen.generate(test);
    var ans = parser.evaluate(test2, withNodes);
    return ans;
}

function fixInputVector(input) {
    var splitted = input
        .replace(/\s/g, '')
        .slice(1, -1)
        .split(',');
    var inputvec = [];
    for (var x in splitted) {
        var ind = splitted[x].split('=');
        inputvec[ind[0]] = eval(ind[1]);
    }
    return inputvec;
}

function addNodes(nodes) {
    var ans = [];
    for(var x in inputvec){
        ans[x] = inputvec[x];
    }
    for (var y in nodes) {
        ans[nodes[y].name] = nodes[y].val;
    }
    return ans;
}

export {parseCode};