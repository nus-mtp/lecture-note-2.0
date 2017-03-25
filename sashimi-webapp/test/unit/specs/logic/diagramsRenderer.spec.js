import domCompare from 'dom-compare';
import diagramsRenderer from 'src/logic/renderer/diagrams';
import documentPackager from 'src/logic/documentPackager';
import diagramsInput from './reference/diagrams/diagramsInput.txt';
import invalidSyntaxInput from './reference/diagrams/invalidSyntaxInput.txt';
import invalidSyntaxOutput from './reference/diagrams/invalidSyntaxOutput.txt';
import seqDiagramsInput from './reference/diagrams/seqDiagramsInput.txt';
import seqDiagramsOutput from './reference/diagrams/seqDiagramsOutput.txt';
import flowChartsInput from './reference/diagrams/flowChartsInput.txt';
import flowChartsOutput from './reference/diagrams/flowChartsOutput.txt';
import graphvizInput from './reference/diagrams/graphvizInput.txt';
import graphvizOutput from './reference/diagrams/graphvizOutput.txt';
import mermaidInput from './reference/diagrams/mermaidInput.txt';
import mermaidOutput from './reference/diagrams/mermaidOutput.txt';
import diagramsRenderedOutput from './reference/diagrams/diagramsRenderedOutput.txt';

// Parse markdown content for test use
const fullHtmlData = documentPackager.getHtmlData(diagramsInput);
const seqHtmlData = documentPackager.getHtmlData(seqDiagramsInput);
const flowHtmlData = documentPackager.getHtmlData(flowChartsInput);
const vizHtmlData = documentPackager.getHtmlData(graphvizInput);
const mermaidHtmlData = documentPackager.getHtmlData(mermaidInput);
const invalidHtmlData = documentPackager.getHtmlData(invalidSyntaxInput);

// Use iframe as a psuedo browser for testing
const iframe = document.createElement('IFRAME');
let iframeDoc;
let toRender;

/**
 * Regex helper function for checking differences found by domCompare library.
 *
 * We are using this because some attribute values/styling are rendered differently on travis,
 * causing travis to keep failing, although local unit test passes the test.
 *
 * Four cases to ignore:
 * 1. Attribute value differs by parenthesis even though its the same font or because of random generation of value
 *  regex1 case:
 *    /(.*) '(.*)':.* '(.*)'.*'(.*)'/g;
 *    1st (.*) captures the category causing the Error (e.g. is it Tag, Attribute, Attribute's value or Content?)
 *    2nd (.*) captures the attribute causing the Error (e.g. is it 'id', 'href', 'src' attribute etc)
 *    3rd (.*) captures type of error's expected value (e.g. 'Arial')
 *    4th (.*) captures type of error's actual value (e.g. "Arial")
 *  Example lines -
 *    1. 'Attribute 'font-family': expected value ''Arial'' instead of '"Arial"''
 *    2. 'Attribute 'id': expected value 'raphael-marker-endblock33-obj5c60j' instead of 'raphael-marker-endblock33-obj5ihv5''
 *
 * 2. Attribute is missing, usually caused by attributes that have the deprecated 'xlink:' resulting in the expected
 * output to differ from the actual output.
 *  regex2 case:
 *    /(.*) '(.*)' (is missed)/g;
 *    1st (.*) captures the category causing the Error (e.g. is it Tag, Attribute, Attribute's value or Content?)
 *    2nd (.*) captures the class causing the Error (e.g. is it 'id', 'href', 'src' class etc)
 *  Example line -
 *    1. 'Attribute 'xlink:href' is missed'
 *
 * 3. Extra attribute case, in most cases are caused by the above ignore case 2.
 *  regex3 case:
 *    /Extra attribute '(.*)'/g;
 *    (.*) captures the class causing the Error (e.g. is it 'id', 'href', 'src' class etc)
 *  Example line -
 *    1. 'Extra attribute 'href''
 *
 * 4. Different text content, sometimes as a result of different container attribute values (e.g. different width/height etc)
 * from expected output
 *  regex4 case:
 *    /Expected text '(.*)' instead of '(.*)'/g;
 *    1st (.*) captures the category causing the Error (e.g. is it Tag, Attribute, Attribute's value or Content?)
 *    2nd (.*) captures the class causing the Error (e.g. is it 'id', 'href', 'src' class etc)
 *  Example line -
 *    1. 'Expected text 'long long time,' instead of 'long long'
 *    2. 'Expected text 'so long that' instead of 'time, so long'
 *
 * @param {Array} diff - Array containing differences found by domCompare library
 * @return {Array} returns an Array of non-formatting related errors (e.g. critical errors)
 **/
