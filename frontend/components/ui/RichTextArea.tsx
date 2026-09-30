'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Flag,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Sparkles,
  Maximize2,
  Minimize2,
  Code,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Eraser,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Eye,
  HelpCircle,
  X,
} from 'lucide-react';

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  required?: boolean;
}

export default function RichTextArea({
  value,
  onChange,
  placeholder = 'Write content here...',
  rows = 5,
  label,
  required = false,
}: RichTextAreaProps) {
  const [showSource, setShowSource] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffff00');

  // Custom modal dialog states (Anchor, Link, Image, SpecialChar, Help)
  const [activeModal, setActiveModal] = useState<'anchor' | 'link' | 'image' | 'specialChar' | 'help' | null>(null);
  const [modalInputVal, setModalInputVal] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Save active cursor/text selection inside contentEditable div
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
        return;
      }
    }
  };

  // Restore cursor selection before executing insert commands
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // Convert markdown image notation ![alt](url) to HTML figure img tag inside editor
  const formatValueToHtml = (val: string) => {
    if (!val) return '';
    return val.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi, (match, alt, url) => {
      return `<figure class="my-4 text-center"><img src="${url}" alt="${alt || 'Article Image'}" class="max-w-full h-auto rounded-xl mx-auto border border-gray-400 dark:border-zinc-700 shadow-sm" /></figure>`;
    });
  };

  // Sync internal HTML content with prop value when value changes externally
  useEffect(() => {
    if (editorRef.current && !showSource) {
      const htmlVal = formatValueToHtml(value || '');
      if (editorRef.current.innerHTML !== htmlVal) {
        editorRef.current.innerHTML = htmlVal;
      }
    }
  }, [value, showSource]);

  // Lock background body and html scroll when any modal in RichTextArea is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [activeModal]);

  // Execute browser formatting command on contentEditable div
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (showSource) setShowSource(false);

    setTimeout(() => {
      if (savedRangeRef.current) {
        restoreSelection();
      } else if (editorRef.current) {
        editorRef.current.focus();
      }
      try {
        document.execCommand(command, false, arg);
      } catch (err) {
        console.error('execCommand error:', err);
      }
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }, 10);
  };

  // Open Anchor Dialog
  const openAnchorModal = () => {
    saveSelection();
    setModalInputVal('');
    setActiveModal('anchor');
  };

  // Open Link Dialog
  const openLinkModal = () => {
    saveSelection();
    setModalInputVal('https://');
    setActiveModal('link');
  };

  // Open Image Dialog
  const openImageModal = () => {
    saveSelection();
    setModalInputVal('https://');
    setActiveModal('image');
  };

  // Submit Modal Action
  const handleModalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = modalInputVal.trim();

    if (activeModal === 'anchor') {
      if (val) {
        const anchorHTML = `<a id="${val}" name="${val}" class="inline-inline-block align-middle px-1.5 py-0.5 mx-0.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-400 dark:border-red-800 rounded-md text-xs font-bold cursor-default select-none" title="Anchor: ${val}">🚩 ${val}</a>&nbsp;`;
        execCmd('insertHTML', anchorHTML);
      }
    } else if (activeModal === 'link') {
      if (val) {
        const selection = window.getSelection();
        const selectedText = selection?.toString() || '';
        if (selectedText.trim()) {
          execCmd('createLink', val);
        } else {
          const linkHTML = `<a href="${val}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 font-bold underline hover:underline break-all">${val}</a>&nbsp;`;
          execCmd('insertHTML', linkHTML);
        }
      }
    } else if (activeModal === 'image') {
      if (val) {
        const imgHTML = `<figure class="my-4 text-center"><img src="${val}" alt="Article Image" class="max-w-full h-auto rounded-xl mx-auto border border-gray-400 dark:border-zinc-700 shadow-sm" /></figure><p></p>`;
        execCmd('insertHTML', imgHTML);
      }
    }
    setActiveModal(null);
  };

  // Insert Table
  const insertTable = () => {
    saveSelection();
    const tableHTML = `<table class="w-full border-collapse border border-zinc-400 dark:border-zinc-700 my-3 text-sm">
      <thead>
        <tr class="bg-zinc-100 dark:bg-zinc-800">
          <th class="border border-zinc-400 dark:border-zinc-700 p-2 font-bold text-left">Header 1</th>
          <th class="border border-zinc-400 dark:border-zinc-700 p-2 font-bold text-left">Header 2</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-zinc-400 dark:border-zinc-700 p-2">Data 1</td>
          <td class="border border-zinc-400 dark:border-zinc-700 p-2">Data 2</td>
        </tr>
      </tbody>
    </table><p></p>`;
    execCmd('insertHTML', tableHTML);
  };

  // Toggle Blockquote cleanly without messy nesting
  const toggleBlockquote = () => {
    saveSelection();
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      execCmd('formatBlock', 'blockquote');
      return;
    }

    let node: Node | null = sel.anchorNode;
    let bqNode: HTMLElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'BLOCKQUOTE') {
        bqNode = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (bqNode && bqNode.parentNode) {
      // Direct unwrap: Move all children out of blockquote and remove the blockquote tag
      const parent = bqNode.parentNode;
      while (bqNode.firstChild) {
        parent.insertBefore(bqNode.firstChild, bqNode);
      }
      parent.removeChild(bqNode);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } else {
      execCmd('formatBlock', 'blockquote');
    }
  };

  // Handle Clipboard Operations
  const handleCut = () => execCmd('cut');
  const handleCopy = () => execCmd('copy');
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) execCmd('insertText', text);
    } catch {
      openLinkModal();
    }
  };

  // Handle typing inside contentEditable container
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`space-y-1.5 w-full ${isFullscreen ? 'fixed inset-0 z-[99999] bg-white dark:bg-zinc-900 p-4 flex flex-col space-y-3' : ''}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit Fullscreen Mode</span>
            </button>
          )}
        </div>
      )}

      <div className={`rounded-2xl border border-gray-400 bg-white overflow-hidden shadow-xs dark:border-zinc-600 dark:bg-zinc-900 transition-all focus-within:border-primary ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>

        {/* FULL CKEDITOR STYLE TOOLBAR (2 ROWS) */}
        <div className="border-b border-gray-400 bg-zinc-50/80 p-2.5 dark:border-zinc-700 dark:bg-zinc-950/60 select-none space-y-2">

          {/* ROW 1: Edit, History, Links, Inserts & View Modes */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Clipboard / Edit Group */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={handleCut}
                title="Cut Text (Ctrl+X)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Scissors className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Text (Ctrl+C)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handlePaste}
                title="Paste Text (Ctrl+V)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Clipboard className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-300/80 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Undo / Redo History Group */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={() => execCmd('undo')}
                title="Undo Last Action (Ctrl+Z)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('redo')}
                title="Redo Action (Ctrl+Y)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-300/80 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Links & Anchors Group */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={openLinkModal}
                title="Add Website Link (Ctrl+K)"
                className="rounded-lg p-1.5 hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-950/40 cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('unlink')}
                title="Remove Link"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Unlink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openAnchorModal}
                title="Anchor Properties (Flag)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Flag className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-300/80 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Inserts Group (Image, Table, Line, Special Symbol) */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={openImageModal}
                title="Insert Image by URL"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={insertTable}
                title="Insert Table Grid"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('insertHorizontalRule')}
                title="Insert Horizontal Divider Line"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('specialChar')}
                title="Insert Special Symbol (©, ®, ™, €, ₹, $, °)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Maximize / Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Fullscreen Editor'}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border border-gray-400 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 shadow-2xs cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="hidden md:inline">{isFullscreen ? 'Minimize' : 'Maximize'}</span>
              </button>

              {/* Source Code Toggle */}
              <button
                type="button"
                onClick={() => setShowSource(!showSource)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all border bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:border-white shadow-2xs cursor-pointer"
              >
                {showSource ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Visual Editor</span>
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4" />
                    <span>Source Code</span>
                  </>
                )}
              </button>

              {/* ❓ Editor Help Guide Button */}
              <button
                type="button"
                onClick={() => setActiveModal('help')}
                title="Editor Guide & Keyboard Shortcuts (?)"
                className="rounded-xl border border-gray-400 bg-white p-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer shadow-2xs"
              >
                <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </button>
            </div>

          </div>

          {/* ROW 2: Text Formatting, Paragraphs, Alignment & Colors */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-400 dark:border-zinc-700/60">

            {/* Font Styling Group */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={() => execCmd('bold')}
                title="Bold Text (B)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 font-black cursor-pointer"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                title="Italic Text (I)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('underline')}
                title="Underline Text (U)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('strikeThrough')}
                title="Strikethrough Text (S)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Strikethrough className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('removeFormat')}
                title="Clear All Formatting (Tx)"
                className="rounded-lg p-1.5 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <Eraser className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-300/80 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Lists & Indents Group */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={() => execCmd('insertOrderedList')}
                title="Numbered List (1., 2., 3.)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('insertUnorderedList')}
                title="Bulleted List (•)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('outdent')}
                title="Decrease Indent"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Outdent className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('indent')}
                title="Increase Indent"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Indent className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleBlockquote}
                title="Quote Callout Box (&quot;&quot;)"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Quote className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-300/80 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Alignments Group */}
            <div className="flex items-center rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              <button
                type="button"
                onClick={() => execCmd('justifyLeft')}
                title="Align Left"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyCenter')}
                title="Align Center"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyRight')}
                title="Align Right"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <AlignRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => execCmd('justifyFull')}
                title="Justify Text"
                className="rounded-lg p-1.5 hover:bg-zinc-100 text-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <AlignJustify className="h-4 w-4" />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-zinc-300/80 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

            {/* Format / Headings Selector */}
            <select
              onChange={(e) => execCmd('formatBlock', e.target.value)}
              defaultValue="<p>"
              title="Heading Style / Paragraph Format"
              className="rounded-xl border border-gray-400 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="<p>">Normal Paragraph</option>
              <option value="<h1>">Heading 1 (H1 - Main)</option>
              <option value="<h2>">Heading 2 (H2 - Subheading)</option>
              <option value="<h3>">Heading 3 (H3 - Section)</option>
              <option value="<h4>">Heading 4 (H4 - Minor)</option>
              <option value="<pre>">Code Block / Preformatted</option>
              <option value="<address>">Address Block</option>
            </select>

            {/* Font Size Selector */}
            <select
              onChange={(e) => execCmd('fontSize', e.target.value)}
              defaultValue="3"
              title="Font Size"
              className="rounded-xl border border-gray-400 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="1">Small (10px)</option>
              <option value="2">Normal (13px)</option>
              <option value="3">Medium (16px)</option>
              <option value="4">Large (18px)</option>
              <option value="5">Huge (24px)</option>
            </select>

            {/* Intuitive Text Color & Background Color Controls */}
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-gray-400 dark:bg-zinc-900 dark:border-zinc-700 shadow-2xs">
              
              {/* Text Color */}
              <label className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300" title="Text Color">
                <Palette className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                <span className="hidden xl:inline text-[11px]">Text Color</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    execCmd('foreColor', e.target.value);
                  }}
                  className="h-4 w-5 border-0 bg-transparent cursor-pointer p-0 rounded"
                />
              </label>

              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

              {/* Background Color */}
              <label className="flex items-center gap-1.5 px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300" title="Highlight Background Color">
                <Highlighter className="h-4 w-4 text-amber-500" />
                <span className="hidden xl:inline text-[11px]">Highlight</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    execCmd('hiliteColor', e.target.value);
                  }}
                  className="h-4 w-5 border-0 bg-transparent cursor-pointer p-0 rounded"
                />
              </label>
            </div>

          </div>

        </div>

        {/* Display Area: Visual WYSIWYG Editable Div vs Raw HTML Textarea */}
        {showSource ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            required={required}
            className={`w-full bg-white px-4 py-3 text-base font-mono text-gray-900 placeholder:text-gray-500 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 leading-relaxed ${isFullscreen ? 'flex-1 min-h-[400px]' : ''}`}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={() => {
              saveSelection();
              handleInput();
            }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onSelect={saveSelection}
            onClick={saveSelection}
            style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : `${rows * 28}px` }}
            className={`w-full bg-white px-4 py-3 text-base text-gray-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 font-sans leading-relaxed prose dark:prose-invert max-w-none break-words overflow-x-auto [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:text-gray-900 dark:[&_blockquote]:text-white [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:list-item [&_li]:my-1 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:italic ${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* 🚩 CUSTOM POPUP MODAL DIALOG (Anchor Properties, Link, Image, Special Character, Help) */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 overscroll-contain"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-gray-400 dark:border-zinc-700 space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-400 pb-3 dark:border-zinc-700">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                {activeModal === 'anchor' && <Flag className="h-4 w-4 text-emerald-600" />}
                {activeModal === 'link' && <LinkIcon className="h-4 w-4 text-blue-600" />}
                {activeModal === 'image' && <ImageIcon className="h-4 w-4 text-purple-600" />}
                {activeModal === 'specialChar' && <Sparkles className="h-4 w-4 text-amber-500" />}
                {activeModal === 'help' && <HelpCircle className="h-4 w-4 text-blue-600" />}
                <span>
                  {activeModal === 'anchor' && 'Anchor Properties'}
                  {activeModal === 'link' && 'Link Properties'}
                  {activeModal === 'image' && 'Image Properties'}
                  {activeModal === 'specialChar' && 'Insert Special Symbol'}
                  {activeModal === 'help' && 'Rich Text Editor Guide & Shortcuts'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ABOUT GUJARAT POST EDITOR MODAL CONTENT */}
            {activeModal === 'help' ? (
              <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
                
                {/* Branding Badge Header */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 border border-gray-400 dark:bg-zinc-950/60 dark:border-zinc-700 text-center space-y-2">
                  <div className="inline-flex items-center gap-1 bg-red-600 text-white font-black px-3 py-1 rounded-xl text-base tracking-tight shadow-xs">
                    <span>GUJARAT POST</span>
                    <span className="text-xs text-yellow-300 font-bold">.in</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Gujarat Post Content Studio</h4>
                    <p className="text-[11px] font-semibold text-zinc-500">Version 2.5 (Enhanced Article Editor)</p>
                  </div>
                </div>

                {/* Shortcuts Grid */}
                <div className="rounded-xl bg-blue-50/60 p-3 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-900/40">
                  <h5 className="font-extrabold text-blue-700 dark:text-blue-400 mb-1 text-[11px] uppercase tracking-wider">⌨️ Quick Keyboard Shortcuts</h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                    <div><span className="font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-400 dark:border-zinc-700">Ctrl + B</span> Bold Text</div>
                    <div><span className="font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-400 dark:border-zinc-700">Ctrl + I</span> Italic Text</div>
                    <div><span className="font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-400 dark:border-zinc-700">Ctrl + U</span> Underline Text</div>
                    <div><span className="font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-400 dark:border-zinc-700">Ctrl + Z</span> Undo Action</div>
                    <div><span className="font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-400 dark:border-zinc-700">Ctrl + Y</span> Redo Action</div>
                    <div><span className="font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-gray-400 dark:border-zinc-700">Ctrl + K</span> Add Link URL</div>
                  </div>
                </div>

                {/* Gujarat Post Key Features */}
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p>• <strong>🚩 Anchor (Flag)</strong>: Inserts visible section markers for reader jump links.</p>
                  <p>• <strong>👁️ Live Reader Preview</strong>: Test live reader view before publishing.</p>
                  <p>• <strong>🌐 Multi-Language Sync</strong>: Auto-translates titles and drafts for Gujarati, Hindi, and English.</p>
                </div>

                <div className="pt-2 border-t border-gray-400 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium">Copyright © 2026 Gujarat Post News Portal</span>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-xl border border-gray-400 bg-zinc-100 px-5 py-2 text-xs font-extrabold text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : activeModal === 'specialChar' ? (
              /* Special Character Grid */
              <div className="grid grid-cols-6 gap-2 py-2">
                {['©', '®', '™', '€', '₹', '$', '%', '±', '≠', '≤', '≥', '°', '•', '—', '📌', '🔹', '⭐', '🔥'].map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => {
                      execCmd('insertHTML', char);
                      setActiveModal(null);
                    }}
                    className="flex h-10 items-center justify-center rounded-xl border border-gray-400 bg-zinc-50 text-base font-extrabold text-zinc-800 hover:border-amber-500 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ) : (
              /* Input Form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                    {activeModal === 'anchor' && 'Anchor Name'}
                    {activeModal === 'link' && 'Link URL Address'}
                    {activeModal === 'image' && 'Image URL Address'}
                  </label>
                  <input
                    type="text"
                    value={modalInputVal}
                    onChange={(e) => setModalInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleModalSubmit();
                      }
                    }}
                    placeholder={
                      activeModal === 'anchor'
                        ? 'e.g. section-1'
                        : 'https://...'
                    }
                    className="w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2.5 text-base font-medium text-zinc-900 placeholder:text-gray-500 focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    autoFocus
                  />
                </div>

                {/* Modal Footer Actions (OK / Cancel) */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-400 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-xl border border-gray-400 bg-zinc-100 px-4 py-2 text-xs font-extrabold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModalSubmit()}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
