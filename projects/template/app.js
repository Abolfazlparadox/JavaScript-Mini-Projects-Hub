/**
 * Mini Project Template | Logic Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  const demoBtn = document.getElementById('demoBtn');
  const demoOutput = document.getElementById('demoOutput');

  let clickCount = 0;

  demoBtn.addEventListener('click', () => {
    clickCount++;
    demoOutput.textContent = `Button clicked ${clickCount} time${clickCount === 1 ? '' : 's'}!`;
  });
});