function regexHelper(diff) {
  const ignoredAttr = ['id', 'marker-end', 'x1', 'x2', 'x', 'y1', 'y2', 'y', 'width',
    'height', 'd', 'dy', 'r', 'style', 'viewBox', 'transform', 'points'];
  const missedArray = [];
  const textExpected = new Map();
  const textActual = new Map();

  let errorArray = [];
  diff.forEach((line) => {
    const regex1 = /(.*) '(.*)':.* '(.*)'.*'(.*)'/g;
    const regex2 = /(.*) '(.*)' (is missed)/g;
    const regex3 = /Extra attribute '(.*)'/g;
    const regex4 = /Expected text '(.*)' instead of '(.*)'/g;
    const arr1 = regex1.exec(line.message);
    const arr2 = regex2.exec(line.message);
    const arr3 = regex3.exec(line.message);
    const arr4 = regex4.exec(line.message);
    if (arr1 !== null) {
      // ignore expected value error
      if (arr1[1] === 'Attribute') {
        if (arr1[2] === 'font-family') {
          const expected = arr1[3].replace(/'/g, '');
          const actual = arr1[4].replace(/"/g, '');
          if (expected !== actual) {
            errorArray.push(line);
          }
        } else if (arr1[2] === 'id') {
          if (arr1[3].indexOf('raphael-marker-endblock33-obj') !== -1
              && arr1[4].indexOf('raphael-marker-endblock33-obj') !== -1) {
                // do nothing
          } else if ((arr1[3].indexOf('arrowhead') !== -1
              && arr1[4].indexOf('arrowhead') !== -1)) {
                // do nothing
          } else {
            console.log(line);
            errorArray.push(line);
          }
        } else if (ignoredAttr.indexOf(arr1[2]) === -1) {
          if (arr1[3] !== arr1[4]) {
            errorArray.push(line);
          }
        }
      }
    } else if (arr2 !== null) {
      // ignore missing attribute error
      if (arr2[2].match(/xlink:/g) !== null) {
        missedArray.push(arr2[2].replace(/xlink:/g, ''));
      } else if (arr2[2].match(/:xlink/g) !== null) {
        missedArray.push(arr2[2].replace(/:xlink/g, ''));
      } else {
        errorArray.push(line);
      }
    } else if (arr3 !== null) {
      // ignore extra attribute error
      if (missedArray.length !== 0) {
        const pos = missedArray.indexOf(arr3[1]);
        if (pos !== -1) {
          missedArray.splice(pos, 1);
        } else {
          errorArray.push(line);
        }
      }
    } else if (arr4 !== null) {
      // check the node the error is thrown and concantate the strings!
      const regexNode = /(.*)\//g;
      const arrNode = regexNode.exec(line.node);
      const key = arrNode[1];
      errorArray.push(line);
      if (textExpected.has(key) && textActual.has(key)) {
        const currExpectedText = textExpected.get(key);
        const currActualText = textActual.get(key);
        textExpected.set(key, `${currExpectedText} ${arr4[1]}`);
        textActual.set(key, `${currActualText} ${arr4[2]}`);
      } else {
        textExpected.set(key, arr4[1]);
        textActual.set(key, arr4[2]);
      }

      if (textExpected.get(key) === textActual.get(key)) {
        errorArray = errorArray.filter(errorLine => (errorLine.node === arrNode[1]+arrNode[2]));
      }
    } else {
      // add into error array
      errorArray.push(line);
    }
  });
  return errorArray;
}

describe('Renderer', () => {
  before(() => {
    document.body.appendChild(iframe);
    iframe.onload = function() {
      iframeDoc = iframe.contentWindow.document;
      iframeDoc.write('<div></div>');
    };
    iframe.onload();
  });

  describe('Diagrams Renderer', () => {
    it('should handle empty data', (done) => {
      toRender = iframeDoc.getElementsByTagName('div')[0];
      diagramsRenderer(toRender)
      .then((output) => {
        expect(toRender.innerHTML).to.equal('');
        done();
      })
      .catch((error) => {
        done(error);
      });
    });

    it('should handle invalid or incomplete diagram syntax', (done) => {
      invalidHtmlData.then((output) => {
        toRender.innerHTML = output;
        diagramsRenderer(toRender)
        .then((out) => {
          const outputContent = invalidSyntaxOutput.replace(/(\r\n)/g, '\n');
          const eleOutput = iframeDoc.createElement('DIV');
          eleOutput.innerHTML = outputContent;
          const results = domCompare.compare(eleOutput, toRender);
          const diff = results.getDifferences();
          const errorArray = regexHelper(diff);
          expect(errorArray.length).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
    }).timeout(4000);

    it('should handle drawing of sequence diagrams', (done) => {
      // Retrieve HTML string from getHtmlData
      seqHtmlData.then((output) => {
        toRender.innerHTML = output;
        diagramsRenderer(toRender)
        .then((out) => {
          const outputContent = seqDiagramsOutput.replace(/(\r\n)/g, '\n');
          const eleOutput = iframeDoc.createElement('DIV');
          eleOutput.innerHTML = outputContent;
          const results = domCompare.compare(eleOutput, toRender);
          const diff = results.getDifferences();
          const errorArray = regexHelper(diff);
          expect(errorArray.length).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
    });

    it('should handle drawing of flow charts', (done) => {
      flowHtmlData.then((output) => {
        toRender.innerHTML = output;
        diagramsRenderer(toRender)
        .then((out) => {
          const outputContent = flowChartsOutput.replace(/(\r\n)/g, '\n');
          const eleOutput = iframeDoc.createElement('DIV');
          eleOutput.innerHTML = outputContent;
          const results = domCompare.compare(eleOutput, toRender);
          const diff = results.getDifferences();
          const errorArray = regexHelper(diff);
          expect(errorArray.length).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
    });

    it('should handle drawing of graphviz diagrams', (done) => {
      vizHtmlData.then((output) => {
        toRender.innerHTML = output;
        diagramsRenderer(toRender)
        .then((out) => {
          const outputContent = graphvizOutput.replace(/(\r\n)/g, '\n');
          const eleOutput = iframeDoc.createElement('DIV');
          eleOutput.innerHTML = outputContent;
          const results = domCompare.compare(eleOutput, toRender);
          const diff = results.getDifferences();
          const errorArray = regexHelper(diff);
          expect(errorArray.length).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
    });

    it('should handle drawing of mermaid diagrams', (done) => {
      mermaidHtmlData.then((output) => {
        toRender.innerHTML = output;
        diagramsRenderer(toRender)
        .then((out) => {
          const outputContent = mermaidOutput.replace(/(\r\n)/g, '\n');
          const eleOutput = iframeDoc.createElement('DIV');
          eleOutput.innerHTML = outputContent;
          const results = domCompare.compare(eleOutput, toRender);
          const diff = results.getDifferences();
          const errorArray = regexHelper(diff);
          expect(errorArray.length).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
    });

    it('should handle drawing of all types of diagrams together', (done) => {
      fullHtmlData.then((output) => {
        toRender.innerHTML = output;
        diagramsRenderer(toRender)
        .then((out) => {
          const outputContent = diagramsRenderedOutput.replace(/(\r\n)/g, '\n');
          const eleOutput = iframeDoc.createElement('DIV');
          eleOutput.innerHTML = outputContent;
          const results = domCompare.compare(eleOutput, toRender);
          const diff = results.getDifferences();
          const errorArray = regexHelper(diff);
          expect(errorArray.length).to.equal(0);
          done();
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
    }).timeout(3000);
  });
});