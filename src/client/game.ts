import { Boot } from './scenes/Boot';
import { MainMenu } from './scenes/MainMenu';
import { AssetValidation } from './scenes/AssetValidation';
import { PlayerTestScene } from './scenes/PlayerTestScene';
import { PushTestScene } from './scenes/PushTestScene';
import { Preloader } from './scenes/Preloader';
import { LevelSelect } from './scenes/LevelSelect';
import { VictoryScreen } from './scenes/VictoryScreen';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#140e0c',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    Boot,
    Preloader,
    AssetValidation,
    MainMenu,
    LevelSelect,
    PushTestScene,
    VictoryScreen,
    PlayerTestScene,
  ],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
