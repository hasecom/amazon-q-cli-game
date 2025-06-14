import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/Game.css';

const Game = () => {
  // 画数ごとの漢字の配列（1画から10画まで）
  const kanjiByStrokeCount = [
    ["一"], // 1画
    ["二", "十"], // 2画
    ["三", "土", "川", "山"], // 3画
    ["四", "火", "水", "天", "月"], // 4画
    ["五", "木", "王", "右", "左", "中"], // 5画
    ["六", "石", "竹", "糸", "耳"], // 6画
    ["七", "足", "見", "貝", "車"], // 7画
    ["八", "金", "雨", "青", "草"], // 8画
    ["九", "音", "風", "食", "飛"], // 9画
    ["十", "馬", "魚", "鳥", "高"] // 10画
  ];
  
  // ゲームの状態
  const [currentStrokeCount, setCurrentStrokeCount] = useState(1); // 現在の画数
  const [currentKanji, setCurrentKanji] = useState(""); // 現在取るべき漢字
  const [playerPosition, setPlayerPosition] = useState({ x: 1, y: 1 });
  const [gameBoard, setGameBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [remainingKanji, setRemainingKanji] = useState(0);
  const [highlightCells, setHighlightCells] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [enemies, setEnemies] = useState([]);
  const [nextKanjiTimer, setNextKanjiTimer] = useState(null);
  const [kanjiActive, setKanjiActive] = useState(true); // 漢字が取得可能かどうか
  
  // ゲームボードのref
  const gameBoardRef = useRef(null);
  const gameContainerRef = useRef(null);
  
  // ゲームループのタイマー
  const gameLoopRef = useRef(null);
  const kanjiTimerRef = useRef(null);
  
  // ボードのサイズ
  const boardSize = 15;
  const cellSize = 50; // CSSのセルサイズと一致させる
  const kanjiActivationDelay = 30000; // 漢字が次に取得可能になるまでの時間（30秒）
  
  // モバイルデバイスの検出
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // 対称的な迷路を生成する関数（アクセス可能なマップを保証）
  const generateSymmetricalMaze = (size) => {
    let maze;
    let isAccessible;
    
    // アクセス可能なマップが生成されるまで繰り返す
    do {
      maze = Array(size).fill().map(() => Array(size).fill(null));
      
      // 外周を壁にする
      for (let i = 0; i < size; i++) {
        maze[0][i] = { type: 'wall' };
        maze[size - 1][i] = { type: 'wall' };
        maze[i][0] = { type: 'wall' };
        maze[i][size - 1] = { type: 'wall' };
      }
      
      // 中央に対称的な壁を配置（より多くの壁を配置）
      const halfSize = Math.floor(size / 2);
      
      // 対称的なパターンを生成（四分の一のみ生成して残りは対称にコピー）
      for (let y = 1; y < halfSize; y++) {
        for (let x = 1; x < halfSize; x++) {
          // ランダムに壁を配置（確率は調整可能、少し高めに）
          if (Math.random() < 0.25 && !(x <= 2 && y <= 2)) {
            // 四方向に対称的に壁を配置
            maze[y][x] = { type: 'wall' };
            maze[y][size - 1 - x] = { type: 'wall' };
            maze[size - 1 - y][x] = { type: 'wall' };
            maze[size - 1 - y][size - 1 - x] = { type: 'wall' };
          }
        }
      }
      
      // マップ全体にアクセス可能かチェック
      isAccessible = checkMapAccessibility(maze, size);
      
    } while (!isAccessible);
    
    return maze;
  };
  
  // マップ全体にアクセス可能かチェックする関数（幅優先探索）
  const checkMapAccessibility = (maze, size) => {
    // 訪問済みのセルを記録する配列
    const visited = Array(size).fill().map(() => Array(size).fill(false));
    
    // 開始位置（プレイヤーの初期位置）
    const startX = 1;
    const startY = 1;
    visited[startY][startX] = true;
    
    // 探索キュー
    const queue = [{ x: startX, y: startY }];
    
    // 移動方向
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }, // 左
      { x: 1, y: 0 }   // 右
    ];
    
    // 空きセルの数をカウント
    let emptyCells = 0;
    let accessibleCells = 0;
    
    // 空きセルの数を数える
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!maze[y][x] || maze[y][x].type !== 'wall') {
          emptyCells++;
        }
      }
    }
    
    // 幅優先探索
    while (queue.length > 0) {
      const current = queue.shift();
      accessibleCells++;
      
      // 4方向を探索
      for (const dir of directions) {
        const newX = current.x + dir.x;
        const newY = current.y + dir.y;
        
        // 範囲内かつ未訪問かつ壁でない場合
        if (
          newX >= 0 && newX < size && 
          newY >= 0 && newY < size && 
          !visited[newY][newX] && 
          (!maze[newY][newX] || maze[newY][newX].type !== 'wall')
        ) {
          visited[newY][newX] = true;
          queue.push({ x: newX, y: newY });
        }
      }
    }
    
    // アクセス可能なセルの割合が90%以上であればOK
    return accessibleCells / emptyCells >= 0.9;
  };
  
  // 敵を配置する関数
  const placeEnemies = useCallback((board, playerPos, level) => {
    const newEnemies = [];
    // レベルに応じて敵の数を調整（レベル1では2体）
    const enemyCount = level === 1 ? 2 : Math.min(level, 4);
    
    // 敵の初期位置（ボード内の特定の位置）
    const possiblePositions = [];
    
    // ボード内の空きマスを探す
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        // プレイヤーから離れた位置（距離が5以上）かつ壁でない場所
        const distanceToPlayer = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
        if (distanceToPlayer >= 5 && !board[y][x] && 
            x > 0 && x < boardSize - 1 && y > 0 && y < boardSize - 1) {
          possiblePositions.push({ x, y });
        }
      }
    }
    
    // 敵を配置
    for (let i = 0; i < enemyCount; i++) {
      if (possiblePositions.length > 0) {
        // ランダムな位置を選択
        const randomIndex = Math.floor(Math.random() * possiblePositions.length);
        const position = possiblePositions[randomIndex];
        
        // 選択した位置を配列から削除（同じ位置に複数の敵を置かないため）
        possiblePositions.splice(randomIndex, 1);
        
        // 敵をボードに配置
        board[position.y][position.x] = { 
          type: 'enemy',
          speed: Math.random() < 0.3 ? 2 : 1 // 30%の確率で速い敵
        };
        
        // 敵の情報を保存
        newEnemies.push({ 
          x: position.x, 
          y: position.y, 
          active: true,
          speed: Math.random() < 0.3 ? 2 : 1
        });
      }
    }
    
    return newEnemies;
  }, [boardSize]);
  
  // 移動可能なセルをハイライト
  const updateHighlightCells = useCallback((position) => {
    if (!gameBoard || gameBoard.length === 0) return;
    
    const cells = [];
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }, // 左
      { x: 1, y: 0 }   // 右
    ];
    
    directions.forEach(dir => {
      const newX = position.x + dir.x;
      const newY = position.y + dir.y;
      
      // ボード内かつ壁でない場合
      if (
        newX >= 0 && 
        newX < boardSize && 
        newY >= 0 && 
        newY < boardSize && 
        gameBoard[newY] && 
        (!gameBoard[newY][newX] || 
         (gameBoard[newY][newX].type !== 'wall' && gameBoard[newY][newX].type !== 'enemy'))
      ) {
        cells.push({ x: newX, y: newY });
      }
    });
    
    setHighlightCells(cells);
  }, [gameBoard, boardSize]);
  
  // 次の漢字をランダムに選択する関数
  const selectRandomKanji = useCallback((strokeCount) => {
    if (strokeCount > kanjiByStrokeCount.length) {
      return null; // すべての画数の漢字を取得した場合
    }
    
    const availableKanji = kanjiByStrokeCount[strokeCount - 1];
    const randomIndex = Math.floor(Math.random() * availableKanji.length);
    return availableKanji[randomIndex];
  }, [kanjiByStrokeCount]);
  
  // 漢字の取得タイマーを設定する関数
  const startKanjiTimer = useCallback(() => {
    if (kanjiTimerRef.current) {
      clearTimeout(kanjiTimerRef.current);
    }
    
    setKanjiActive(false); // ヒントを非表示にする
    
    kanjiTimerRef.current = setTimeout(() => {
      setKanjiActive(true); // 30秒後にヒントを表示する
    }, kanjiActivationDelay);
    
    // タイマーの残り時間を表示するための状態を更新
    setNextKanjiTimer(Date.now() + kanjiActivationDelay);
  }, [kanjiActivationDelay]);
  
  // 新しいレベルの初期化
  const initializeLevel = useCallback(() => {
    // 対称的な迷路を生成
    const newBoard = generateSymmetricalMaze(boardSize);
    
    // 最初の画数を設定
    setCurrentStrokeCount(1);
    
    // 最初の漢字を選択
    const firstKanji = selectRandomKanji(1);
    setCurrentKanji(firstKanji);
    
    // 各画数の漢字を1つずつ配置
    const maxStrokeCount = Math.min(10, level + 4); // レベルに応じて最大画数を調整
    let placedKanji = 0;
    setRemainingKanji(maxStrokeCount);
    
    for (let strokeCount = 1; strokeCount <= maxStrokeCount; strokeCount++) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        attempts++;
        const x = Math.floor(Math.random() * (boardSize - 2)) + 1;
        const y = Math.floor(Math.random() * (boardSize - 2)) + 1;
        
        // プレイヤーの初期位置や壁には漢字を置かない
        if ((x !== 1 || y !== 1) && !newBoard[y][x]) {
          // その画数からランダムに漢字を選択
          const kanji = selectRandomKanji(strokeCount);
          newBoard[y][x] = { 
            type: 'kanji', 
            value: kanji, 
            strokeCount: strokeCount,
            active: strokeCount === 1 // 最初の漢字だけアクティブ
          };
          placed = true;
          placedKanji++;
        }
      }
    }
    
    // プレイヤーの配置
    newBoard[1][1] = { type: 'player' };
    const playerPos = { x: 1, y: 1 };
    setPlayerPosition(playerPos);
    
    // 敵の配置（ステージ外）
    const newEnemies = placeEnemies(newBoard, playerPos, level);
    setEnemies(newEnemies);
    
    setGameBoard(newBoard);
    setGameOver(false);
    setGameWon(false);
    setKanjiActive(true); // 最初の漢字はアクティブ
    
    // ビューポートオフセットをリセット
    setViewportOffset({ x: 0, y: 0 });
    
    // タイマーをクリア
    if (kanjiTimerRef.current) {
      clearTimeout(kanjiTimerRef.current);
      kanjiTimerRef.current = null;
    }
    setNextKanjiTimer(null);
  }, [level, boardSize, placeEnemies, selectRandomKanji]);
  
  // ゲーム開始時に初期化
  useEffect(() => {
    initializeLevel();
    
    // ゲームループのクリーンアップ
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (kanjiTimerRef.current) {
        clearTimeout(kanjiTimerRef.current);
      }
    };
  }, []);
  
  // タイマーの残り時間を更新する
  useEffect(() => {
    if (!nextKanjiTimer || gameOver || gameWon) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= nextKanjiTimer) {
        setNextKanjiTimer(null);
        clearInterval(interval);
      } else {
        // 強制的に再レンダリングさせるために空の更新を行う
        setNextKanjiTimer(nextKanjiTimer);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [nextKanjiTimer, gameOver, gameWon]);
  
  // ゲームボードが更新されたら移動可能なセルを更新
  useEffect(() => {
    if (gameBoard && gameBoard.length > 0 && playerPosition) {
      updateHighlightCells(playerPosition);
    }
  }, [gameBoard, playerPosition, updateHighlightCells]);
  
  // プレイヤーの位置が変わったらビューポートを更新（モバイル用）
  useEffect(() => {
    if (isMobile && gameBoard && gameBoard.length > 0) {
      // ビューポートの中心にプレイヤーを配置
      const viewportWidth = Math.min(7, boardSize); // 表示する幅（セル数）
      const viewportHeight = Math.min(7, boardSize); // 表示する高さ（セル数）
      
      // プレイヤーを中心にするためのオフセットを計算
      let offsetX = playerPosition.x - Math.floor(viewportWidth / 2);
      let offsetY = playerPosition.y - Math.floor(viewportHeight / 2);
      
      // オフセットが範囲外にならないように調整
      offsetX = Math.max(0, Math.min(offsetX, boardSize - viewportWidth));
      offsetY = Math.max(0, Math.min(offsetY, boardSize - viewportHeight));
      
      setViewportOffset({ x: offsetX, y: offsetY });
      
      // 移動可能なセルを更新
      updateHighlightCells(playerPosition);
    }
  }, [playerPosition, isMobile, gameBoard, boardSize, updateHighlightCells]);
  
  // 敵の移動ロジック
  const moveEnemies = useCallback(() => {
    if (gameOver || gameWon || !gameBoard || gameBoard.length === 0) return;
    
    // 現在のゲームボードの状態をコピー
    const newBoard = [...gameBoard];
    const newEnemies = [...enemies];
    
    for (let i = 0; i < newEnemies.length; i++) {
      const enemy = newEnemies[i];
      
      // 現在の敵の位置をボードから削除
      if (
        enemy.x >= 0 && 
        enemy.x < boardSize && 
        enemy.y >= 0 && 
        enemy.y < boardSize &&
        newBoard[enemy.y][enemy.x] && 
        newBoard[enemy.y][enemy.x].type === 'enemy'
      ) {
        // 敵が漢字の上にいた場合、漢字を復元
        if (newBoard[enemy.y][enemy.x].onKanji) {
          newBoard[enemy.y][enemy.x] = newBoard[enemy.y][enemy.x].onKanji;
        } else {
          newBoard[enemy.y][enemy.x] = null;
        }
      }
      
      // 移動方向の候補
      const directions = [
        { x: 0, y: -1, weight: 1 }, // 上
        { x: 0, y: 1, weight: 1 },  // 下
        { x: -1, y: 0, weight: 1 }, // 左
        { x: 1, y: 0, weight: 1 }   // 右
      ];
      
      // プレイヤーに近づく方向の重みを増やす
      directions.forEach(dir => {
        const newX = enemy.x + dir.x;
        const newY = enemy.y + dir.y;
        
        // プレイヤーに近づく方向なら重みを増やす
        if (
          Math.abs(newX - playerPosition.x) < Math.abs(enemy.x - playerPosition.x) ||
          Math.abs(newY - playerPosition.y) < Math.abs(enemy.y - playerPosition.y)
        ) {
          dir.weight = 5; // プレイヤーに近づく方向の重みを増加
        }
      });
      
      // 有効な移動先をフィルタリング
      const validDirections = directions.filter(dir => {
        const newX = enemy.x + dir.x;
        const newY = enemy.y + dir.y;
        
        // ボード内かつ壁でなく、他の敵もいない場所
        if (
          newX >= 0 && 
          newX < boardSize && 
          newY >= 0 && 
          newY < boardSize
        ) {
          const cell = newBoard[newY][newX];
          return (
            !cell || 
            (cell.type !== 'wall' && cell.type !== 'enemy') ||
            (cell.type === 'player') // プレイヤーのいる場所には移動可能
          );
        }
        
        return false;
      });
      
      // 移動先がある場合
      if (validDirections.length > 0) {
        // 重み付き確率で方向を選択
        const totalWeight = validDirections.reduce((sum, dir) => sum + dir.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedDir = validDirections[0];
        
        for (const dir of validDirections) {
          random -= dir.weight;
          if (random <= 0) {
            selectedDir = dir;
            break;
          }
        }
        
        const newX = enemy.x + selectedDir.x;
        const newY = enemy.y + selectedDir.y;
        
        // プレイヤーに当たった場合
        if (newX === playerPosition.x && newY === playerPosition.y) {
          setGameOver(true);
          return;
        }
        
        // 移動先のセルを保存
        const targetCell = newBoard[newY][newX];
        
        // 敵を新しい位置に移動
        newEnemies[i] = { ...enemy, x: newX, y: newY };
        
        // 移動先に漢字がある場合は、敵が漢字の上に乗る（漢字は消さない）
        if (targetCell && targetCell.type === 'kanji') {
          newBoard[newY][newX] = { 
            type: 'enemy',
            speed: enemy.speed,
            onKanji: targetCell // 漢字の情報を保持
          };
        } else {
          newBoard[newY][newX] = { 
            type: 'enemy',
            speed: enemy.speed
          };
        }
      } else {
        // 移動できない場合は元の位置に戻す
        newBoard[enemy.y][enemy.x] = { 
          type: 'enemy',
          speed: enemy.speed
        };
      }
    }
    
    setEnemies(newEnemies);
    setGameBoard(newBoard);
  }, [gameBoard, playerPosition, boardSize, enemies, gameOver, gameWon]);
  
  // ゲームループの設定
  useEffect(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    if (!gameOver && !gameWon) {
      // 敵の移動を独立したタイマーで実行
      gameLoopRef.current = setInterval(() => {
        moveEnemies();
      }, 500); // 0.5秒ごとに敵が移動
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameOver, gameWon, moveEnemies]); // isPlayerMovingとmoveEnemiesを依存配列から削除
  
  // プレイヤーの移動処理
  const movePlayer = useCallback((newX, newY) => {
    // 移動先が有効かチェック
    if (
      newX >= 0 && 
      newX < boardSize && 
      newY >= 0 && 
      newY < boardSize && 
      gameBoard && 
      gameBoard[newY]
    ) {
      const targetCell = gameBoard[newY][newX];
      
      // 壁には移動できない
      if (targetCell && targetCell.type === 'wall') {
        return;
      }
      
      // 敵のセルの場合
      if (targetCell && targetCell.type === 'enemy') {
        setGameOver(true);
        return;
      }
      
      // 漢字のセルの場合
      if (targetCell && targetCell.type === 'kanji') {
        // 現在の画数の漢字の場合のみ取得可能
        if (targetCell.strokeCount === currentStrokeCount) {
          // 正しい画数の漢字を取得
          setScore(score + currentStrokeCount * 100); // 画数に応じたスコア
          setRemainingKanji(remainingKanji - 1);
          setCurrentStrokeCount(currentStrokeCount + 1);
          
          // 次の漢字を選択
          const nextKanji = selectRandomKanji(currentStrokeCount + 1);
          setCurrentKanji(nextKanji);
          
          // 漢字ヒントタイマーを開始（最初の漢字以外）
          if (currentStrokeCount > 1 || remainingKanji > 1) {
            startKanjiTimer();
          }
          
          // すべての漢字を集めたらレベルクリア
          if (remainingKanji - 1 <= 0) {
            setGameWon(true);
            return;
          }
          
          // 漢字を取得したらそのセルは空になる（漢字を消す）
          const newBoard = [...gameBoard];
          newBoard[playerPosition.y][playerPosition.x] = null;
          newBoard[newY][newX] = { type: 'player' };
          
          setGameBoard(newBoard);
          setPlayerPosition({ x: newX, y: newY });
          
          // 移動可能なセルを更新
          updateHighlightCells({ x: newX, y: newY });
          
          return;
        } else {
          // 間違った画数の漢字を取ろうとした場合はゲームオーバー
          setGameOver(true);
          return;
        }
      }
      
      // プレイヤーの移動
      const newBoard = [...gameBoard];
      
      // 現在位置のプレイヤーを削除
      newBoard[playerPosition.y][playerPosition.x] = null;
      
      // 新しい位置にプレイヤーを配置
      newBoard[newY][newX] = { type: 'player' };
      
      setGameBoard(newBoard);
      setPlayerPosition({ x: newX, y: newY });
      
      // 移動可能なセルを更新
      updateHighlightCells({ x: newX, y: newY });
    }
  }, [boardSize, gameBoard, playerPosition, currentStrokeCount, remainingKanji, score, selectRandomKanji, startKanjiTimer, updateHighlightCells]);
  
  // キー入力の処理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver || gameWon) return;
      
      let newX = playerPosition.x;
      let newY = playerPosition.y;
      
      switch (e.key) {
        case 'ArrowUp':
          newY--;
          e.preventDefault();
          break;
        case 'ArrowDown':
          newY++;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          newX--;
          e.preventDefault();
          break;
        case 'ArrowRight':
          newX++;
          e.preventDefault();
          break;
        default:
          return;
      }
      
      movePlayer(newX, newY);
    };
    
    // グローバルなキーボードイベントを追加
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, gameWon, playerPosition, movePlayer]);
  
  // モバイル用の方向タップハンドラ
  const handleDirectionTap = useCallback((direction) => {
    if (gameOver || gameWon) return;
    
    let newX = playerPosition.x;
    let newY = playerPosition.y;
    
    switch (direction) {
      case 'up':
        newY--;
        break;
      case 'down':
        newY++;
        break;
      case 'left':
        newX--;
        break;
      case 'right':
        newX++;
        break;
      default:
        return;
    }
    
    movePlayer(newX, newY);
  }, [gameOver, gameWon, playerPosition, movePlayer]);
  
  // ゲームボードのクリックハンドラ
  const handleBoardClick = useCallback((e) => {
    // モバイルの場合は処理しない（方向タップを使用）
    if (isMobile) return;
    
    // ゲームボードの要素の位置を取得
    if (gameBoardRef.current && !gameOver && !gameWon) {
      const rect = gameBoardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // クリックされたセルの座標を計算
      const cellX = Math.floor(x / cellSize) + (isMobile ? viewportOffset.x : 0);
      const cellY = Math.floor(y / cellSize) + (isMobile ? viewportOffset.y : 0);
      
      // プレイヤーの現在位置との差を計算
      const dx = cellX - playerPosition.x;
      const dy = cellY - playerPosition.y;
      
      // 隣接するセルのみ移動可能
      if ((Math.abs(dx) === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1)) {
        movePlayer(cellX, cellY);
      }
    }
  }, [isMobile, gameOver, gameWon, playerPosition, viewportOffset, cellSize, movePlayer]);
  
  // 次のレベルへ
  const nextLevel = () => {
    setLevel(level + 1);
    initializeLevel();
  };
  
  // リスタート
  const restart = () => {
    setLevel(1);
    setScore(0);
    initializeLevel();
  };
  
  // セルのクラス名を決定する関数
  const getCellClassName = (cell, x, y) => {
    let className = `board-cell ${cell ? cell.type : 'empty'}`;
    
    // 移動可能なセルをハイライト
    if (!cell && highlightCells.some(pos => pos.x === x && pos.y === y)) {
      className += ' highlight';
    }
    
    // 次に取るべき漢字をハイライト（ヒントがアクティブな場合のみ）
    if (cell && cell.type === 'kanji' && cell.strokeCount === currentStrokeCount && kanjiActive) {
      className += ' next-kanji';
    }
    
    // 速い敵の場合はクラスを追加
    if (cell && cell.type === 'enemy' && cell.speed === 2) {
      className += ' fast';
    }
    
    return className;
  };
  
  // セルの内容を決定する関数
  const getCellContent = (cell) => {
    if (!cell) return '';
    
    switch (cell.type) {
      case 'player':
        return '私';
      case 'enemy':
        return '敵';
      case 'kanji':
        return cell.value;
      default:
        return '';
    }
  };
  
  // モバイル用のビューポート内のセルのみを表示
  const getVisibleBoard = () => {
    if (!isMobile || !gameBoard || gameBoard.length === 0) {
      return gameBoard;
    }
    
    const viewportWidth = Math.min(7, boardSize);
    const viewportHeight = Math.min(7, boardSize);
    
    // 配列の範囲外アクセスを防ぐ
    const startY = Math.min(viewportOffset.y, gameBoard.length - viewportHeight);
    const endY = Math.min(startY + viewportHeight, gameBoard.length);
    
    const visibleRows = gameBoard.slice(startY, endY);
    
    return visibleRows.map(row => {
      const startX = Math.min(viewportOffset.x, row.length - viewportWidth);
      const endX = Math.min(startX + viewportWidth, row.length);
      return row.slice(startX, endX);
    });
  };
  
  const visibleBoard = getVisibleBoard();
  
  // 次に取るべき漢字を表示
  const getNextKanjiText = () => {
    if (currentStrokeCount > 10) {
      return "すべて集めました！";
    }
    return `次の漢字: ${currentKanji}（${currentStrokeCount}画）`;
  };
  
  // 漢字が取得可能になるまでの残り時間を表示
  const getTimerText = () => {
    if (!nextKanjiTimer) return "";
    
    const remainingTime = Math.max(0, Math.ceil((nextKanjiTimer - Date.now()) / 1000));
    return `次の漢字のヒントまで: ${remainingTime}秒`;
  };
  
  // ゲームボードの初期化と自動フォーカス設定
  useEffect(() => {
    // ゲームボードにフォーカスを設定
    if (gameBoardRef.current) {
      gameBoardRef.current.focus();
    }
    
    // すべてのキーボードイベントでのスクロールを防止
    const preventScroll = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', preventScroll, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', preventScroll);
    };
  }, []);

  return (
    <div className="game-container" ref={gameContainerRef}>
      <div className="game-info">
        <div>レベル: {level}</div>
        <div>スコア: {score}</div>
        <div>{getNextKanjiText()}</div>
        <div>残り: {remainingKanji}</div>
        {nextKanjiTimer && <div className="timer">{getTimerText()}</div>}
      </div>
      
      <div 
        className={`game-board ${isMobile ? 'mobile-view' : ''}`}
        ref={gameBoardRef}
        onClick={handleBoardClick}
        tabIndex="0"
        style={{ gridTemplateRows: `repeat(${boardSize}, 40px)` }}
      >
        {visibleBoard && visibleBoard.length > 0 && visibleBoard.map((row, visibleY) => (
          <div key={visibleY + viewportOffset.y} className="board-row" style={{ display: 'contents' }}>
            {row.map((cell, visibleX) => (
              <div 
                key={`${visibleX + viewportOffset.x}-${visibleY + viewportOffset.y}`} 
                className={getCellClassName(
                  cell, 
                  visibleX + viewportOffset.x, 
                  visibleY + viewportOffset.y
                )}
              >
                {getCellContent(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* モバイル用の方向タップエリア */}
      {isMobile && (
        <div className="direction-controls">
          <div className="direction-row">
            <div className="direction-spacer"></div>
            <div 
              className="direction-button up" 
              onClick={() => handleDirectionTap('up')}
            >
              ↑
            </div>
            <div className="direction-spacer"></div>
          </div>
          <div className="direction-row">
            <div 
              className="direction-button left" 
              onClick={() => handleDirectionTap('left')}
            >
              ←
            </div>
            <div className="direction-center"></div>
            <div 
              className="direction-button right" 
              onClick={() => handleDirectionTap('right')}
            >
              →
            </div>
          </div>
          <div className="direction-row">
            <div className="direction-spacer"></div>
            <div 
              className="direction-button down" 
              onClick={() => handleDirectionTap('down')}
            >
              ↓
            </div>
            <div className="direction-spacer"></div>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="game-message">
          <h2>ゲームオーバー！</h2>
          <p>
            {currentStrokeCount > 1 
              ? `${currentStrokeCount - 1}画まで集めました。敵に捕まりました。` 
              : "敵に捕まりました。"}
          </p>
          <button onClick={restart}>もう一度プレイ</button>
        </div>
      )}
      
      {gameWon && (
        <div className="game-message">
          <h2>レベルクリア！</h2>
          <p>すべての漢字を集めました！</p>
          <button onClick={nextLevel}>次のレベルへ</button>
        </div>
      )}
      
      <div className="game-instructions">
        <h3>遊び方</h3>
        <p>矢印キーまたはクリックで「私」を操作します。</p>
        <p>スマホの場合は画面下部の方向ボタンをタップしてください。</p>
        <p>1画から順番に漢字を集めてください。</p>
        <p>次の画数の漢字だけを取ることができます。他の漢字を取るとゲームオーバーです。</p>
        <p>正しい漢字を取ると、その漢字は消えます。</p>
        <p>漢字を取ると、次の漢字のヒント（光る表示）は30秒後に表示されます。</p>
        <p>赤い「敵」キャラクターはプレイヤーを追いかけてきます。</p>
        <p>敵は0.5秒ごとに1マス移動し、漢字の上も通過できます（漢字は消えません）。</p>
        <p>敵に捕まるとゲームオーバーです。</p>
        <p>レベル1では敵は2体、レベルが上がるごとに敵の数が増えます（最大4体）。</p>
        <p>すべての漢字を集めるとレベルクリアです。</p>
      </div>
    </div>
  );
};

export default Game;
