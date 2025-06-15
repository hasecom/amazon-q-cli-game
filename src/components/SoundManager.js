import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

// サウンドマネージャーコンポーネント
const SoundManager = () => {
  // Howlオブジェクトの参照
  const soundsRef = useRef({
    bgm: null,
    hitEnemy: null,
    getKanji: null
  });
  
  // 初期化済みフラグ
  const initializedRef = useRef(false);

  useEffect(() => {
    // 重複初期化を防止
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // サウンドの初期化関数
    const initSounds = () => {
      // AudioContextのロック解除を試みる
      Howler.autoUnlock = true;
      
      // より小さいサイズのファイルを使用
      // BGM（バックグラウンドミュージック）の設定
      soundsRef.current.bgm = new Howl({
        src: ['/sounds/bgm_small.mp3'],
        loop: true,
        volume: 0.3,
        html5: true, // ストリーミングに適したモード
        format: ['mp3'],
        onloaderror: (id, err) => console.error('BGM読み込みエラー:', err)
      });
      
      // 敵に当たる音の設定
      soundsRef.current.hitEnemy = new Howl({
        src: ['/sounds/hit_enemy_small.mp3'],
        volume: 0.5,
        format: ['mp3'],
        onloaderror: (id, err) => console.error('敵衝突音読み込みエラー:', err)
      });
      
      // 漢字獲得音（チャリン）の設定
      soundsRef.current.getKanji = new Howl({
        src: ['/sounds/get_kanji_small.mp3'],
        volume: 0.5,
        format: ['mp3'],
        onloaderror: (id, err) => console.error('漢字獲得音読み込みエラー:', err)
      });
    };

    // ユーザーインタラクション後に音声を初期化
    const handleUserInteraction = () => {
      // 初期化済みの場合は何もしない
      if (soundsRef.current.bgm) return;
      
      // サウンドを初期化
      initSounds();
      
      // BGMを再生（少し遅延させる）
      setTimeout(() => {
        try {
          if (soundsRef.current.bgm) {
            soundsRef.current.bgm.play();
          }
        } catch (e) {
          console.error('BGM再生エラー:', e);
        }
      }, 1000);
      
      // イベントリスナーを削除
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // ユーザーインタラクションを待つ
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    // カスタムイベントリスナーを設定
    const handleHitEnemy = () => {
      try {
        if (soundsRef.current.hitEnemy) {
          soundsRef.current.hitEnemy.play();
        }
      } catch (e) {
        console.error('敵衝突音再生エラー:', e);
      }
    };

    const handleGetKanji = () => {
      try {
        if (soundsRef.current.getKanji) {
          soundsRef.current.getKanji.play();
        }
      } catch (e) {
        console.error('漢字獲得音再生エラー:', e);
      }
    };

    // カスタムイベントリスナーを登録
    window.addEventListener('hit-enemy', handleHitEnemy);
    window.addEventListener('get-kanji', handleGetKanji);

    // クリーンアップ関数
    return () => {
      // 現在のサウンドオブジェクトを変数に保存
      const sounds = { ...soundsRef.current };
      
      // BGMを停止
      if (sounds.bgm) {
        try {
          sounds.bgm.stop();
          sounds.bgm.unload();
        } catch (e) {
          console.error('BGMクリーンアップエラー:', e);
        }
      }
      
      // 他のサウンドをアンロード
      if (sounds.hitEnemy) {
        try {
          sounds.hitEnemy.unload();
        } catch (e) {
          console.error('敵衝突音クリーンアップエラー:', e);
        }
      }
      
      if (sounds.getKanji) {
        try {
          sounds.getKanji.unload();
        } catch (e) {
          console.error('漢字獲得音クリーンアップエラー:', e);
        }
      }

      // イベントリスナーを削除
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('hit-enemy', handleHitEnemy);
      window.removeEventListener('get-kanji', handleGetKanji);
    };
  }, []);

  // このコンポーネントは何も表示しない
  return null;
};

// サウンド再生用のヘルパー関数
export const playSound = {
  hitEnemy: () => {
    try {
      window.dispatchEvent(new Event('hit-enemy'));
    } catch (e) {
      console.error('敵衝突音イベント発火エラー:', e);
    }
  },
  getKanji: () => {
    try {
      window.dispatchEvent(new Event('get-kanji'));
    } catch (e) {
      console.error('漢字獲得音イベント発火エラー:', e);
    }
  }
};

export default SoundManager;
