import { requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button') as HTMLButtonElement;

startButton.addEventListener('click', (e) => {
  console.log('[Splash] Requesting expanded mode: game');
  
  // Add fade-out animation
  document.body.classList.add('fade-out');
  
  // Wait for fade-out to complete before requesting expanded mode
  setTimeout(() => {
    requestExpandedMode(e, 'game');
  }, 500);
});
