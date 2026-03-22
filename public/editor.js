// editor.js — CP Platform frontend logic
// Handles: Monaco init, language switching, run/submit, AI panel, test cases

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  editor: null,
  language: "cpp",
  isLoggedIn: false,       // set from EJS: window.__USER__ = <%= user ? true : false %>
  problemId: null,         // set from EJS: window.__PROBLEM_ID__ = '<%= problem.id %>'
  isRunning: false,
  isSubmitting: false,
  isAnalyzing: false,
  isGeneratingTests: false,
};

// Default code stubs per language
const DEFAULT_CODE = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // your solution here
    
    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

def solve():
    # your solution here
    pass

solve()`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // your solution here
    }
}`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // your solution here
    return 0;
}`,
  rust: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let _line = line.unwrap();
        // your solution here
    }
}`,
};

// Monaco language IDs
const MONACO_LANG = {
  cpp: "cpp",
  python: "python",
  java: "java",
  c: "c",
  rust: "rust",
};

// ─── Monaco Init ──────────────────────────────────────────────────────────────

function initMonaco() {
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
    },
  });

  require(["vs/editor/editor.main"], function () {
    state.editor = monaco.editor.create(document.getElementById("monaco-container"), {
      value: DEFAULT_CODE[state.language],
      language: MONACO_LANG[state.language],
      theme: "vs-dark",
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: "on",
      roundedSelection: true,
      automaticLayout: true,
      tabSize: 4,
      wordWrap: "off",
      padding: { top: 16 },
    });

    // Keyboard shortcut: Ctrl+Enter / Cmd+Enter → Run
    state.editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => handleRun()
    );

    // Keyboard shortcut: Ctrl+Shift+Enter → Submit
    state.editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => handleSubmit()
    );
  });
}

// ─── Language Switching ───────────────────────────────────────────────────────

function switchLanguage(lang) {
  if (!MONACO_LANG[lang]) return;

  const prev = state.language;
  state.language = lang;

  // Update editor language
  const model = state.editor.getModel();
  monaco.editor.setModelLanguage(model, MONACO_LANG[lang]);

  // Only replace code if still on default stub (don't overwrite user's work)
  const currentCode = state.editor.getValue();
  if (currentCode.trim() === DEFAULT_CODE[prev].trim()) {
    state.editor.setValue(DEFAULT_CODE[lang]);
  }

  // Update UI
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

// ─── Run (Guest + Logged) ─────────────────────────────────────────────────────

async function handleRun() {
  if (state.isRunning) return;

  const code = state.editor.getValue().trim();
  if (!code) return showOutputError("Editor is empty.");

  const input = document.getElementById("stdin-input")?.value || "";

  setRunning(true);
  clearOutput();
  showOutputStatus("Running...");

  try {
    const res = await fetch("/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: state.language, input }),
    });

    const data = await res.json();

    if (!res.ok) {
      showOutputError(data.error || "Execution failed.");
      return;
    }

    renderOutput(data);
  } catch (err) {
    showOutputError("Network error. Please try again.");
  } finally {
    setRunning(false);
  }
}

// ─── Submit (Logged Users Only) ───────────────────────────────────────────────

async function handleSubmit() {
  if (!state.isLoggedIn) {
    showToast("Login to submit solutions.", "warn");
    return;
  }
  if (state.isSubmitting) return;
  if (!state.problemId) {
    showToast("No problem selected.", "warn");
    return;
  }

  const code = state.editor.getValue().trim();
  if (!code) return showOutputError("Editor is empty.");

  setSubmitting(true);
  showOutputStatus("Queued for judging...");

  try {
    const res = await fetch("/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: state.language,
        problemId: state.problemId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showOutputError(data.error || "Submission failed.");
      return;
    }

    // Poll for result using job ID
    pollSubmissionResult(data.jobId);
  } catch (err) {
    showOutputError("Network error. Please try again.");
    setSubmitting(false);
  }
}

