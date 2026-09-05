/**
 * SocialSphere Feed | Social Network Engine & Interactivity
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    attachedImage: null,
  };

  // --- DOM Elements ---
  const postInput = document.getElementById('postInput');
  const btnPublishPost = document.getElementById('btnPublishPost');
  const btnAttachPhoto = document.getElementById('btnAttachPhoto');
  const btnAttachEmoji = document.getElementById('btnAttachEmoji');
  const postsStream = document.getElementById('postsStream');
  const storiesStrip = document.getElementById('storiesStrip');

  const storyModal = document.getElementById('storyModal');
  const storyProgressFill = document.getElementById('storyProgressFill');
  const storyUserName = document.getElementById('storyUserName');
  const storyModalImg = document.getElementById('storyModalImg');
  const btnCloseStory = document.getElementById('btnCloseStory');

  const btnNotifications = document.getElementById('btnNotifications');
  const toastContainer = document.getElementById('toastContainer');

  let storyTimer = null;

  // --- Attach Photo ---
  const PRESET_ATTACHMENTS = [
    'assets/img/375651.jpg',
    'assets/img/375685.jpg',
    'assets/img/375904.jpg',
    'assets/img/8d3d8fe20eb41d01305b29b4d3fdcc27.jpg',
  ];

  btnAttachPhoto.addEventListener('click', () => {
    const randomPic = PRESET_ATTACHMENTS[Math.floor(Math.random() * PRESET_ATTACHMENTS.length)];
    state.attachedImage = randomPic;
    showToast('Photo attached to your post! 📸');
    btnAttachPhoto.textContent = '📸 Photo Added';
  });

  // --- Add Emoji ---
  const EMOJIS = ['🚀', '✨', '🔥', '💡', '🎉', '💻', '❤️'];
  btnAttachEmoji.addEventListener('click', () => {
    const em = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    postInput.value += ` ${em} `;
    postInput.focus();
  });

  // --- Create Post ---
  btnPublishPost.addEventListener('click', () => {
    const text = postInput.value.trim();
    if (!text && !state.attachedImage) {
      showToast('Write something before posting!');
      return;
    }

    const postCard = document.createElement('article');
    postCard.className = 'feed-post-card glass-card';
    postCard.innerHTML = `
      <div class="post-head">
        <div class="post-author-box">
          <img src="assets/img/IMG_20230522_132626_325.jpg" alt="Author" class="author-avatar" />
          <div class="author-meta">
            <strong>Abolfazl Paradox</strong>
            <span class="post-time">Just now • 🌍 Public</span>
          </div>
        </div>
      </div>

      <div class="post-body">
        <p>${escapeHtml(text)}</p>
      </div>

      ${
        state.attachedImage
          ? `<div class="post-image-box"><img src="${state.attachedImage}" alt="Post image" class="post-img" /></div>`
          : ''
      }

      <div class="post-reactions-bar">
        <span class="reaction-count"><span class="like-counter">1</span> Like</span>
        <span class="comment-count">0 Comments</span>
      </div>

      <div class="post-action-buttons">
        <button class="feed-act-btn btn-like liked">
          <span class="act-icon">👍</span>
          <span>Liked</span>
        </button>
        <button class="feed-act-btn btn-comment-toggle">
          <span class="act-icon">💬</span>
          <span>Comment</span>
        </button>
        <button class="feed-act-btn btn-share">
          <span class="act-icon">🔗</span>
          <span>Share</span>
        </button>
      </div>

      <div class="comments-drawer">
        <div class="comments-list"></div>
        <form class="comment-input-row">
          <input type="text" placeholder="Write a comment..." required />
          <button type="submit">Send</button>
        </form>
      </div>
    `;

    postsStream.prepend(postCard);
    postInput.value = '';
    state.attachedImage = null;
    btnAttachPhoto.textContent = '📷 Photo';
    showToast('Post published to feed! 🚀');
  });

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- Delegated Feed Events (Likes, Comments, Shares) ---
  postsStream.addEventListener('click', (e) => {
    // Like button
    const likeBtn = e.target.closest('.btn-like');
    if (likeBtn) {
      const card = likeBtn.closest('.feed-post-card');
      const counterEl = card.querySelector('.like-counter');
      let count = parseInt(counterEl.textContent, 10) || 0;

      const isLiked = likeBtn.classList.contains('liked');
      if (isLiked) {
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('span:last-child').textContent = 'Like';
        counterEl.textContent = Math.max(0, count - 1);
      } else {
        likeBtn.classList.add('liked');
        likeBtn.querySelector('span:last-child').textContent = 'Liked';
        counterEl.textContent = count + 1;
        showToast('You liked this post ❤️');
      }
      return;
    }

    // Share button
    const shareBtn = e.target.closest('.btn-share');
    if (shareBtn) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Post link copied to clipboard! 🔗');
      return;
    }
  });

  // Add Comment Form Submit
  postsStream.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target.closest('.comment-input-row');
    if (!form) return;
    const input = form.querySelector('input');
    const commentText = input.value.trim();
    if (!commentText) return;

    const drawer = form.closest('.comments-drawer');
    const list = drawer.querySelector('.comments-list');
    const card = form.closest('.feed-post-card');
    const commentCountEl = card.querySelector('.comment-count');

    const commentItem = document.createElement('div');
    commentItem.className = 'single-comment';
    commentItem.innerHTML = `
      <strong>Abolfazl Paradox</strong>
      <p>${escapeHtml(commentText)}</p>
    `;

    list.appendChild(commentItem);
    input.value = '';

    // Update comment counter
    const currentCount = list.querySelectorAll('.single-comment').length;
    commentCountEl.textContent = `${currentCount} Comment${currentCount === 1 ? '' : 's'}`;
    showToast('Comment added! 💬');
  });

  // --- Stories Modal Logic ---
  storiesStrip.addEventListener('click', (e) => {
    const item = e.target.closest('.story-item');
    if (!item) return;

    if (item.classList.contains('story-add')) {
      showToast('Story creation ready! Select photo to publish.');
      return;
    }

    const name = item.dataset.storyName;
    const img = item.dataset.storyImg;

    storyUserName.textContent = name;
    storyModalImg.src = img;
    storyModal.classList.remove('hidden');

    // Animate progress bar
    storyProgressFill.style.width = '0%';
    setTimeout(() => {
      storyProgressFill.style.transition = 'width 4s linear';
      storyProgressFill.style.width = '100%';
    }, 50);

    if (storyTimer) clearTimeout(storyTimer);
    storyTimer = setTimeout(() => {
      closeStory();
    }, 4050);
  });

  function closeStory() {
    storyModal.classList.add('hidden');
    storyProgressFill.style.transition = 'none';
    storyProgressFill.style.width = '0%';
    if (storyTimer) clearTimeout(storyTimer);
  }

  btnCloseStory.addEventListener('click', closeStory);
  storyModal.addEventListener('click', (e) => {
    if (e.target === storyModal) closeStory();
  });

  // Notifications button
  btnNotifications.addEventListener('click', () => {
    showToast('You have 3 new notifications from your network');
  });

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
})();
