import { requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button') as HTMLButtonElement;

startButton.addEventListener('click', (e) => {
  console.log('[Splash] Requesting expanded mode: game');
  requestExpandedMode(e, 'game');
});
