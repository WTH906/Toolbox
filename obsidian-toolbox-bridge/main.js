/*
 * Toolbox Bridge — Obsidian plugin
 *
 * Sends the current note to Forge or Annotator via a short API handoff.
 * No more giant URLs — the content goes through Redis.
 */

"use strict";

const obsidian = require("obsidian");

const DEFAULT_SETTINGS = {
  appUrl: "https://localhost:5173",
  vaultName: "",
};

class ToolboxBridgePlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();

    if (!this.settings.vaultName) {
      this.settings.vaultName = this.app.vault.getName();
      await this.saveSettings();
    }

    this.addRibbonIcon("pencil", "Send to Toolbox", (evt) => {
      const menu = new obsidian.Menu();
      menu.addItem((item) =>
        item.setTitle("Edit in Obsidian Forge").setIcon("file-edit")
          .onClick(() => this.sendToApp("forge"))
      );
      menu.addItem((item) =>
        item.setTitle("Read in Annotator").setIcon("highlighter")
          .onClick(() => this.sendToApp("annotator"))
      );
      menu.showAtMouseEvent(evt);
    });

    this.addCommand({
      id: "open-in-forge",
      name: "Edit current note in Obsidian Forge",
      callback: () => this.sendToApp("forge"),
    });

    this.addCommand({
      id: "open-in-annotator",
      name: "Open current note in Annotator",
      callback: () => this.sendToApp("annotator"),
    });

    this.addSettingTab(new ToolboxBridgeSettingTab(this.app, this));
  }

  async sendToApp(target) {
    const file = this.app.workspace.getActiveFile();
    if (!file) { new obsidian.Notice("No note is open."); return; }
    if (!file.path.endsWith(".md")) { new obsidian.Notice("Not a Markdown file."); return; }

    const content = await this.app.vault.read(file);
    const name = file.name;
    const folder = file.parent ? file.parent.path : "";

    const folders = [];
    const seen = new Set();
    this.app.vault.getAllLoadedFiles().forEach((f) => {
      if (f.children !== undefined && f.path && f.path !== "/") {
        if (!f.path.startsWith(".") && !seen.has(f.path)) {
          seen.add(f.path);
          folders.push(f.path);
        }
      }
    });
    folders.sort();

    const baseUrl = this.settings.appUrl.replace(/\/+$/, "");

    // POST the note to the bridge API — get a short ID back
    new obsidian.Notice("Sending to Toolbox…");

    try {
      const res = await obsidian.requestUrl({
        url: baseUrl + "/api/bridge",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, name, content, vault: this.settings.vaultName, folder, folders }),
      });

      if (res.status !== 200) {
        new obsidian.Notice("Failed to send: " + (res.json?.error || res.status));
        return;
      }

      const id = res.json.id;

      // Open a short URL — the app fetches the content from the bridge
      const shortUrl = baseUrl + "/#bridge=" + id + "&target=" + target;

      // Use Electron shell — URL is now short so it always works
      require("electron").shell.openExternal(shortUrl);

      const label = target === "forge" ? "Forge" : "Annotator";
      new obsidian.Notice('Opened "' + name + '" in ' + label);
    } catch (err) {
      console.error("Toolbox Bridge error:", err);
      new obsidian.Notice("Connection failed — is the app URL correct?\n" + err.message);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class ToolboxBridgeSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Toolbox Bridge" });
    containerEl.createEl("p", {
      text: "Send notes to Obsidian Forge (edit) or MD Annotator (read & highlight).",
      cls: "setting-item-description",
    });

    new obsidian.Setting(containerEl)
      .setName("App URL")
      .setDesc("Your Vercel URL (e.g. https://my-toolbox.vercel.app) or http://localhost:5173 for dev.")
      .addText((text) =>
        text
          .setPlaceholder("https://my-toolbox.vercel.app")
          .setValue(this.plugin.settings.appUrl)
          .onChange(async (value) => {
            this.plugin.settings.appUrl = value.trim() || DEFAULT_SETTINGS.appUrl;
            await this.plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName("Vault name")
      .setDesc("Auto-detected. Used when sending notes back from the app.")
      .addText((text) =>
        text
          .setPlaceholder(this.plugin.app.vault.getName())
          .setValue(this.plugin.settings.vaultName)
          .onChange(async (value) => {
            this.plugin.settings.vaultName = value.trim() || this.plugin.app.vault.getName();
            await this.plugin.saveSettings();
          })
      );
  }
}

module.exports = ToolboxBridgePlugin;
