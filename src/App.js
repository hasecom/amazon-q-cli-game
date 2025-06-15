import React from 'react';
import './App.css';
import Game from './components/Game';
import SoundManager from './components/SoundManager';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>漢字収集ゲーム</h1>
        <p>画数の少ない漢字から順番に集めよう！</p>
      </header>
      <main>
        <Game />
        <SoundManager />
      </main>
      <footer>
        <p>Created by hasecom using Amazon Q CLI</p>
      </footer>
    </div>
  );
}

export default App;
