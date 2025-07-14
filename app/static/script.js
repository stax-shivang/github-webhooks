class GitHubActivityMonitor {
  constructor() {
    this.activityFeed = document.getElementById("activityFeed");
    this.emptyState = document.getElementById("emptyState");
    this.statusDot = document.getElementById("statusDot");
    this.statusText = document.getElementById("statusText");
    this.lastUpdated = document.getElementById("lastUpdated");

    this.isFirstLoad = true;
    this.pollInterval = null;

    this.init();
  }

  init() {
    this.startPolling();
  }

  startPolling() {
    // Initial load
    this.fetchLogs();

    // Poll every 15 seconds
    this.pollInterval = setInterval(() => {
      this.fetchLogs();
    }, 15000);
  }

  async fetchLogs() {
    try {
      this.updateStatus("connecting", "Fetching updates...");

      const response = await fetch("/api/logs");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const logs = await response.json();
      this.displayLogs(logs);
      this.updateStatus("connected", "Connected");
      this.updateLastUpdated();
    } catch (error) {
      console.error("Error fetching logs:", error);
      this.updateStatus("error", "Connection error");

      if (this.isFirstLoad) {
        this.showError();
      }
    }
  }

  displayLogs(logs) {
    this.isFirstLoad = false;

    if (!logs || logs.length === 0) {
      this.showEmptyState();
      return;
    }

    // Sort logs by timestamp (newest first)
    const sortedLogs = logs.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    this.activityFeed.innerHTML = "";
    this.emptyState.style.display = "none";

    sortedLogs.forEach((log) => {
      const activityItem = this.createActivityItem(log);
      this.activityFeed.appendChild(activityItem);
    });
  }

  createActivityItem(log) {
    const item = document.createElement("div");
    item.className = "activity-item";

    const icon = this.getActionIcon(log.action);
    const message = this.formatMessage(log);
    const timeFormatted = this.formatTimestamp(log.timestamp);

    item.innerHTML = `
            <div class="activity-icon ${log.action.toLowerCase().replace("_", "-")}">
                ${icon}
            </div>
            <div class="activity-content">
                <div class="activity-message">${message}</div>
                <div class="activity-time">${timeFormatted}</div>
            </div>
        `;

    return item;
  }

  getActionIcon(action) {
    const icons = {
      PUSH: "⬆️",
      PULL_REQUEST: "🔄",
      MERGE: "🔀",
    };
    return icons[action] || "📝";
  }

  formatMessage(log) {
    const author = `<span class="activity-author">${log.author}</span>`;
    const fromBranch = log.from_branch
      ? `<span class="activity-branch">${log.from_branch}</span>`
      : "";
    const toBranch = `<span class="activity-branch">${log.to_branch}</span>`;

    switch (log.action) {
      case "PUSH":
        return `${author} pushed to ${toBranch}`;

      case "PULL_REQUEST":
        return `${author} submitted a pull request from ${fromBranch} to ${toBranch}`;

      case "MERGE":
        return `${author} merged branch ${fromBranch} to ${toBranch}`;

      default:
        return `${author} performed ${log.action} on ${toBranch}`;
    }
  }

  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      };

      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      return timestamp;
    }
  }

  updateStatus(status, text) {
    this.statusDot.className = `status-dot ${status}`;
    this.statusText.textContent = text;
  }

  updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    this.lastUpdated.textContent = timeString;
  }

  showEmptyState() {
    this.activityFeed.innerHTML = "";
    this.emptyState.style.display = "block";
  }

  showError() {
    this.activityFeed.innerHTML = `
            <div class="loading">
                <div style="color: #ef4444; font-size: 2rem; margin-bottom: 15px;">⚠️</div>
                <p style="color: #ef4444;">Failed to load activity data</p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">Check your connection and try again</p>
            </div>
        `;
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

// Initialize the monitor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new GitHubActivityMonitor();
});

// Clean up when the page is unloaded
window.addEventListener("beforeunload", () => {
  if (window.monitor) {
    window.monitor.destroy();
  }
});