async function pollSubmissionResult(jobId, attempts = 0) {
  const MAX_ATTEMPTS = 30;
  const INTERVAL = 2000; // 2s

  if (attempts >= MAX_ATTEMPTS) {
    showOutputError("Judge timed out. Please try again.");
    setSubmitting(false);
    return;
  }

  try {
    const res = await fetch(`/submit/status/${jobId}`);
    const data = await res.json();

    if (data.status === "pending" || data.status === "active") {
      showOutputStatus(`Judging... (${attempts + 1})`);
      setTimeout(() => pollSubmissionResult(jobId, attempts + 1), INTERVAL);
      return;
    }

    renderVerdict(data);
  } catch (err) {
    showOutputError("Lost connection to judge.");
  } finally {
    if (attempts >= MAX_ATTEMPTS) setSubmitting(false);
  }
}

// ─── AI: Code Analyzer ────────────────────────────────────────────────────────

async function handleAnalyze() {
  if (!state.isLoggedIn) {
    showToast("Login to use AI analysis.", "warn");
    return;
  }
  if (state.isAnalyzing) return;

  const code = state.editor.getValue().trim();
  if (!code) return showToast("Nothing to analyze.", "warn");

  state.isAnalyzing = true;
  openAIPanel();
  setAIPanelLoading("Analyzing your code...");

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: state.language }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAIPanelError(data.error || "Analysis failed.");
      return;
    }

    renderAnalysis(data.analysis);
  } catch (err) {
    setAIPanelError("Network error.");
  } finally {
    state.isAnalyzing = false;
  }
}

// ─── AI: Test Case Generator ──────────────────────────────────────────────────

async function handleGenerateTests() {
  if (!state.isLoggedIn) {
    showToast("Login to generate test cases.", "warn");
    return;
  }
  if (state.isGeneratingTests) return;
  if (!state.problemId) {
    showToast("Open a problem first.", "warn");
    return;
  }

  state.isGeneratingTests = true;
  openAIPanel();
  setAIPanelLoading("Generating edge test cases...");

  try {
    const res = await fetch("/generate-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: state.problemId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setAIPanelError(data.error || "Test generation failed.");
      return;
    }

    renderGeneratedTests(data.tests);
  } catch (err) {
    setAIPanelError("Network error.");
  } finally {
    state.isGeneratingTests = false;
  }
}

// ─── Output Rendering ─────────────────────────────────────────────────────────

function renderOutput(data) {
  const outputEl = document.getElementById("output-content");
  const statusEl = document.getElementById("output-status");

  if (data.stderr && data.stderr.trim()) {
    statusEl.textContent = "Runtime Error";
    statusEl.className = "output-status error";
    outputEl.textContent = data.stderr;
    outputEl.className = "output-text error";
    return;
  }

  if (data.compileError) {
    statusEl.textContent = "Compilation Error";
    statusEl.className = "output-status error";
    outputEl.textContent = data.compileError;
    outputEl.className = "output-text error";
    return;
  }

  statusEl.textContent = `Done  ·  ${data.executionTime ?? "–"}ms  ·  ${data.memoryUsed ?? "–"}KB`;
  statusEl.className = "output-status success";
  outputEl.textContent = data.stdout || "(no output)";
  outputEl.className = "output-text";
}

function renderVerdict(data) {
  const statusEl = document.getElementById("output-status");
  const outputEl = document.getElementById("output-content");

  const verdictClass = {
    AC: "success",
    WA: "error",
    TLE: "warn",
    MLE: "warn",
    RE: "error",
    CE: "error",
  };

  const verdictLabel = {
    AC: "Accepted",
    WA: "Wrong Answer",
    TLE: "Time Limit Exceeded",
    MLE: "Memory Limit Exceeded",
    RE: "Runtime Error",
    CE: "Compilation Error",
  };

  const cls = verdictClass[data.verdict] || "neutral";
  statusEl.textContent = verdictLabel[data.verdict] || data.verdict;
  statusEl.className = `output-status ${cls}`;

  let detail = "";
  if (data.passedTests != null) {
    detail += `Passed ${data.passedTests} / ${data.totalTests} test cases\n`;
  }
  if (data.failedInput) detail += `\nFailing input:\n${data.failedInput}`;
  if (data.expected) detail += `\nExpected:\n${data.expected}`;
  if (data.got) detail += `\nGot:\n${data.got}`;

  outputEl.textContent = detail || "";
  outputEl.className = `output-text ${cls}`;

  setSubmitting(false);
}

// ─── AI Panel Rendering ───────────────────────────────────────────────────────

