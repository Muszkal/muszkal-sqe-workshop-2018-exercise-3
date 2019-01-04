import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {

    it('test1', () => {
        assert.equal(parseCode('function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; while (a < z) { c = a + b; z = c * 2; } return z; }',''),
        '1=>operation: let a = x + 1; let b = a + y; let c = 0; |false\n2=>operation: NULL|false\n3=>condition: a < z|false\n4=>operation: c = a + b; z = c * 2; |false\n5=>operation: return z;|false\n1->2\n2->3\n3(yes)->4\n3(no)->5\n4->2'
        );
    });

    it('test2', () => {
        assert.equal(parseCode('function foo(x, y, z){' + 
            'let a = x + 1;'+
            'let b = a + y;'+
            'let c = 0;'+
            'if (b < z) {'+
                'c = c + 5;'+
            '} else if (b < z * 2) {'+
                'c = c + x + 5;'+
            '} else {'+
                'c = c + z + 5;'+
            '}'+
            'return c;'+
        '}', '(x=1, y=1, z=3)'),
        '1=>operation: let a = x + 1; let b = a + y; let c = 0; |true\n2=>condition: b < z|true\n3=>operation: c = c + 5; |false\n4=>condition: b < z * 2|true\n5=>operation: c = c + x + 5; |false\n6=>operation: c = c + z + 5; |true\n7=>operation: return c;|true\n1->2\n2(yes)->3\n4(yes)->5\n4(no)->6\n6->7\n5->7\n2(no)->4\n7->7\n3->7'
        );
    });

    it('test3', () => {
        assert.equal(parseCode('function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; if (b < z) { c = c + 5; return x + y + z + c; } else if (b < z * 2) { c = c + x + 5; return x + y + z + c; } else { c = c + z + 5; return x + y + z + c; } }', '(x=1,y=2,z=3)'),
        '1=>operation: let a = x + 1; let b = a + y; let c = 0; |true\n2=>condition: b < z|true\n3=>operation: return x + y + z + c;|false\n4=>operation: c = c + 5; return x + y + z + c; |false\n5=>condition: b < z * 2|true\n6=>operation: return x + y + z + c;|false\n7=>operation: c = c + x + 5; return x + y + z + c; |false\n8=>operation: return x + y + z + c;|true\n9=>operation: c = c + z + 5; return x + y + z + c; |true\n1->2\n2(yes)->3\n5(yes)->6\n5(no)->7\n9->10\n7->10\n2(no)->4\n10->10\n4->10'
        );
    });
    
    it('test4', () => {
        assert.equal(parseCode('function foo(){ if (1 < 2) { var x = 1; return x; } }',''),
        '1=>operation: |true\n2=>condition: 1 < 2|true\n3=>operation: return x;|true\n4=>operation: var x = 1; return x; |true\n1->2\n2(yes)->3\n2(no)->4\n4->5'
        );
    });

    it('test5', () => {
        assert.equal(parseCode('function foo(){ let x = 3; if (1 < 2) { x = 1 + 3; return 1; } }', ''),
        '1=>operation: let x = 3; |true\n2=>condition: 1 < 2|true\n3=>operation: return 1;|true\n4=>operation: x = 1 + 3; return 1; |true\n1->2\n2(yes)->3\n2(no)->4\n4->5'
        );
    });

    it('test6', () => {
        assert.equal(parseCode('function foo() { if (true) { return 1; } let xxx = 3; }', ''),
        '1=>operation: |true\n2=>condition: true|true\n3=>operation: return 1;|true\n4=>operation: return 1; |true\n1->2\n2(yes)->3\n2(no)->4\n4->5'
        );
    });

    it('test7', () => {
        assert.equal(parseCode('function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; if (b < z) { c = c + 5; if (b < z * 2) { c = c + x + 5; return x + y + z + c; } } }', ''),
        '1=>operation: let a = x + 1; let b = a + y; let c = 0; |true\n2=>condition: b < z|true\n3=>operation: c = c + 5; |false\n4=>condition: b < z * 2|false\n5=>operation: return x + y + z + c;|false\n6=>operation: c = c + x + 5; return x + y + z + c; |false\n1->2\n2(yes)->3\n3->4\n4(yes)->5\n4(no)->6\n6->7\n2(no)->7'
        );
    });

    it('test8', () => {
        assert.equal(parseCode('', ''), '\n'
        );
    });

    it('test9', () => {
        assert.equal(parseCode('function foo(){}', ''), '\n'
        );
    });

    it('test10', () => {
        assert.equal(parseCode('function foo(x){let b = 2; if (b < x) { return 3; } }', ''), 
        '1=>operation: let b = 2; |true\n2=>condition: b < x|true\n3=>operation: return 3;|false\n4=>operation: return 3; |false\n1->2\n2(yes)->3\n2(no)->4\n4->5'
        );
    });

    it('test11', () => {
        assert.equal(parseCode('function foo(){ let a = 1 + 1; let b = a + 2; let c = 0; if (b < 3) { c = c + 5; if (b < 3 * 2) { c = c + 1 + 5; } } return 1 + 2 + 3 + c; }', ''), 
        '1=>operation: let a = 1 + 1; let b = a + 2; let c = 0; |true\n2=>condition: b < 3|true\n3=>operation: c = c + 5; |false\n4=>condition: b < 3 * 2|false\n5=>operation: c = c + 1 + 5; |false\n6=>operation: return 1 + 2 + 3 + c;|true\n1->2\n2(yes)->3\n3->4\n4(yes)->5\n4(no)->6\n5->6\n2(no)->6'
        );
    });

    it('test12', () => {
        assert.equal(parseCode('function foo(){ let a = 1 + 1; let b = a + 2; let c = 0; if (b < 3) { c = c + 5; while (b < 3 * 2) { c = c + 1 + 5; } } return 1 + 2 + 3 + c; }',''), 
        '1=>operation: let a = 1 + 1; let b = a + 2; let c = 0; |true\n2=>condition: b < 3|true\n3=>operation: c = c + 5; |false\n4=>operation: NULL|false\n5=>condition: b < 3 * 2|false\n6=>operation: c = c + 1 + 5; |false\n7=>operation: return 1 + 2 + 3 + c;|true\n1->2\n2(yes)->3\n3->4\n4->5\n5(yes)->6\n5(no)->7\n6->4\n2(no)->7'
        );
    });

    

});
