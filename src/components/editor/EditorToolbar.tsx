"use client";

import React, { useState } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  RemoveFormatting,
  Download,
  FileText,
  Printer,
  ChevronDown,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  documentTitle: string;
}

export function EditorToolbar({ editor, documentTitle }: EditorToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!editor) return null;

  const handleExport = (format: "txt" | "md" | "html" | "print") => {
    setShowExportMenu(false);
    const title = documentTitle.trim() || "document";

    if (format === "print") {
      window.print();
      return;
    }

    if (format === "html") {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { font-size: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #555; }
    pre { background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  ${editor.getHTML()}
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === "txt") {
      const text = editor.getText();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === "md") {
      // Basic markdown conversion from html / text
      const text = editor.getText();
      const blob = new Blob([`# ${title}\n\n${text}`], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.md`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
  };

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "Heading 1"
    : editor.isActive("heading", { level: 2 })
    ? "Heading 2"
    : editor.isActive("heading", { level: 3 })
    ? "Heading 3"
    : "Normal text";

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-4 py-1.5 text-zinc-700 dark:text-zinc-300 print:hidden shadow-sm">
      {/* History */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Heading Selector */}
      <div className="relative">
        <select
          value={currentHeading}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "Heading 1") {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            } else if (val === "Heading 2") {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            } else if (val === "Heading 3") {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
          className="h-8 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="Normal text">Normal text</option>
          <option value="Heading 1">Heading 1</option>
          <option value="Heading 2">Heading 2</option>
          <option value="Heading 3">Heading 3</option>
        </select>
      </div>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Basic Marks */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("bold")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("italic")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("underline")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("strike")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight Text"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("highlight")
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Highlighter className="h-4 w-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive({ textAlign: "left" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive({ textAlign: "center" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <AlignCenter className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive({ textAlign: "right" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          title="Justify"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive({ textAlign: "justify" })
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <AlignJustify className="h-4 w-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

      {/* Lists & Quotes */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("bulletList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("orderedList")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("blockquote")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Quote className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={`rounded p-1.5 transition-colors ${
            editor.isActive("codeBlock")
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Code className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear Formatting"
          className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export / Download Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors shadow-2xs"
        >
          <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Export</span>
          <ChevronDown className="h-3 w-3 text-zinc-400" />
        </button>

        {showExportMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowExportMenu(false)}
            />
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => handleExport("txt")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
              >
                <FileText className="h-3.5 w-3.5 text-zinc-500" />
                Plain Text (.txt)
              </button>
              <button
                type="button"
                onClick={() => handleExport("md")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
              >
                <FileText className="h-3.5 w-3.5 text-purple-500" />
                Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => handleExport("html")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
              >
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                Web Page (.html)
              </button>
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-700" />
              <button
                type="button"
                onClick={() => handleExport("print")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left font-medium"
              >
                <Printer className="h-3.5 w-3.5 text-blue-500" />
                Print / Save as PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
