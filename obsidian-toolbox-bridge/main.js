/*
 * Toolbox Bridge — Obsidian plugin
 *
 * Ribbon icon shows a menu to choose Forge (edit) or Annotator (read/highlight).
 * Also adds two separate commands in the command palette.
 *
 * Drop this file + manifest.json into:
 *   <vault>/.obsidian/plugins/toolbox-bridge/
 * Then enable "Toolbox Bridge" in Settings → Community plugins.
 */

"use strict";

const obsidian = require("obsidian");

const DEFAULT_SETTINGS = {
  appUrl: "http://localhost:5173",
  vaultName: "",
};

class ToolboxBridgePlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();

    if (!this.settings.vaultName) {
      this.settings.vaultName = this.app.vault.getName();
      await this.saveSettings();
    }

    // ── Ribbon icon: shows a picker menu ──
    this.addRibbonIcon("pencil", "Send to Toolbox", (evt) => {
      const menu = new obsidian.Menu();

      menu.addItem((item) =>
        item
          .setTitle("Edit in Obsidian Forge")
          .setIcon("file-edit")
          .onClick(async () => {
            await this.sendToApp("forge");
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Read in Annotator")
          .setIcon("highlighter")
          .onClick(async () => {
            await this.sendToApp("annotator");
          })
      );

      menu.showAtMouseEvent(evt);
    });

    // ── Command palette ──
    this.addCommand({
      id: "open-in-forge",
      name: "Edit current note in Obsidian Forge",
      callback: async () => await this.sendToApp("forge"),
    });

    this.addCommand({
      id: "open-in-annotator",
      name: "Open current note in Annotator",
      callback: async () => await this.sendToApp("annotator"),
    });

    this.addSettingTab(new ToolboxBridgeSettingTab(this.app, this));
  }

  async sendToApp(target) {
    const file = this.app.workspace.getActiveFile();
    if (!file) { new obsidian.Notice("No note is open."); return; }
    if (!file.path.endsWith(".md")) { new obsidian.Notice("This file isn't a Markdown note."); return; }

    const content = await this.app.vault.read(file);
    const name = file.name;
    const folder = file.parent ? file.parent.path : "";

    // Collect every folder in the vault
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
    folders.sort((a, b) => a.localeCompare(b));

    const encoded = btoa(unescape(encodeURIComponent(content)));

    const params = new URLSearchParams();
    params.set("target", target);
    params.set("name", name);
    params.set("folder", folder);
    params.set("vault", this.settings.vaultName);
    params.set("folders", folders.join("|"));
    params.set("content", encoded);

    const url = `${this.settings.appUrl.replace(/\/+$/, "")}/#${params.toString()}`;

    if (url.length > 2_000_000) {
      new obsidian.Notice("This note is too large to send via URL. Try a shorter note.");
      return;
    }

    window.open(url, "toolbox");
    const label = target === "forge" ? "Forge" : "Annotator";
    new obsidian.Notice(`Opened "${name}" in ${label}`);
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
      .setDesc("Where is Toolbox running? Use localhost for dev, your Vercel URL for production.")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:5173")
          .setValue(this.plugin.settings.appUrl)
          .onChange(async (value) => {
            this.plugin.settings.appUrl = value.trim() || DEFAULT_SETTINGS.appUrl;
            await this.plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName("Vault name")
      .setDesc("Used when sending notes back from the app. Auto-detected from your vault.")
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
