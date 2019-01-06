import React, {Component} from 'react';
import './App.css';
import ContentEditable from "react-sane-contenteditable";

let poem = [
    'Lorem',
    'Ipsum',
    'dolor',
    'sit',
    'amet'
];

class Word extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            word: props.word,
            index: props.index,
            active: false,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        this.editableElement =
            <ContentEditable
                tagName="span"
                content={this.state.word}
                editable={true}
                multiLine={false}
                onClick={this.handleClick}
                onChange={this.handleChange}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
            />
    }

    setActive(active) {
        this.setState(state => ({
            active: active
        }));
    }

    handleClick() {
        this.props.parent.onWordSelected(this.state.index);
    }

    handleChange(event, value) {
        if (value !== this.state.word) {
            console.log(value);
            this.setState({
                word: value
            });
        }
    }

    handleFocus() {
        setTimeout(
            () => document.execCommand('selectAll', false, null),
            150
        );
    }

    handleBlur(event, value) {
        this.props.parent.onWordSelected(undefined);
    }

    render() {
        let wordClass = "word";
        if (this.state.active) {
            wordClass += " word_active";
        }
        return (
            <span className={wordClass}>{this.editableElement}</span>
        );
    }
}

class WordList extends React.Component {
    wordList = [];
    wordRefs = [];
    selectedIndex;

    constructor(props) {
        super(props);
        this.wordList = [];
        for (let index in props.wordList) {
            this.wordList.push(<Word ref={(ref) => this.wordRefs.push(ref)} word={props.wordList[index]} key={index}
                                     index={index} parent={this}/>);
        }

        this.state = {
            words: this.wordList
        };
    }

    onWordSelected(index) {
        if (this.selectedIndex !== undefined) {
            this.wordRefs[this.selectedIndex].setActive(false);
        }
        this.selectedIndex = index;
        if (this.selectedIndex !== undefined) {
            this.wordRefs[this.selectedIndex].setActive(true);
        }
    }

    render() {
        return (
            <div>{this.wordList}</div>
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