function renderAnalysis(analysis) {
  const panel = document.getElementById("ai-panel-content");
  // analysis is a string (markdown-ish) from the LLM
  // Basic formatting: newlines → paragraphs
  panel.innerHTML = formatAIText(analysis);
}

function renderGeneratedTests(tests) {
  // tests: [{ input: string, description: string }]
  const panel = document.getElementById("ai-panel-content");

  if (!tests || tests.length === 0) {
    panel.innerHTML = `<p class="ai-empty">No test cases generated.</p>`;
    return;
  }

  panel.innerHTML = tests
    .map(
      (t, i) => `
    <div class="test-case-card">
      <div class="test-case-header">
        <span class="test-case-label">Test ${i + 1}</span>
        <span class="test-case-desc">${escapeHtml(t.description || "")}</span>
        <button class="btn-use-test" onclick="useTestCase(${i})">Use</button>
      </div>
      <pre class="test-case-input">${escapeHtml(t.input)}</pre>
    </div>`
    )
    .join("");

  // Store for later use
  window.__generatedTests = tests;
}

function useTestCase(index) {
  const tests = window.__generatedTests;
  if (!tests || !tests[index]) return;
  const stdinEl = document.getElementById("stdin-input");
  if (stdinEl) {
    stdinEl.value = tests[index].input;
    showToast("Test case loaded into stdin.", "success");
  }
}

// ─── AI Panel Controls ────────────────────────────────────────────────────────

function openAIPanel() {
  document.getElementById("ai-panel")?.classList.add("open");
}

function closeAIPanel() {
  document.getElementById("ai-panel")?.classList.remove("open");
}

function setAIPanelLoading(msg) {
  const panel = document.getElementById("ai-panel-content");
  panel.innerHTML = `<div class="ai-loading"><span class="ai-spinner"></span>${escapeHtml(msg)}</div>`;
}

function setAIPanelError(msg) {
  const panel = document.getElementById("ai-panel-content");
  panel.innerHTML = `<p class="ai-error">${escapeHtml(msg)}</p>`;
}

// ─── Output Helpers ───────────────────────────────────────────────────────────

function clearOutput() {
  document.getElementById("output-content").textContent = "";
  document.getElementById("output-status").textContent = "";
  document.getElementById("output-status").className = "output-status";
}

function showOutputStatus(msg) {
  document.getElementById("output-status").textContent = msg;
  document.getElementById("output-status").className = "output-status neutral";
}

function showOutputError(msg) {
  document.getElementById("output-status").textContent = "Error";
  document.getElementById("output-status").className = "output-status error";
  document.getElementById("output-content").textContent = msg;
  document.getElementById("output-content").className = "output-text error";
}

// ─── Button State ─────────────────────────────────────────────────────────────

function setRunning(val) {
  state.isRunning = val;
  const btn = document.getElementById("btn-run");
  if (!btn) return;
  btn.disabled = val;
  btn.textContent = val ? "Running..." : "Run  (Ctrl+↵)";
}

function setSubmitting(val) {
  state.isSubmitting = val;
  const btn = document.getElementById("btn-submit");
  if (!btn) return;
  btn.disabled = val;
  btn.textContent = val ? "Judging..." : "Submit";
}

// ─── Toast Notifications ──────────────────────────────────────────────────────

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatAIText(text) {
  // Very light formatting: bold **x**, code `x`, newlines
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Pull state injected by EJS
  state.isLoggedIn = window.__USER__ === true;
  state.problemId = window.__PROBLEM_ID__ || null;

  // Init Monaco
  initMonaco();

  // Language selector buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  });

  // Action buttons
  document.getElementById("btn-run")?.addEventListener("click", handleRun);
  document.getElementById("btn-submit")?.addEventListener("click", handleSubmit);
  document.getElementById("btn-analyze")?.addEventListener("click", handleAnalyze);
  document.getElementById("btn-gen-tests")?.addEventListener("click", handleGenerateTests);
  document.getElementById("btn-close-ai")?.addEventListener("click", closeAIPanel);

  // Hide submit button for guests
  if (!state.isLoggedIn) {
    document.getElementById("btn-submit")?.classList.add("hidden");
    document.getElementById("btn-analyze")?.classList.add("hidden");
    document.getElementById("btn-gen-tests")?.classList.add("hidden");
  }
});