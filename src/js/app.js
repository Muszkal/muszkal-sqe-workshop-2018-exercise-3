import $ from 'jquery';
import {parseCode} from './code-analyzer';
import * as flowchart from 'flowchart.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let input = $('#inputVector').val();
        var ans = parseCode(codeToParse, input);
        let diagram = flowchart.parse(ans);
        var myNode = document.getElementById('diagram');
        while (myNode.firstChild) {myNode.removeChild(myNode.firstChild);}
        diagram.drawSVG('diagram', {'x': 0,'y': 0,'line-width': 3,'line-length': 50,'text-margin': 10,'font-size': 14,'font-color': 'black','line-color': 'black','element-color': 'black','fill': 'white','yes-text': 'TRUE','no-text': 'FALSE','arrow-end': 'block','flowstate': {'true': {'fill': '#58C4A3','font-size': 12,'yes-text': 'TRUE','no-text': 'FALSE'}}});});
});
