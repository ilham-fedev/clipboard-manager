// DOM Elements
const searchInput = document.getElementById('search-input');
const historyList = document.getElementById('history-list');
const historyContainer = document.getElementById('history-container');
const emptyState = document.getElementById('empty-state');

// State
let clipboardHistory = [];
let filteredHistory = [];
let selectedIndex = 0;
let settings = { deleteKey: 'Backspace' };

// Initialize
async function init() {
  // Load history and settings
  clipboardHistory = await window.clipboardAPI.getHistory();
  settings = await window.clipboardAPI.getSettings();

  // Listen for updates from main process
  window.clipboardAPI.onUpdateHistory((history) => {
    clipboardHistory = history;
    filterAndRender();
  });

  window.clipboardAPI.onUpdateSettings((newSettings) => {
    settings = newSettings;
  });

  filterAndRender();
  searchInput.focus();
}

// Filter history based on search query
function filterAndRender() {
  const query = searchInput.value.toLowerCase().trim();

  if (query) {
    filteredHistory = clipboardHistory.filter(item =>
      item.content.toLowerCase().includes(query)
    );
  } else {
    filteredHistory = [...clipboardHistory];
  }

  // Reset selection to first item
  selectedIndex = 0;

  render();
}

// Render the history list
function render() {
  // Show/hide empty state
  if (filteredHistory.length === 0) {
    emptyState.style.display = 'flex';
    historyList.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  historyList.style.display = 'block';

  // Clear list
  historyList.innerHTML = '';

  // Render items
  filteredHistory.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `history-item ${index === selectedIndex ? 'selected' : ''}`;
    li.dataset.index = index;
    li.dataset.id = item.id;

    // Content preview (truncated)
    const content = document.createElement('div');
    content.className = 'item-content';
    content.textContent = truncateText(item.content, 100);

    // Timestamp
    const time = document.createElement('div');
    time.className = 'item-time';
    time.textContent = formatTime(item.timestamp);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&#128465;'; // Trash icon
    deleteBtn.title = 'Delete item';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteItem(item.id);
    };

    // Info container
    const info = document.createElement('div');
    info.className = 'item-info';
    info.appendChild(time);
    info.appendChild(deleteBtn);

    li.appendChild(content);
    li.appendChild(info);

    // Click to paste
    li.onclick = () => pasteItem(index);

    historyList.appendChild(li);
  });

  // Scroll selected item into view
  scrollToSelected();
}

// Truncate text for display
function truncateText(text, maxLength) {
  // Replace newlines with spaces for preview
  const singleLine = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.substring(0, maxLength) + '...';
}

// Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Navigate selection
function navigateSelection(direction) {
  if (filteredHistory.length === 0) return;

  if (direction === 'up') {
    selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredHistory.length - 1;
  } else {
    selectedIndex = selectedIndex < filteredHistory.length - 1 ? selectedIndex + 1 : 0;
  }

  render();
}

// Scroll selected item into view
function scrollToSelected() {
  const selectedItem = historyList.querySelector('.selected');
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// Paste selected item
async function pasteItem(index = selectedIndex) {
  if (filteredHistory.length === 0) return;

  const item = filteredHistory[index];
  if (item) {
    await window.clipboardAPI.pasteItem(item.content);
  }
}

// Delete item
async function deleteItem(id) {
  const newHistory = await window.clipboardAPI.deleteItem(id);
  clipboardHistory = newHistory;
  filterAndRender();
}

// Keyboard event handler
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      navigateSelection('up');
      break;

    case 'ArrowDown':
      e.preventDefault();
      navigateSelection('down');
      break;

    case 'Enter':
      e.preventDefault();
      pasteItem();
      break;

    case 'Escape':
      e.preventDefault();
      window.clipboardAPI.closeWindow();
      break;

    case 'Delete':
    case 'Backspace':
      // Only delete if the configured key matches and search is empty
      if (e.key === settings.deleteKey && searchInput.value === '' && filteredHistory.length > 0) {
        e.preventDefault();
        const item = filteredHistory[selectedIndex];
        if (item) {
          deleteItem(item.id);
        }
      }
      break;
  }
});

// Search input handler
searchInput.addEventListener('input', () => {
  filterAndRender();
});

// Prevent losing focus from search when clicking items
historyList.addEventListener('mousedown', (e) => {
  if (e.target.closest('.history-item') && !e.target.closest('.delete-btn')) {
    e.preventDefault();
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
