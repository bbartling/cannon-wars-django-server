/*
 * Mario Maker Level Editor (JavaScript)
 *
 * This script provides a simple drag-and-drop editor for building
 * platformer levels in the browser.
 */
console.log('🛠️ Mario Maker Editor JS loaded');

const editor = {
  rows: 30,
  cols: 100,
  cellSize: 20,
  grid: [],
  selected: 1,
  palette: [
    { id: 0, color: '#f5f5f5', label: 'Empty' },
    { id: 1, color: '#3b5998', label: 'Blue Block' },
    { id: 2, color: '#d9534f', label: 'Red Block' },
    { id: 3, color: '#964B00', label: 'Gumba Spawn', imageSrc: '/static/Gumba.png' }
  ]
};

// --- THIS FUNCTION WAS MISSING ---
// It sets up the entire editor when the page is ready.
function initEditor() {
  // 1. Initialise grid with zeros
  editor.grid = Array(editor.rows).fill(0).map(() => Array(editor.cols).fill(0));
  
  // 2. Setup palette UI
  const paletteDiv = document.getElementById('palette');
  paletteDiv.innerHTML = '';
  editor.palette.forEach(tile => {
    const btn = document.createElement('div');
    btn.className = 'palette-tile';
    btn.dataset.tileId = tile.id;
    btn.title = tile.label;
    if (tile.imageSrc) {
        btn.style.backgroundImage = `url(${tile.imageSrc})`;
        btn.style.backgroundSize = 'contain';
    } else {
        btn.style.backgroundColor = tile.color;
    }
    btn.addEventListener('click', () => {
      editor.selected = tile.id;
      updatePaletteSelection();
    });
    paletteDiv.appendChild(btn);
  });

  updatePaletteSelection();
  
  // 3. Do the first draw of the blank grid
  drawEditor();
  
  // 4. Attach all the necessary event listeners
  const canvas = document.getElementById('editorCanvas');
  canvas.addEventListener('mousedown', handleEditorClick);
  canvas.addEventListener('mousemove', handleEditorDrag);
  document.getElementById('playButton').addEventListener('click', playLevel);
}


function updatePaletteSelection() {
  document.querySelectorAll('.palette-tile').forEach(pt => {
    pt.classList.toggle('selected', parseInt(pt.dataset.tileId) === editor.selected);
  });
}

function drawEditor() {
  const canvas = document.getElementById('editorCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = editor.cols * editor.cellSize;
  canvas.height = editor.rows * editor.cellSize;
  
  for (let r = 0; r < editor.rows; r++) {
    for (let c = 0; c < editor.cols; c++) {
      const tileId = editor.grid[r][c];
      const paletteEntry = editor.palette.find(p => p.id === tileId);
      if (paletteEntry) {
          ctx.fillStyle = paletteEntry.color;
          ctx.fillRect(c * editor.cellSize, r * editor.cellSize, editor.cellSize, editor.cellSize);
      }
      ctx.strokeStyle = '#cccccc';
      ctx.strokeRect(c * editor.cellSize, r * editor.cellSize, editor.cellSize, editor.cellSize);
    }
  }
}

function canvasToGridCoords(clientX, clientY) {
  const canvas = document.getElementById('editorCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  const col = Math.floor(canvasX / editor.cellSize);
  const row = Math.floor(canvasY / editor.cellSize);
  return { row, col };
}

function handleEditorClick(e) {
  const { row, col } = canvasToGridCoords(e.clientX, e.clientY);
  if (row < 0 || col < 0 || row >= editor.rows || col >= editor.cols) return;
  editor.grid[row][col] = editor.selected;
  drawEditor();
}

function handleEditorDrag(e) {
  if (e.buttons !== 1) return;
  const { row, col } = canvasToGridCoords(e.clientX, e.clientY);
  if (row < 0 || col < 0 || row >= editor.rows || col >= editor.cols) return;
  editor.grid[row][col] = editor.selected;
  drawEditor();
}

function playLevel() {
  document.getElementById('editorContainer').style.display = 'none';
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'block';
  
  if (typeof window.startMarioGame === 'function') {
    window.startMarioGame(editor.grid);
  } else {
    console.error('This should not happen. Check script load order in mario_editor.html.');
  }
}

// REMOVED the incorrect Document.addEventListener here.
// initEditor() is now correctly called from the mario_editor.html file.