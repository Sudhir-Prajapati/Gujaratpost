'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  UploadCloud,
  Upload,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Film,
  ExternalLink,
  Video,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import { escapeEmbedAttribute } from '@/lib/article-embed-input';
import { getSocialEmbed } from '@/lib/social-embeds';

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  required?: boolean;
  hideEmbed?: boolean;
}


// ── Helper to parse and convert video / social media / iframe embed codes ────
export function parseEmbedToHtml(
  input: string,
  aspect: string = '16/9',
  caption: string = ''
): { html: string; platform: string; previewSrc?: string } | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  const aspectClass =
    aspect === '9/16'
      ? 'aspect-[9/16] max-w-[360px] mx-auto'
      : aspect === '1/1'
      ? 'aspect-square max-w-[480px] mx-auto'
      : 'aspect-video w-full';

  // 1. Twitter / X post / status / embed code check
  const twMatch = trimmed.match(/(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+\/status|i\/web\/status|i\/status)\/(\d+)/i);
  if (twMatch && twMatch[1]) {
    const statusId = twMatch[1];
    const tweetUrl = `https://x.com/i/status/${statusId}`;
    const srcdocHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}.twitter-tweet{margin:0 auto!important}</style></head><body><blockquote class="twitter-tweet" data-dnt="true"><a href="${tweetUrl}">View post on X</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script><script>(function(){function n(){var t=document.querySelector('.twitter-tweet-rendered')||document.querySelector('.twitter-tweet');var h=t?(t.offsetHeight||t.getBoundingClientRect().height):0;if(!h||h<80){h=document.body.scrollHeight||document.documentElement.scrollHeight||0;}if(h>50){window.parent.postMessage({type:'gp-embed-resize',url:'${tweetUrl}',height:Math.ceil(h)},'*');}}if(window.ResizeObserver){new ResizeObserver(n).observe(document.body);}if(window.twttr&&window.twttr.events){window.twttr.events.bind('rendered',n);}var c=0;var i=setInterval(function(){c++;n();if(c>35)clearInterval(i);},120);window.addEventListener('load',n);window.addEventListener('resize',n);})();</script></body></html>`;

    const html = `<figure data-article-social-platform="twitter" data-article-social-mode="embed" data-article-social-url="${tweetUrl}" class="my-4 flex justify-center w-full overflow-hidden" contenteditable="false"><iframe srcdoc="${escapeEmbedAttribute(srcdocHtml)}" title="X (Twitter) embedded post" data-social-platform="twitter" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="display:block;width:100%;max-width:550px;margin:0 auto;height:480px;border:0;aspect-ratio:auto"></iframe>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</figure><p><br></p>`;

    return { html, platform: 'X (Twitter) Post' };
  }

  // 2. YouTube regular, shorts, live, or embed
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const isShorts = trimmed.includes('/shorts/');
    const chosenAspect = isShorts || aspect === '9/16' ? 'aspect-[9/16] max-w-[360px] mx-auto' : 'aspect-video w-full';
    const embedSrc = `https://www.youtube.com/embed/${videoId}?rel=0`;

    const html = `<figure data-article-social-platform="youtube" data-article-social-mode="embed" data-article-social-url="https://www.youtube.com/watch?v=${videoId}" class="my-4 flex justify-center w-full overflow-hidden" contenteditable="false"><div class="${chosenAspect} rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/30 w-full"><iframe src="${embedSrc}" title="YouTube video player" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</figure><p><br></p>`;

    return { html, platform: isShorts ? 'YouTube Shorts' : 'YouTube Video', previewSrc: embedSrc };
  }

  // 3. Instagram post / reel / tv
  const instaSocial = getSocialEmbed(trimmed, 'instagram');
  const instaRegexMatch = trimmed.match(/instagram\.com\/(?:p|reel|reels|tv)\/([^/?#&]+)/i);
  if (instaSocial || (instaRegexMatch && instaRegexMatch[1])) {
    const postCode = instaRegexMatch ? instaRegexMatch[1] : (instaSocial?.url.match(/\/(?:p|reel|tv)\/([^/?#&]+)/)?.[1] || '');
    const isReel = trimmed.includes('/reel') || trimmed.includes('/reels');
    const instagramUrl = instaSocial?.url || `https://www.instagram.com/p/${postCode}/`;
    const embedSrc = `https://www.instagram.com/p/${postCode}/embed`;
    const chosenAspect = isReel || aspect === '9/16' ? 'aspect-[9/16] max-w-[360px] mx-auto' : (aspect === '1/1' ? 'aspect-square max-w-[480px] mx-auto' : 'w-full max-w-[500px] mx-auto');

    const html = `<figure data-article-social-platform="instagram" data-article-social-mode="embed" data-article-social-url="${instagramUrl}" class="my-4 flex justify-center w-full overflow-hidden" contenteditable="false"><div class="${chosenAspect} min-h-[480px] w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/30"><iframe src="${embedSrc}" title="Instagram post" class="w-full h-full border-0" allowtransparency="true" allowfullscreen loading="lazy"></iframe></div>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</figure><p><br></p>`;

    return { html, platform: isReel ? 'Instagram Reel' : 'Instagram Post', previewSrc: embedSrc };
  }

  // 4. Facebook post / video / reel
  const fbSocial = getSocialEmbed(trimmed, 'facebook');
  if (fbSocial) {
    const isVideo = /video\.php|plugins\/video|watch\?v=|\/videos\/|\/reel\//i.test(fbSocial.src) || /videos|reel|watch/i.test(trimmed);
    const chosenAspect = isVideo ? 'aspect-video w-full' : 'w-full max-w-[500px] mx-auto';
    const html = `<figure data-article-social-platform="facebook" data-article-social-mode="embed" data-article-social-url="${fbSocial.url}" class="my-4 flex justify-center w-full overflow-hidden" contenteditable="false"><div class="${chosenAspect} rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full"><iframe src="${fbSocial.src}" title="Facebook post" class="w-full h-full border-0" style="min-height:${isVideo ? '360px' : '520px'}" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</figure><p><br></p>`;

    return { html, platform: isVideo ? 'Facebook Video' : 'Facebook Post', previewSrc: fbSocial.src };
  }

  // 5. Raw iframe check: <iframe ...>
  if (/<iframe\b[^>]*>/i.test(trimmed)) {
    let safeIframe = trimmed;
    if (!safeIframe.includes('loading=')) safeIframe = safeIframe.replace('<iframe', '<iframe loading="lazy"');
    if (!safeIframe.includes('allowfullscreen')) safeIframe = safeIframe.replace('<iframe', '<iframe allowfullscreen');

    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    const previewSrc = srcMatch ? srcMatch[1] : undefined;

    const html = `<div class="embedded-media-block my-4" contenteditable="false"><div class="${aspectClass} rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/30 flex items-center justify-center">${safeIframe.replace(/<iframe\b([^>]*)>/i, '<iframe$1 class="w-full h-full border-0">')}</div>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</div><p><br></p>`;

    return { html, platform: 'Custom Iframe', previewSrc };
  }

  // 6. Vimeo video
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    const embedSrc = `https://player.vimeo.com/video/${vimeoId}`;
    const html = `<div class="embedded-media-block my-4" contenteditable="false"><div class="aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/30"><iframe src="${embedSrc}" title="Vimeo video" class="w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</div><p><br></p>`;

    return { html, platform: 'Vimeo Video', previewSrc: embedSrc };
  }

  // 7. Direct Video file (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    const html = `<div class="embedded-media-block my-4" contenteditable="false"><video src="${trimmed}" controls class="w-full rounded-2xl shadow-md aspect-video bg-black"></video>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</div><p><br></p>`;

    return { html, platform: 'Direct Video Player' };
  }

  // 8. Generic web URL as responsive iframe embed
  if (/^https?:\/\//i.test(trimmed)) {
    const html = `<div class="embedded-media-block my-4" contenteditable="false"><div class="${aspectClass} rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/30"><iframe src="${trimmed}" class="w-full h-full border-0" allowfullscreen loading="lazy"></iframe></div>${caption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${caption}</div>` : ''}</div><p><br></p>`;

    return { html, platform: 'Web Embed Link', previewSrc: trimmed };
  }

  return null;
}

export default function RichTextArea({
  value,
  onChange,
  placeholder = 'Write content here...',
  rows = 5,
  label,
  required = false,
  hideEmbed: hideEmbedProp = false,
}: RichTextAreaProps) {
  const hideEmbed = Boolean(hideEmbedProp || (label && /short description|excerpt/i.test(label)));
  const [showSource, setShowSource] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffff00');

  // Custom modal dialog states (Anchor, Link, Image, SpecialChar, Help)
  const [activeModal, setActiveModal] = useState<'anchor' | 'link' | 'image' | 'specialChar' | 'help' | null>(null);
  const [modalInputVal, setModalInputVal] = useState('');
  // Link & Embed modal state
  const [linkTab, setLinkTab] = useState<'link' | 'embed'>('link');
  const [linkTextVal, setLinkTextVal] = useState('');
  const [linkOpenNewTab, setLinkOpenNewTab] = useState(true);
  const [embedInputVal, setEmbedInputVal] = useState('');
  const [embedAspect, setEmbedAspect] = useState<'16/9' | '9/16' | '1/1' | 'auto'>('16/9');
  const [embedCaption, setEmbedCaption] = useState('');
  const [selectedEmbedPlatform, setSelectedEmbedPlatform] = useState<'all' | 'youtube' | 'instagram' | 'facebook' | 'twitter'>('all');


  // Image insertion & management states
  const [imageTab, setImageTab] = useState<'device' | 'url' | 'manage'>('device');
  const [selectedDeviceFile, setSelectedDeviceFile] = useState<File | null>(null);
  const [deviceFilePreview, setDeviceFilePreview] = useState<string | null>(null);
  const [imageAltText, setImageAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<Array<{ id: string; src: string; alt: string }>>([]);

  // In-editor image selection & floating toolbar
  const [selectedImgEl, setSelectedImgEl] = useState<HTMLImageElement | null>(null);
  const [selectedImgRect, setSelectedImgRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const deviceFileInputRef = useRef<HTMLInputElement>(null);

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
    let formatted = val.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi, (match, alt, url) => {
      return `<figure class="my-4 text-center"><img src="${url}" alt="${alt || 'Article Image'}" class="max-w-full h-auto rounded-xl mx-auto border border-gray-400 dark:border-zinc-700 shadow-sm" /></figure>`;
    });
    // Ensure all social embed figures have contenteditable="false" so they act as non-editable blocks
    formatted = formatted.replace(/<figure\b([^>]*data-article-social-platform=["'][^"']+["'][^>]*)>/gi, (match, attrs) => {
      if (!attrs.includes('contenteditable=')) {
        return `<figure ${attrs} contenteditable="false">`;
      }
      return match;
    });
    return formatted;
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

  // Listen for iframe postMessage resize events from embeds (e.g. Twitter / X embed)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        (event.data.type === 'gp-embed-resize' || event.data.type === 'gp-twitter-resize') &&
        typeof event.data.height === 'number' &&
        editorRef.current
      ) {
        const h = event.data.height;
        if (h < 50) return;
        const iframes = editorRef.current.querySelectorAll<HTMLIFrameElement>('iframe');
        iframes.forEach((iframe) => {
          let match = false;
          try {
            if (iframe.contentWindow === event.source) match = true;
          } catch {
            // cross-origin
          }
          if (!match && event.data.url) {
            const srcdoc = iframe.getAttribute('srcdoc') || '';
            if (srcdoc.includes(event.data.url)) match = true;
          }
          if (match) {
            iframe.style.setProperty('height', `${h}px`, 'important');
            iframe.style.setProperty('min-height', `${h}px`, 'important');
            iframe.style.setProperty('max-height', `${h}px`, 'important');
            iframe.style.setProperty('aspect-ratio', 'auto', 'important');
            iframe.style.setProperty('overflow', 'hidden', 'important');
            const fig = iframe.closest('figure');
            if (fig) {
              fig.style.setProperty('height', 'auto', 'important');
              fig.style.setProperty('margin-bottom', '0.75rem', 'important');
            }
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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

  // Open Link & Embedded Media Dialog
  const openLinkModal = (initialTab: 'link' | 'embed' = 'link') => {
    saveSelection();
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    const selectedText = sel?.toString() || '';
    setLinkTab(hideEmbed ? 'link' : initialTab);
    setSelectedEmbedPlatform('all');
    setLinkTextVal(selectedText);
    if (selectedText.startsWith('http://') || selectedText.startsWith('https://')) {
      setModalInputVal(selectedText);
      setEmbedInputVal(selectedText);
    } else {
      setModalInputVal('https://');
      setEmbedInputVal('');
    }
    setEmbedCaption('');
    setEmbedAspect('16/9');
    setActiveModal('link');
  };

  // Scan current content for all embedded images (HTML <img> and Markdown ![...](...))
  const refreshCurrentImages = useCallback(() => {
    const list: Array<{ id: string; src: string; alt: string }> = [];
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll('img');
      imgs.forEach((img, i) => {
        list.push({
          id: `img-${i}-${img.src}`,
          src: img.getAttribute('src') || img.src,
          alt: img.getAttribute('alt') || `Story Image #${i + 1}`,
        });
      });
    } else if (value) {
      const htmlMatches = [...value.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']?([^"'>]*)["']?[^>]*>/gi)];
      htmlMatches.forEach((m, i) => {
        list.push({
          id: `html-img-${i}`,
          src: m[1],
          alt: m[2] || `Story Image #${i + 1}`,
        });
      });
      const mdMatches = [...value.matchAll(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi)];
      mdMatches.forEach((m, i) => {
        list.push({
          id: `md-img-${i}`,
          src: m[2],
          alt: m[1] || `Story Image #${i + 1}`,
        });
      });
    }
    setCurrentImages(list);
    return list;
  }, [value]);

  // Insert HTML at cursor position or append to editor
  const insertHtmlAtCursor = (html: string) => {
    if (showSource) {
      const newVal = (value || '') + '\n' + html;
      onChange(newVal);
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRangeRef.current) {
        restoreSelection();
      }
    }

    try {
      const success = document.execCommand('insertHTML', false, html);
      if (!success && editorRef.current) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
          editorRef.current.appendChild(tempDiv.firstChild);
        }
      }
    } catch (err) {
      console.error('execCommand error:', err);
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
      }
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    setTimeout(refreshCurrentImages, 30);
  };

  // Open Image Dialog
  const openImageModal = () => {
    saveSelection();
    setImageTab('device');
    setModalInputVal('https://');
    setImageAltText('');
    setSelectedDeviceFile(null);
    if (deviceFilePreview) URL.revokeObjectURL(deviceFilePreview);
    setDeviceFilePreview(null);
    setUploadError(null);
    refreshCurrentImages();
    setActiveModal('image');
  };

  // Process Device File Selection
  const processSelectedDeviceFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Selected file is not an image. Please choose JPG, PNG, WEBP, or GIF.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit.');
      return;
    }
    setSelectedDeviceFile(file);
    setUploadError(null);
    if (!imageAltText) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setImageAltText(cleanName);
    }
    const previewUrl = URL.createObjectURL(file);
    setDeviceFilePreview(previewUrl);
  };

  const handleDeviceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedDeviceFile(e.target.files[0]);
    }
  };

  // Upload image from device and insert into description
  const handleDeviceUploadAndInsert = async () => {
    if (!selectedDeviceFile) {
      setUploadError('Please choose an image file from your device first.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedDeviceFile);

      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Image upload failed.');
      }

      const uploadedUrl = json.url || json.data?.url;
      if (!uploadedUrl) {
        throw new Error('Server did not return a valid image URL.');
      }

      const alt = imageAltText.trim() || selectedDeviceFile.name.replace(/\.[^/.]+$/, '');
      const imgHTML = `<figure class="my-4 text-center"><img src="${uploadedUrl}" alt="${alt}" class="max-w-full h-auto rounded-xl mx-auto border border-gray-400 dark:border-zinc-700 shadow-sm" /></figure><p></p>`;

      insertHtmlAtCursor(imgHTML);

      if (deviceFilePreview) {
        URL.revokeObjectURL(deviceFilePreview);
      }
      setSelectedDeviceFile(null);
      setDeviceFilePreview(null);
      setImageAltText('');
      setActiveModal(null);
    } catch (err: any) {
      console.error('Device upload error:', err);
      setUploadError(err.message || 'Failed to upload image from device.');
    } finally {
      setIsUploading(false);
    }
  };

  // Insert image via URL link
  const handleUrlInsert = () => {
    const url = modalInputVal.trim();
    if (!url || url === 'https://') {
      setUploadError('Please enter a valid image URL.');
      return;
    }
    const alt = imageAltText.trim() || 'Article Image';
    const imgHTML = `<figure class="my-4 text-center"><img src="${url}" alt="${alt}" class="max-w-full h-auto rounded-xl mx-auto border border-gray-400 dark:border-zinc-700 shadow-sm" /></figure><p></p>`;
    insertHtmlAtCursor(imgHTML);
    setModalInputVal('https://');
    setImageAltText('');
    setActiveModal(null);
  };

  // Remove specific image by URL
  const handleRemoveImageFromList = (srcToRemove: string) => {
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll('img');
      imgs.forEach((img) => {
        const imgSrc = img.getAttribute('src') || img.src;
        if (imgSrc === srcToRemove || img.src === srcToRemove) {
          const parent = img.parentElement;
          if (parent && parent.tagName === 'FIGURE') {
            parent.remove();
          } else {
            img.remove();
          }
        }
      });
      onChange(editorRef.current.innerHTML);
    } else if (value) {
      const escaped = srcToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let newVal = value.replace(new RegExp(`<figure[^>]*>\\s*<img[^>]+src=["']${escaped}["'][^>]*>\\s*<\\/figure>`, 'gi'), '');
      newVal = newVal.replace(new RegExp(`<img[^>]+src=["']${escaped}["'][^>]*>`, 'gi'), '');
      newVal = newVal.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escaped}\\)`, 'gi'), '');
      onChange(newVal);
    }

    if (selectedImgEl && (selectedImgEl.getAttribute('src') === srcToRemove || selectedImgEl.src === srcToRemove)) {
      setSelectedImgEl(null);
      setSelectedImgRect(null);
    }
    setTimeout(refreshCurrentImages, 20);
  };

  // Remove all images from description
  const handleRemoveAllImages = () => {
    if (!confirm('Are you sure you want to remove all images from this description?')) return;
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll('img');
      imgs.forEach((img) => {
        const parent = img.parentElement;
        if (parent && parent.tagName === 'FIGURE') {
          parent.remove();
        } else {
          img.remove();
        }
      });
      onChange(editorRef.current.innerHTML);
    } else if (value) {
      let newVal = value.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '');
      newVal = newVal.replace(/<img[^>]+>/gi, '');
      newVal = newVal.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi, '');
      onChange(newVal);
    }
    setSelectedImgEl(null);
    setSelectedImgRect(null);
    setTimeout(refreshCurrentImages, 20);
  };

  // Click on image in editor to reveal action overlay
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      const imgEl = target as HTMLImageElement;
      setSelectedImgEl(imgEl);
      const rect = imgEl.getBoundingClientRect();
      setSelectedImgRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      if (selectedImgEl) {
        setSelectedImgEl(null);
        setSelectedImgRect(null);
      }
    }
  };

  // Remove currently selected image
  const handleRemoveSelectedImg = () => {
    if (!selectedImgEl) return;
    const parent = selectedImgEl.parentElement;
    if (parent && parent.tagName === 'FIGURE') {
      parent.remove();
    } else {
      selectedImgEl.remove();
    }
    setSelectedImgEl(null);
    setSelectedImgRect(null);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    refreshCurrentImages();
  };

  // Align currently selected image
  const handleAlignSelectedImg = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImgEl) return;
    const parent = selectedImgEl.parentElement;
    const targetEl = parent && parent.tagName === 'FIGURE' ? parent : selectedImgEl;

    targetEl.className =
      alignment === 'center'
        ? 'my-4 text-center clear-both'
        : alignment === 'left'
        ? 'my-4 float-left mr-4 max-w-[50%]'
        : 'my-4 float-right ml-4 max-w-[50%]';

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      const rect = selectedImgEl.getBoundingClientRect();
      setSelectedImgRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  // Inline upload for drag-and-drop & paste
  const uploadAndInsertFile = async (file: File) => {
    setIsUploadingInline(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Image upload failed');
      }
      const uploadedUrl = json.url || json.data?.url;
      if (!uploadedUrl) {
        throw new Error('No image URL returned from server');
      }
      const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const imgHTML = `<figure class="my-4 text-center"><img src="${uploadedUrl}" alt="${alt}" class="max-w-full h-auto rounded-xl mx-auto border border-gray-400 dark:border-zinc-700 shadow-sm" /></figure><p></p>`;
      insertHtmlAtCursor(imgHTML);
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      alert(err.message || 'Failed to upload image from device.');
    } finally {
      setIsUploadingInline(false);
    }
  };

  // Highlight selected image in editor DOM
  useEffect(() => {
    if (selectedImgEl) {
      selectedImgEl.style.outline = '3px solid #ef4444';
      selectedImgEl.style.outlineOffset = '3px';
      selectedImgEl.style.borderRadius = '12px';
    }
    return () => {
      if (selectedImgEl) {
        selectedImgEl.style.outline = '';
        selectedImgEl.style.outlineOffset = '';
      }
    };
  }, [selectedImgEl]);

  // Keep floating action overlay positioned correctly on scroll/resize
  useEffect(() => {
    const updateRect = () => {
      if (selectedImgEl) {
        const rect = selectedImgEl.getBoundingClientRect();
        if (rect.bottom < 50 || rect.top > window.innerHeight - 50) {
          setSelectedImgEl(null);
          setSelectedImgRect(null);
        } else {
          setSelectedImgRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }
      }
    };

    if (selectedImgEl) {
      window.addEventListener('scroll', updateRect, true);
      window.addEventListener('resize', updateRect);
    }
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [selectedImgEl]);

  // Deselect image when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.floating-img-toolbar') || (selectedImgEl && selectedImgEl.contains(target))) {
        return;
      }
      setSelectedImgEl(null);
      setSelectedImgRect(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedImgEl]);

  // Submit Modal Action (for Anchor, Link & Embed)
  const handleModalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (activeModal === 'anchor') {
      const val = modalInputVal.trim();
      if (val) {
        const anchorHTML = `<a id="${val}" name="${val}" class="inline-block align-middle px-1.5 py-0.5 mx-0.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-400 dark:border-red-800 rounded-md text-xs font-bold cursor-default select-none" title="Anchor: ${val}">🚩 ${val}</a>&nbsp;`;
        execCmd('insertHTML', anchorHTML);
      }
    } else if (activeModal === 'link') {
      if (linkTab === 'embed') {
        const embedVal = embedInputVal.trim();
        if (!embedVal) return;

        // If cursor is inside an <a> tag, break out of it before inserting embed block
        if (typeof window !== 'undefined') {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            let node: Node | null = sel.getRangeAt(0).startContainer;
            while (node && node !== editorRef.current) {
              if (node.nodeName === 'A') {
                const range = document.createRange();
                range.setStartAfter(node);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                break;
              }
              node = node.parentNode;
            }
          }
        }

        const parsed = parseEmbedToHtml(embedVal, embedAspect, embedCaption);
        if (parsed) {
          execCmd('insertHTML', parsed.html);
        } else {
          const basicUrl = embedVal.startsWith('http') ? embedVal : `https://${embedVal}`;
          const aspectClass =
            embedAspect === '9/16'
              ? 'aspect-[9/16] max-w-[360px] mx-auto'
              : embedAspect === '1/1'
              ? 'aspect-square max-w-[480px] mx-auto'
              : 'aspect-video w-full';
          const fallbackHtml = `<div class="embedded-media-block my-4" contenteditable="false"><div class="${aspectClass} rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800 bg-black/5 dark:bg-black/30"><iframe src="${basicUrl}" class="w-full h-full border-0" allowfullscreen loading="lazy"></iframe></div>${embedCaption ? `<div class="text-xs text-center text-gray-500 dark:text-zinc-400 mt-1.5 italic">${embedCaption}</div>` : ''}</div><p><br></p>`;
          execCmd('insertHTML', fallbackHtml);
        }
      } else {
        const urlVal = modalInputVal.trim();
        if (urlVal) {
          // If user pasted an iframe tag into the link tab, intelligently embed it
          if (/<iframe\b/i.test(urlVal)) {
            const parsed = parseEmbedToHtml(urlVal, '16/9');
            if (parsed) {
              execCmd('insertHTML', parsed.html);
              setActiveModal(null);
              return;
            }
          }

          const targetAttr = linkOpenNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
          const displayText = linkTextVal.trim() || urlVal;
          const linkHTML = `<a href="${urlVal}"${targetAttr} class="text-blue-600 dark:text-blue-400 font-bold underline hover:underline break-all">${displayText}</a>&nbsp;`;
          execCmd('insertHTML', linkHTML);
        }
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

      <div className={`relative rounded-2xl border border-gray-400 bg-white overflow-hidden shadow-xs dark:border-zinc-600 dark:bg-zinc-900 transition-all focus-within:border-primary ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>

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
                onClick={() => openLinkModal('link')}
                title="Add Website Link (Ctrl+K)"
                className="rounded-lg p-1.5 hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-950/40 cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              {!hideEmbed && (
                <button
                  type="button"
                  onClick={() => openLinkModal('embed')}
                  title="Embed Video / Social / Iframe (YouTube, Insta Reels, Vimeo)"
                  className="rounded-lg p-1.5 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <Film className="h-4 w-4" />
                </button>
              )}
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
          <div className="relative">
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
              onClick={(e) => {
                saveSelection();
                handleEditorClick(e);
              }}
              onKeyDown={(e) => {
                if (selectedImgEl && (e.key === 'Backspace' || e.key === 'Delete')) {
                  e.preventDefault();
                  handleRemoveSelectedImg();
                }
              }}
              onDragOver={(e) => {
                if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={async (e) => {
                setIsDraggingFile(false);
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.type.startsWith('image/')) {
                    e.preventDefault();
                    await uploadAndInsertFile(file);
                  }
                }
              }}
              onPaste={async (e) => {
                if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
                  const file = e.clipboardData.files[0];
                  if (file.type.startsWith('image/')) {
                    e.preventDefault();
                    await uploadAndInsertFile(file);
                  }
                }
              }}
              style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : `${rows * 28}px` }}
              className={`w-full bg-white px-4 py-3 text-base text-gray-900 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 font-sans leading-relaxed prose dark:prose-invert max-w-none break-words overflow-x-auto [&_img]:cursor-pointer [&_img]:transition-all [&_img:hover]:opacity-90 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:text-gray-900 dark:[&_blockquote]:text-white [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:list-item [&_li]:my-1 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:italic ${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}
              data-placeholder={placeholder}
            />

            {/* Drag File Hover Indicator */}
            {isDraggingFile && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-blue-50/90 dark:bg-blue-950/90 border-2 border-dashed border-blue-500 rounded-2xl backdrop-blur-xs pointer-events-none">
                <UploadCloud className="h-10 w-10 text-blue-600 animate-bounce" />
                <span className="text-sm font-extrabold text-blue-900 dark:text-blue-100 mt-2">
                  Drop Image Here to Upload & Insert into Description
                </span>
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  Supports JPG, PNG, WEBP, GIF
                </span>
              </div>
            )}

            {/* Inline Uploading Indicator */}
            {isUploadingInline && (
              <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 bg-zinc-900/95 text-white px-3 py-1.5 rounded-xl shadow-lg border border-zinc-700 text-xs font-bold animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span>Uploading image from device...</span>
              </div>
            )}
          </div>
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
                {activeModal === 'link' && (
                  linkTab === 'embed' ? (
                    <Film className="h-4 w-4 text-rose-600" />
                  ) : (
                    <LinkIcon className="h-4 w-4 text-blue-600" />
                  )
                )}
                {activeModal === 'image' && <ImageIcon className="h-4 w-4 text-purple-600" />}
                {activeModal === 'specialChar' && <Sparkles className="h-4 w-4 text-amber-500" />}
                {activeModal === 'help' && <HelpCircle className="h-4 w-4 text-blue-600" />}
                <span>
                  {activeModal === 'anchor' && 'Anchor Properties (એન્કર ગુણધર્મો)'}
                  {activeModal === 'link' && (linkTab === 'embed' ? 'Embed Media Properties (વિડીયો / આઈફ્રેમ)' : 'Link Properties (લિંક ગુણધર્મો)')}
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
            ) : activeModal === 'image' ? (
              /* DEDICATED IMAGE MODAL (From Device, Image URL, Manage/Remove) */
              <div className="space-y-3.5">
                {/* 🌟 Perfect Image Size Guidance */}
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/80 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-700/80 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-2xs">
                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black text-white shrink-0">16:9</span>
                  <span className="font-medium">
                    પરફેક્ટ ઇમેજ સાઇઝ: <strong className="font-black text-emerald-900 dark:text-emerald-100">1280 × 720 px</strong> (16:9 Ratio) — આ સાઇઝ વેબસાઇટ અને સોશિયલ મીડિયામાં પરફેક્ટ ફિટ થશે.
                  </span>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 dark:border-zinc-700 -mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImageTab('device');
                      setUploadError(null);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      imageTab === 'device'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>From Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageTab('url');
                      setUploadError(null);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      imageTab === 'url'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Image URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageTab('manage');
                      refreshCurrentImages();
                      setUploadError(null);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      imageTab === 'manage'
                        ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Manage / Remove ({currentImages.length})</span>
                  </button>
                </div>

                {/* TAB 1: FROM DEVICE */}
                {imageTab === 'device' ? (
                  <div className="space-y-4">
                    <input
                      ref={deviceFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDeviceFileSelect}
                    />

                    {!selectedDeviceFile ? (
                      <div
                        onClick={() => deviceFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            processSelectedDeviceFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer bg-zinc-50/60 hover:bg-purple-50/20 dark:bg-zinc-800/40 dark:hover:bg-purple-950/20 transition-all space-y-2 group"
                      >
                        <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            Click to browse device or drag & drop image here
                          </p>
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                            ⭐ Perfect Size: 1280 × 720 px (16:9 Ratio)
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Upload photos from your computer, phone, or tablet (JPG, PNG, WebP, GIF)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl border border-gray-300 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center max-h-56 p-2">
                          {deviceFilePreview ? (
                            <img src={deviceFilePreview} alt="Selected Preview" className="max-h-52 w-auto object-contain rounded-xl shadow-xs" />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-zinc-400" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeviceFile(null);
                              if (deviceFilePreview) URL.revokeObjectURL(deviceFilePreview);
                              setDeviceFilePreview(null);
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-md"
                            title="Change image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 px-1">
                          <span className="font-semibold truncate max-w-[240px]">{selectedDeviceFile.name}</span>
                          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{(selectedDeviceFile.size / 1024).toFixed(1)} KB</span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Image Caption / Alt Description (Optional)
                          </label>
                          <input
                            type="text"
                            value={imageAltText}
                            onChange={(e) => setImageAltText(e.target.value)}
                            placeholder="e.g. Gujarat Post event coverage"
                            className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-300 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="rounded-xl border border-gray-300 bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!selectedDeviceFile || isUploading}
                        onClick={handleDeviceUploadAndInsert}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-5 py-2 text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading Image...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>Upload & Insert Image</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : imageTab === 'url' ? (
                  /* TAB 2: IMAGE URL */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Image URL Address *
                      </label>
                      <input
                        type="text"
                        value={modalInputVal}
                        onChange={(e) => setModalInputVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUrlInsert();
                          }
                        }}
                        placeholder="https://... or /uploads/..."
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Image Caption / Alt Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={imageAltText}
                        onChange={(e) => setImageAltText(e.target.value)}
                        placeholder="e.g. Press conference in Ahmedabad"
                        className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    {uploadError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-300 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="rounded-xl border border-gray-300 bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleUrlInsert}
                        className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-extrabold text-white shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Insert Image</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TAB 3: MANAGE / REMOVE IMAGES */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                        {currentImages.length} {currentImages.length === 1 ? 'Image' : 'Images'} currently inside this description
                      </span>
                      {currentImages.length > 1 && (
                        <button
                          type="button"
                          onClick={handleRemoveAllImages}
                          className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove All Images</span>
                        </button>
                      )}
                    </div>

                    {currentImages.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 space-y-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
                        <ImageIcon className="h-10 w-10 mx-auto text-zinc-400 opacity-60" />
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          No images in this description yet
                        </p>
                        <p className="text-xs text-zinc-500">
                          Use "From Device" or "Image URL" tab to insert an image into your story.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {currentImages.map((img, i) => (
                          <div
                            key={img.id || i}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:border-red-300 dark:hover:border-red-900/60 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={img.src}
                                alt={img.alt || 'Story Image'}
                                className="w-14 h-14 rounded-lg object-cover border border-gray-300 dark:border-zinc-700 bg-white shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/demo/1.jpg';
                                }}
                              />
                              <div className="min-w-0 text-left">
                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {img.alt || `Story Image #${i + 1}`}
                                </p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                                  {img.src}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveImageFromList(img.src)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                              title="Remove image from description"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-2 border-t border-gray-300 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="rounded-xl border border-gray-300 bg-zinc-100 px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : activeModal === 'link' ? (
              /* DEDICATED LINK & EMBED MODAL */
              <div className="space-y-4">
                {/* Segmented Tab Switcher */}
                <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-gray-300 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setLinkTab('link')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      linkTab === 'link'
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>🔗 Web Link (વેબ લિંક)</span>
                  </button>
                  {!hideEmbed && (
                    <button
                      type="button"
                      onClick={() => setLinkTab('embed')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        linkTab === 'embed'
                          ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Film className="h-4 w-4" />
                      <span>🎬 Embedded Link (વિડીયો / આઈફ્રેમ)</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: STANDARD WEB LINK */}
                {linkTab === 'link' ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                        LINK URL ADDRESS (લિંકનું URL)
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={modalInputVal}
                          onChange={(e) => setModalInputVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleModalSubmit();
                            }
                          }}
                          placeholder="https://example.com/article"
                          className="w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                        DISPLAY TEXT (લિંક પર દેખાતું લખાણ - વૈકલ્પિક)
                      </label>
                      <input
                        type="text"
                        value={linkTextVal}
                        onChange={(e) => setLinkTextVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleModalSubmit();
                          }
                        }}
                        placeholder="e.g. અહીં વાંચો / Click here to read full story"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        ખાલી રાખશો તો લિંકનું URL સીધું દેખાશે.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="linkNewTabCheck"
                        checked={linkOpenNewTab}
                        onChange={(e) => setLinkOpenNewTab(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="linkNewTabCheck" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                        નવી વિન્ડો / ટેબમાં ખોલો (Open in new window: target="_blank")
                      </label>
                    </div>

                    <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-2.5 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                      <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        કોઈપણ ન્યૂઝ આર્ટિકલ કે વેબસાઇટ લિંક માટે વાપરો. જો વિડીયો કે રીલ એમ્બેડ કરવી હોય તો ઉપર <strong>🎬 Embedded Link</strong> ટેબ પસંદ કરો.
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-300 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="rounded-xl border border-gray-300 bg-zinc-100 px-4 py-2 text-xs font-extrabold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModalSubmit()}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-blue-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        <span>Insert Link (લિંક ઉમેરો)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: EMBEDDED MEDIA (YouTube, Instagram, Facebook, Twitter, Iframe) */
                  <div className="space-y-3.5">
                    {/* Platform Selector Pills */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300">
                          PLATFORM / પ્લેટફોર્મ પસંદ કરો
                        </label>
                        {(() => {
                          const parsed = parseEmbedToHtml(embedInputVal, embedAspect, embedCaption);
                          if (!parsed) return null;
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-800 animate-in fade-in">
                              <Video className="h-3 w-3" />
                              <span>{parsed.platform} Detected</span>
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'all', label: '⚡ Auto-Detect', icon: '🌐' },
                          { id: 'youtube', label: 'YouTube', icon: '🔴' },
                          { id: 'instagram', label: 'Instagram', icon: '📸' },
                          { id: 'facebook', label: 'Facebook', icon: '🔵' },
                          { id: 'twitter', label: 'Twitter / X', icon: '𝕏' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedEmbedPlatform(p.id as any);
                              if (p.id === 'youtube' && !embedInputVal) setEmbedAspect('16/9');
                              if (p.id === 'instagram' && !embedInputVal) setEmbedAspect('1/1');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              selectedEmbedPlatform === p.id
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700'
                            }`}
                          >
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                        VIDEO URL OR &lt;IFRAME&gt; EMBED CODE (લિંક અથવા આઈફ્રેમ કોડ)
                      </label>
                      <textarea
                        value={embedInputVal}
                        onChange={(e) => setEmbedInputVal(e.target.value)}
                        rows={3}
                        placeholder={
                          selectedEmbedPlatform === 'youtube'
                            ? 'Paste YouTube URL (watch?v=...), Shorts (/shorts/...), or <iframe ...> embed code...'
                            : selectedEmbedPlatform === 'instagram'
                            ? 'Paste Instagram Reel (/reel/...), Post (/p/...), or embed code...'
                            : selectedEmbedPlatform === 'facebook'
                            ? 'Paste Facebook Video, Reel, Post link, or <iframe src="...plugins/post.php..."> code...'
                            : selectedEmbedPlatform === 'twitter'
                            ? 'Paste X / Twitter post URL (https://x.com/.../status/...) or embed code...'
                            : 'Paste YouTube, Instagram Reel/Post, Facebook, Twitter (X) link, or raw <iframe ...> embed code here...'
                        }
                        className="w-full rounded-xl border border-gray-400 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 placeholder:text-gray-400 focus:border-rose-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        autoFocus
                      />
                    </div>

                    {/* Aspect Ratio Selector */}
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                        ASPECT RATIO (સાઇઝ પ્રમાણ)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: '16/9', label: '16:9 Landscape', desc: 'YouTube / Video' },
                          { id: '9/16', label: '9:16 Vertical', desc: 'Shorts / Reels' },
                          { id: '1/1', label: '1:1 Square', desc: 'Insta / FB Post' },
                        ].map((asp) => (
                          <button
                            key={asp.id}
                            type="button"
                            onClick={() => setEmbedAspect(asp.id as any)}
                            className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                              embedAspect === asp.id
                                ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
                                : 'border-gray-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 hover:border-gray-400'
                            }`}
                          >
                            <p className="text-xs font-extrabold">{asp.label}</p>
                            <p className="text-[10px] opacity-75">{asp.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Caption / Source input */}
                    <div>
                      <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                        CAPTION / CREDIT (કેપ્શન અથવા ક્રેડિટ - વૈકલ્પિક)
                      </label>
                      <input
                        type="text"
                        value={embedCaption}
                        onChange={(e) => setEmbedCaption(e.target.value)}
                        placeholder="e.g. Source: Gujarat Post Special Ground Report"
                        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-900 placeholder:text-gray-400 focus:border-rose-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>

                    {/* Live Preview Box */}
                    {(() => {
                      const parsed = parseEmbedToHtml(embedInputVal, embedAspect, embedCaption);
                      if (!parsed) return null;
                      return (
                        <div className="p-3 rounded-2xl bg-zinc-900 text-white space-y-2 border border-zinc-700 shadow-inner">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                            <span className="flex items-center gap-1.5">
                              <Film className="h-3.5 w-3.5 text-rose-400" />
                              <span>Live Embed Preview</span>
                            </span>
                            <span className="bg-rose-600/80 text-white px-2 py-0.5 rounded-full text-[10px]">
                              {parsed.platform}
                            </span>
                          </div>
                          {parsed.previewSrc ? (
                            <div className="relative rounded-xl overflow-hidden bg-black/60 aspect-video max-h-40 flex items-center justify-center border border-zinc-700">
                              <iframe
                                src={parsed.previewSrc}
                                title="Embed Preview"
                                className="w-full h-full border-0 pointer-events-none"
                              />
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-zinc-800 text-[11px] font-mono text-zinc-300 truncate">
                              ✓ Ready to embed securely into story
                            </div>
                          )}
                          {embedCaption && (
                            <p className="text-[11px] text-zinc-400 italic text-center">{embedCaption}</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Supported Formats Guidance */}
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700 p-2.5 text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">✅ Supported Formats (લિંક અથવા એમ્બેડ કોડ):</p>
                      <p>• <strong>🔴 YouTube:</strong> Standard videos (<code className="text-rose-600 dark:text-rose-400">watch?v=...</code>), Shorts (<code className="text-rose-600 dark:text-rose-400">/shorts/...</code>) and Live</p>
                      <p>• <strong>📸 Instagram:</strong> Public Reels (<code className="text-rose-600 dark:text-rose-400">/reel/...</code>) and Posts (<code className="text-rose-600 dark:text-rose-400">/p/...</code>)</p>
                      <p>• <strong>🔵 Facebook:</strong> Posts, Videos, Reels, and Watch links (<code className="text-rose-600 dark:text-rose-400">facebook.com/...</code>)</p>
                      <p>• <strong>𝕏 Twitter / X:</strong> Tweets, status links, and threads (<code className="text-rose-600 dark:text-rose-400">x.com/.../status/...</code>)</p>
                      <p>• <strong>🌐 Custom Embed & Video:</strong> Full <code className="text-rose-600 dark:text-rose-400">&lt;iframe ...&gt;&lt;/iframe&gt;</code> code or direct <code className="text-rose-600 dark:text-rose-400">.mp4</code> URLs</p>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-300 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="rounded-xl border border-gray-300 bg-zinc-100 px-4 py-2 text-xs font-extrabold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!embedInputVal.trim()}
                        onClick={() => handleModalSubmit()}
                        className="rounded-xl bg-rose-600 disabled:opacity-50 px-5 py-2 text-xs font-extrabold text-white hover:bg-rose-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        <span>Insert Embed (એમ્બેડ કરો)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Input Form (Anchor only) */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider dark:text-zinc-300 mb-1.5">
                    Anchor Name (એન્કર નામ)
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
                    placeholder="e.g. section-1"
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

      {/* FLOATING ACTION TOOLBAR OVER SELECTED IMAGE IN EDITOR */}
      {selectedImgRect && selectedImgEl && (
        <div
          style={{
            top: Math.max(10, selectedImgRect.top - 46),
            left: Math.max(10, selectedImgRect.left),
          }}
          className="floating-img-toolbar fixed z-[999999] flex items-center gap-1.5 bg-zinc-900/95 dark:bg-black/95 text-white px-3 py-1.5 rounded-xl shadow-2xl border border-zinc-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 select-none"
        >
          <div className="flex items-center gap-1 text-xs text-zinc-300 pr-1.5 border-r border-zinc-700 max-w-[130px] truncate">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{selectedImgEl.alt || 'Story Image'}</span>
          </div>

          {/* Remove Image Button */}
          <button
            type="button"
            onClick={handleRemoveSelectedImg}
            className="flex items-center gap-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Delete this image from description"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove Image</span>
          </button>

          {/* Alignment presets */}
          <div className="flex items-center gap-0.5 border-l border-zinc-700 pl-1">
            <button
              type="button"
              onClick={() => handleAlignSelectedImg('left')}
              title="Float Left (Wrap Text)"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white cursor-pointer"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignSelectedImg('center')}
              title="Center Image"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white cursor-pointer"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignSelectedImg('right')}
              title="Float Right (Wrap Text)"
              className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white cursor-pointer"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => {
              setSelectedImgEl(null);
              setSelectedImgRect(null);
            }}
            className="p-1 text-zinc-400 hover:text-white ml-0.5 cursor-pointer"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
