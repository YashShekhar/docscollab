"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { Collaborator } from "@docscollab/types";
import { Users, FileText, Clock } from "lucide-react";

interface CollaborativeEditorProps {
  initialContent: string;
  documentTitle: string;
  onContentChange: (html: string, plainText: string) => void;
  onTyping: (isTyping: boolean) => void;
  registerContentChangeHandler: (fn: (content: string) => void) => void;
  remoteTyping: Record<string, boolean>;
  collaborators: Collaborator[];
  currentUserId: string;
}

export function CollaborativeEditor({
  initialContent,
  documentTitle,
  onContentChange,
  onTyping,
  registerContentChangeHandler,
  remoteTyping,
  collaborators,
  currentUserId,
}: CollaborativeEditorProps) {
  const isLocalUpdateRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stats, setStats] = useState({ words: 0, characters: 0, readTime: "1 min" });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Write something here... (collaborators see live changes)",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[750px] px-8 sm:px-14 py-10 leading-relaxed text-zinc-900 dark:text-zinc-100",
      },
    },
    onUpdate: ({ editor }) => {
      if (isLocalUpdateRef.current) return;

      const html = editor.getHTML();
      const text = editor.getText();

      // Calculate stats
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const readMinutes = Math.max(1, Math.ceil(words / 200));
      setStats({
        words,
        characters: chars,
        readTime: `${readMinutes} min`,
      });

      // Broadcast changes
      onContentChange(html, text);

      // Typing presence
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1200);
    },
  });

  // Calculate stats on initial load
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const readMinutes = Math.max(1, Math.ceil(words / 200));
      setStats({
        words,
        characters: chars,
        readTime: `${readMinutes} min`,
      });
    }
  }, [editor]);

  // Handle remote content updates from other collaborators
  useEffect(() => {
    registerContentChangeHandler((remoteContent: string) => {
      if (!editor) return;

      const currentContent = editor.getHTML();
      if (currentContent !== remoteContent) {
        isLocalUpdateRef.current = true;
        // Keep selection if possible
        const { from, to } = editor.state.selection;
        editor.commands.setContent(remoteContent, { emitUpdate: false });

        // Update stats
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readMinutes = Math.max(1, Math.ceil(words / 200));
        setStats({
          words,
          characters: chars,
          readTime: `${readMinutes} min`,
        });

        // Restore selection safely
        try {
          const maxPos = editor.state.doc.content.size;
          const safeFrom = Math.min(from, maxPos);
          const safeTo = Math.min(to, maxPos);
          editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
        } catch {
          // ignore selection boundary adjustments
        }

        setTimeout(() => {
          isLocalUpdateRef.current = false;
        }, 50);
      }
    });
  }, [editor, registerContentChangeHandler]);

  // Names of other users actively typing right now
  const typingUsers = useMemo(() => {
    return collaborators
      .filter((c) => c.id !== currentUserId && remoteTyping[c.id])
      .map((c) => c.name);
  }, [collaborators, currentUserId, remoteTyping]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Google Docs Toolbar */}
      <EditorToolbar editor={editor} documentTitle={documentTitle} />

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="bg-blue-50/90 dark:bg-blue-950/70 border-b border-blue-200 dark:border-blue-900/40 px-4 py-1 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 transition-all">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>
            <strong>{typingUsers.join(", ")}</strong> {typingUsers.length === 1 ? "is" : "are"}{" "}
            typing...
          </span>
        </div>
      )}

      {/* Document Workspace Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:py-10 flex justify-center">
        {/* Google Docs Paper Sheet */}
        <div className="w-full max-w-[850px] bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200/80 dark:border-zinc-800 rounded-sm min-h-[950px] flex flex-col transition-shadow hover:shadow-xl">
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Bottom Status / Stats Bar */}
      <footer className="sticky bottom-0 z-20 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 print:hidden shadow-inner">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {stats.words.toLocaleString()} words
          </span>
          <span className="hidden sm:inline-block">•</span>
          <span className="hidden sm:inline-block">
            {stats.characters.toLocaleString()} characters
          </span>
          <span className="hidden md:inline-block">•</span>
          <span className="hidden md:flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {stats.readTime} read
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-blue-500" />
          <span>
            {collaborators.length} {collaborators.length === 1 ? "collaborator" : "collaborators"}{" "}
            online
          </span>
        </div>
      </footer>
    </div>
  );
}
