document.addEventListener('DOMContentLoaded', async () => {
  const DISCORD_ICON_PATH = 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z';
  const LINKS = {
    github: 'https://github.com/Marek-Codex/Discord-Server-Count',
    kofi: 'https://ko-fi.com/MarekCodex',
    twitch: 'https://www.twitch.tv/MarekCodex'
  };

  renderSharedChrome();
  bindInfoDialog();
  await loadStats();
  await loadDashboard();

  function renderSharedChrome() {
    document.querySelectorAll('[data-discord-logo]').forEach(logo => {
      logo.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="${DISCORD_ICON_PATH}"/>
        </svg>
      `;
    });

    document.querySelectorAll('[data-site-footer]').forEach(footer => {
      footer.innerHTML = `
        <p class="usage-line">Counts generated: <span id="usageCount">--</span></p>
        <p>
          Created by <a href="${LINKS.twitch}" title="Find MarekCodex on Twitch">MarekCodex</a>
          ·
          <a href="${LINKS.github}">Source on GitHub</a>
          ·
          <a href="${LINKS.kofi}">Ko-fi</a>
        </p>
        <p class="footer-copy">Tiny tools still need fuel. Code, caffeine, spite toward unnecessary dashboards, the usual.</p>
      `;
    });
  }

  function bindInfoDialog() {
    const infoDialog = document.getElementById('loginInfoDialog');
    const openInfo = document.querySelector('[data-open-info]');
    const closeInfo = document.querySelector('[data-close-info]');

    if (!infoDialog || !openInfo || !closeInfo) return;

    openInfo.addEventListener('click', () => {
      infoDialog.showModal();
    });

    closeInfo.addEventListener('click', () => {
      infoDialog.close();
    });

    infoDialog.addEventListener('click', event => {
      if (event.target === infoDialog) {
        infoDialog.close();
      }
    });
  }

  async function loadStats() {
    const usageCount = document.getElementById('usageCount');
    if (!usageCount) return;

    try {
      const res = await fetch('/api/stats');
      const stats = await res.json();
      usageCount.textContent = stats.countsGenerated.toLocaleString();
      usageCount.title = stats.durable ? 'Stored in Redis' : 'Local development counter';
    } catch {
      usageCount.textContent = '--';
    }
  }

  async function loadDashboard() {
    const avatar = document.getElementById('avatar');
    const username = document.getElementById('username');
    const userId = document.getElementById('userId');
    const serverCount = document.getElementById('serverCount');
    const userCard = document.getElementById('userCard');

    if (!serverCount) return;

    try {
      const res = await fetch('/api/user');
      const data = await res.json();

      if (!data.authenticated) {
        window.location = '/';
        return;
      }

      username.textContent = data.user.username;
      userId.textContent = data.user.id;
      serverCount.textContent = data.guildCount.toLocaleString();

      if (data.user.avatar) {
        avatar.src = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`;
        avatar.alt = `${data.user.username}'s avatar`;
      } else {
        avatar.classList.add('hidden');
      }

      userCard.classList.add('is-visible');
      await loadStats();
    } catch {
      username.textContent = 'Error loading';
      userId.textContent = '--';
      serverCount.textContent = '--';
      userCard.classList.add('is-visible');
    }
  }
});
