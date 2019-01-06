import React, {Component} from 'react';
import './App.css';
import ContentEditable from 'react-sane-contenteditable';
import * as ReactDOM from 'react-dom';

let poem = [
    {word: 'Lorem', id: '' + 1},
    {word: 'Ipsum', id: '' + 2},
    {word: 'dolor', id: '' + 5},
    {word: 'sit', id: '' + 3},
    {word: 'amet', id: '' + 7}
];

class Word extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            word: props.word,
            previousWord: props.word,
            active: false,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleFocus = this.handleFocus.bind(this);

        this.editableElement =
            <ContentEditable
                tagName='span'
                content={this.state.word}
                editable={true}
                multiLine={false}
                sanitise={true}
                onClick={this.handleClick}
                onChange={this.handleChange}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
                ref={(ref) => this.editableElementRef = ref}
            />
    }

    componentDidUpdate(prevProps) {
        if (prevProps.active !== this.props.active) {
            if (this.props.active) {
                setTimeout(() => {
                    ReactDOM.findDOMNode(this.editableElementRef).focus();
                }, 150);
            }
        }
    }

    _updateWord(new_word) {
        this.setState({
            word: new_word
        });
        this.editableElementRef.setState({value: new_word});
        this.editableElementRef._element.innerText = new_word;
    }

    handleClick() {
        this.props.parent.onWordSelected(this.props.identifier);
    }

    handleChange(event, value) {
        this.setState({
            word: value
        });
    }

    handleFocus() {
        if (!this.state.active) {
            this.props.parent.onWordSelected(this.props.identifier);
        }
        /*setTimeout(
            () => document.execCommand('selectAll', false, null),
            150
        );*/
    }

    handleBlur(event) {
        if (this.state.word === this.state.previousWord) {
            // no change, pass
        } else if (this.state.previousWord !== ' ' && this.state.word === '') {
            // word got deleted
            this.props.parent.deleteWord(this.props.identifier);
        } else if (this.state.previousWord === ' ' && this.state.word === '') {
            // only a truncated space
            this._updateWord(' ');
        } else if (this.state.previousWord === ' ' && this.state.word !== '') {
            // space was edited to create a new word
            // TODO replace with sending new word to server
            this.props.parent.addNewWordAfter(this.props.identifier, {
                word: this.state.word,
                id: 'ins' + parseInt(Math.random() * 65536)
            });
            // contents of new word land in object over there, clear this one again
            this._updateWord(' ');
        } else {
            let split_word = this.state.word.split(' ');
            if (split_word.length > 1) {
                //this.splitIsHappening = true;
                this._updateWord(split_word[0]);
                // TODO replace with sending word split to server
                this.props.parent.addNewWordAfter(this.props.identifier,
                    {word: split_word[1], id: 'spl' + parseInt(Math.random() * 65536)});
            } else {
                // TODO send changed word to server
            }
        }
        this.setState((state) => {
            return {previousWord: this.state.word};
        });
        this.props.parent.unselectWord(this.props.identifier);
    }

    render() {
        let wordClass = 'word';
        if (this.state.previousWord === ' ') {
            wordClass += ' word_space'
        }
        if (this.state.active) {
            wordClass += ' word_active';
        }
        return (
            <span className={wordClass}>{this.editableElement}</span>
        );
    }
}

class WordList extends React.Component {
    wordList = [];

    constructor(props) {
        super(props);

        this.state = {
            wordRefs: {},
            wordComponents: {},
            wordIdentifiers: [],
            wordList: [],
            selectedIdentifier: undefined,
            selectedIndex: undefined
        };
    }

    componentDidMount() {

        let startIdentifier = 'start';
        let startComponent = <Word ref={(ref) => this._addRefToState(ref, startIdentifier)} word={' '}
                                   key={startIdentifier}
                                   identifier={startIdentifier} active={false} parent={this}/>;

        this.setState({
            wordList: [{word: ' ', id: 'start'}],
            wordComponents: {start: startComponent},
            wordIdentifiers: [startIdentifier]
        });


        let previous_identifier = 'start';
        for (let word of this.props.wordList) {
            this.addNewWordAfter(previous_identifier, word);
            previous_identifier = word.id;
        }
    }

