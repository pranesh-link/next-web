import { Col, Container, Row } from "reactstrap";
import "./App.css";
import Tree from "./tree";

export default function App() {
  return (
    <div className="App">
      <Container>
        <Row>
          <Col>
          <a href = 'https://www.hingehealth.com/resources/articles/meet-the-new-hinge-health-brand' target="_blank" rel="noreferrer">
            <img
              alt="app-logo"
              className="App-logo"
              src="/hh-logo.png"
            />
          </a>
            <h1>Welcome! Thanks for interviewing with Hinge Health!</h1>
            <p>
              We're going to work with some trees today. Our goal with this
              exercise isn't to "stump" anyone with tricky business, but to give
              candidates a fair and uniform way to express themselves in code on
              a realistic-ish problem.
            </p>
            <p>
              If invited to an on-site interview, you'll pair with us to refactor, discuss testing strategies, and
              continue the work you've completed, because we'd much rather see how you 
              work on a problem you're familiar with and have had time to think about 
              than on some clever whiteboard puzzle we spring on you.
            </p>
            <p>At this stage, we care most about:</p>
            <ul>
              <li>Interpreting written specifications (following instructions)</li>
              <li>
                General familiarity with layout, data modeling, and interactions
              </li>
              <li>Writing legible code</li>
            </ul>
            <p>
              When in doubt, do less, better. :)
            </p>
            <hr />
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <div className="App-instructions">
              <div className="App-step">Layout and style</div>
              <div className="App-instructions">
                <ol>
                  <li>
                    Check out the file <code>./src/tree/index.js</code>.
                  </li>
                  <li>
                    Replace the inline <code>&nbsp</code> "styling" with an improved layout
                    by editing the html and css in the <code>./src/tree/index.js</code>
                    and <code>./tree/index.css</code> files.
                  </li>
                  <li>
                    When the results look the same as the original,
                    please commit changes to main and push to remote.
                  </li>
                </ol>
              </div>
              <div className="App-step">Data modeling</div>
              <div className="App-instructions">
                <ol>
                  <li>
                    Check out the (empty) file <code>./src/tree/data.json</code>.
                  </li>
                  <li>
                    Add a JSON object to that file that represents our
                    animal tree. It should capture just the values and
                    relationships currently onscreen after step one.
                  </li>
                  <li>
                    Update <code>./tree/index.js</code> to use your JSON object
                    to draw the animal tree instead of the (styled) inline
                    text.
                  </li>
                  <li>
                    When the results look exactly the same as the original,
                    please commit changes and push to remote.
                  </li>
                </ol>
              </div>
              <div className="App-step">Interactions</div>
              <div className="App-instructions">
                <ol>
                  <li>
                    Add a text input immediately to the right of each animal.
                  </li>
                  <li>
                    When someone types a new animal in the text box and hits enter, add that animal as a 
                    child of the current node and make sure it is rendered on the screen. Some examples 
                    of how this works:
                    <ol>
                      <li>
                        If you have an input next to 'mammals', type the word 'cat', 
                        and hit enter, the word 'cat' would render below 'ape' at the same 
                        level of indentation as 'ape'.
                      </li>
                      <li>
                        If you have an input next to 'elephant', type the word 'mouse', 
                        and hit enter, the word 'mouse' would render below 'elephant' at the
                        next level of indentation'.
                      </li>
                      <li>
                        If you have an input next to 'dog', type the word 'cat', and 
                        hit enter, the word 'cat' would render below 'elephant' at the same 
                        level of indentation as 'elephant'. 
                      </li>
                    </ol> 
                  </li>
                  <li>
                    When you can add items from the tree, commit your
                    changes and push to remote.
                  </li>
                </ol>
              </div>
              <div className="App-step">On-Site next steps</div>
                If invited for an on-site interview, we may discuss/code one or more of the following:
                <ol>
                  <li>How would you add unit testing to this repo? What kinds of tests would you write?</li>
                  <li>How would you remove elements from the tree?</li>
                  <li>
                    Fun additions to the text itself, such as after the first letter of each element, add 
                    as many periods as the level the element is on. (Root is 0) E.g. <code>d..og</code>.
                  </li>
                </ol>
            </div>
          </Col>
          <Col sm={6}>
            <Tree />
          </Col>
        </Row>
      </Container>
    </div>
  );
}
