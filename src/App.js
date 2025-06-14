import React from 'react';
import './App.css';
import Game from './components/Game';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>漢字収集ゲーム</h1>
        <p>「一」から「十」までの漢字を順番に集めよう！</p>
      </header>
      <main>
        <Game />
      </main>
      <footer>
        <p>Created with React - GitHub Pages Demo</p>
      </footer>
    </div>
  );
}

export default App;