    _identifierIndex(identifier) {
        return this.state.wordIdentifiers.indexOf(identifier);
    }

    static _getSpaceId(identifier) {
        return 'after ' + identifier;
    }

    addNewWordAfter(after_identifier, word) {
        if (after_identifier !== 'start' && !after_identifier.startsWith('after ')) {
            after_identifier = 'after ' + after_identifier;
        }

        this.setState((state) => {
            let update_words = state.wordList.slice();
            let update_identifiers = state.wordIdentifiers.slice();
            let update_components = Object.assign({}, state.wordComponents);

            let new_position = state.wordIdentifiers.indexOf(after_identifier) + 1;

            update_words.splice(new_position, 0, word);
            update_identifiers.splice(new_position, 0, word.id);
            update_components[word.id] = <Word ref={(ref) => this._addRefToState(ref, word.id)}
                                               word={word.word} key={word.id} identifier={word.id}
                                               active={false} parent={this}/>;

            const space_id = WordList._getSpaceId(word.id);
            let space_position = new_position + 1;
            update_words.splice(space_position, 0, {word: ' ', id: space_id});
            update_identifiers.splice(space_position, 0, space_id);
            update_components[space_id] = <Word
                ref={(ref) => this._addRefToState(ref, space_id)}
                word={' '} key={space_id} identifier={space_id}
                active={false} parent={this}/>;

            console.log(update_words);

            return {
                wordList: update_words,
                wordComponents: update_components,
                wordIdentifiers: update_identifiers
            };
        });

    }

    _addRefToState(ref, identifier) {
        this.setState((state) => {
            let update_refs = Object.assign({}, state.wordRefs);
            update_refs[identifier] = ref;
            return {
                wordRefs: update_refs
            };
        })
    }

    deleteWord(identifier) {
        this.unselectWord(identifier);

        let index_to_remove = this._identifierIndex(identifier);
        this.setState((state) => {
            let update_identifiers = state.wordIdentifiers.slice();
            let update_refs = Object.assign({}, state.wordRefs);
            let update_components = Object.assign({}, state.wordComponents);
            let update_words = state.wordList.slice();
            update_identifiers.splice(index_to_remove, 2);
            delete update_components[identifier];
            delete update_components[WordList._getSpaceId(identifier)];
            delete update_refs[identifier];
            delete update_refs[WordList._getSpaceId(identifier)];
            update_words.splice(index_to_remove, 2);
            return {
                wordIdentifiers: update_identifiers,
                wordRefs: update_refs,
                wordComponents: update_components,
                wordList: update_words
            };
        });
    }

    onWordSelected(identifier) {
        if (identifier === this.state.selectedIdentifier) {
            return;
        }
        if (this.state.selectedIdentifier !== undefined) {
            this.state.wordRefs[this.state.selectedIdentifier].setState({active: false});
        }
        this.setState({
            selectedIdentifier: identifier,
            selectedIndex: this._identifierIndex(identifier)
        }, () => {
            if (this.state.selectedIdentifier !== undefined) {
                this.state.wordRefs[this.state.selectedIdentifier].setState({active: true});
            }
        });
    }

    unselectWord(identifier) {
        this.state.wordRefs[identifier].setState({active: false});
        if (identifier === this.state.selectedIdentifier) {
            this.setState({
                selectedIdentifier: undefined,
                selectedIndex: undefined
            });
        }
    }

    selectNext() {
        if (this.state.selectedIndex < this.state.wordIdentifiers.length - 1) {
            this.onWordSelected(this.state.wordIdentifiers[this.state.selectedIndex + 1]);
        }
    }

    render() {
        let components_to_render = this.state.wordIdentifiers.map((id) => this.state.wordComponents[id]);
        return (
            <div>{components_to_render}</div>
        );
    }
}

class App extends Component {


    render() {
        return (
            <section>
                <h1>Let's write a poem!</h1>
                <WordList wordList={poem}/>
            </section>
        );
    }
}

export default App;
