'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { translateOnFly } from '@/lib/translate';

type Language = 'gu' | 'en' | 'hi';

const labels: Record<string, Record<Language, string>> = {
  'Company': { gu: 'કંપની', en: 'Company', hi: 'कंपनी' },
  'About Us': { gu: 'અમારા વિશે', en: 'About Us', hi: 'हमारे बारे में' },
  'Contact Us': { gu: 'સંપર્ક કરો', en: 'Contact Us', hi: 'संपर्क करें' },
  'Advertise With Us': { gu: 'અમારી સાથે જાહેરાત કરો', en: 'Advertise With Us', hi: 'हमारे साथ विज्ञापन दें' },
  'Privacy Policy': { gu: 'ગોપનીયતા નીતિ', en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
  'Cookie Policy': { gu: 'કૂકી નીતિ', en: 'Cookie Policy', hi: 'कुकी नीति' },
  'Cookie Settings': { gu: 'કૂકી સેટિંગ્સ', en: 'Cookie Settings', hi: 'कुकी सेटिंग्स' },
  'Terms Of Use': { gu: 'ઉપયોગની શરતો', en: 'Terms Of Use', hi: 'उपयोग की शर्तें' },
  'Terms of Use': { gu: 'ઉપયોગની શરતો', en: 'Terms of Use', hi: 'उपयोग की शर्तें' },
  'Disclaimer': { gu: 'અસ્વીકરણ', en: 'Disclaimer', hi: 'अस्वीकरण' },
  'Site Map': { gu: 'સાઇટ મેપ', en: 'Site Map', hi: 'साइट मैप' },
  'Complain Redressal': { gu: 'ફરિયાદ નિવારણ', en: 'Complaint Redressal', hi: 'शिकायत निवारण' },
  'Complaign Redressal': { gu: 'ફરિયાદ નિવારણ', en: 'Complaint Redressal', hi: 'शिकायत निवारण' },
  'Complaint Redressal': { gu: 'ફરિયાદ નિવારણ', en: 'Complaint Redressal', hi: 'शिकायत निवारण' },
  'Home': { gu: 'હોમ', en: 'Home', hi: 'होम' },
  'Back to Home': { gu: 'હોમ પર પાછા જાઓ', en: 'Back to Home', hi: 'होम पर वापस जाएँ' },
  'Open Cookie Settings': { gu: 'કૂકી સેટિંગ્સ ખોલો', en: 'Open Cookie Settings', hi: 'कुकी सेटिंग्स खोलें' },
  'Saved Articles': { gu: 'સાચવેલા સમાચાર', en: 'Saved News', hi: 'सहेजे गए समाचार' },
  'Saved News': { gu: 'સાચવેલા સમાચાર', en: 'Saved News', hi: 'सहेजे गए समाचार' },
};

function knownLabel(text: string, language: Language) {
  const entry = labels[text] || Object.values(labels).find((value) => Object.values(value).includes(text));
  return entry?.[language];
}

function needsTranslation(text: string, language: Language) {
  if (!/[a-zA-Z\u0900-\u097f\u0a80-\u0aff]/.test(text)) return false;
  // Preserve contact details and destinations exactly as configured by the editor.
  if (/^(?:https?:|mailto:|tel:|www\.)|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return false;
  if (language === 'en') return /[\u0900-\u097f\u0a80-\u0aff]/.test(text);
  if (language === 'hi') return !/[\u0900-\u097f]/.test(text) || /[\u0a80-\u0aff]/.test(text);
  return !/[\u0a80-\u0aff]/.test(text);
}

function useLocalizedText(text: string, language: Language) {
  const [result, setResult] = useState<{ text: string; language: Language; value: string } | null>(null);
  const known = knownLabel(text.trim(), language);
  const shouldTranslate = !known && needsTranslation(text, language);
  useEffect(() => {
    if (!shouldTranslate) return;
    let active = true;
    translateOnFly(text, language).then((value) => {
      if (active && value) setResult({ text, language, value });
    }).catch(() => { /* Keep the source text available when translation is offline. */ });
    return () => { active = false; };
  }, [text, language, shouldTranslate]);
  if (known) return text.replace(text.trim(), known);
  return result?.text === text && result.language === language ? result.value : text;
}

export function LocalizedText({ text }: { text: string }) {
  const { language } = useApp();
  return useLocalizedText(text, language);
}

/** Prefer editorial translations when the CMS supplies language-specific fields. */
export function useLocalizedPageData<T>(data: T): T {
  const { language } = useApp();
  return useMemo(() => {
    const suffix = { gu: 'Gu', en: 'En', hi: 'Hi' }[language];
    function visit(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(visit);
      if (!value || typeof value !== 'object') return value;
      const result: Record<string, unknown> = Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, visit(entry)]));
      for (const key of Object.keys(result)) {
        if (key.endsWith(suffix) && typeof result[key] === 'string' && (result[key] as string).trim()) {
          result[key.slice(0, -2)] = result[key];
        }
      }
      return result;
    }
    return visit(data) as T;
  }, [data, language]);
}

function LocalizedAttribute({ element, attributes }: {
  element: React.ReactElement<Record<string, unknown>>;
  attributes: string[];
}) {
  const { language } = useApp();
  const [attribute, ...remaining] = attributes;
  const text = element.props[attribute] as string;
  const value = useLocalizedText(text, language);
  const translated = React.cloneElement(element, { [attribute]: value });
  return remaining.length ? <LocalizedAttribute element={translated} attributes={remaining} /> : translated;
}

function localize(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') return node.trim() ? <LocalizedText text={node} /> : node;
  if (!React.isValidElement<Record<string, unknown>>(node)) return node;
  if (node.props.translate === 'no' || ['script', 'style', 'textarea'].includes(String(node.type))) return node;
  // Leave user-entered values, IDs, hrefs and submit payloads untouched.
  const element = React.cloneElement(node, {},
    node.props.children === undefined ? undefined : React.Children.map(node.props.children as React.ReactNode, localize));
  const attributes = ['placeholder', 'title', 'aria-label', 'alt', 'text'].filter(
    (attribute) => typeof node.props[attribute] === 'string' && (node.props[attribute] as string).trim());
  return attributes.length ? <LocalizedAttribute element={element} attributes={attributes} /> : element;
}

/** Localizes a page's React text and display attributes, preserving events and form data. */
export default function LocalizedContent({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  return enabled ? React.Children.map(children, localize) : children;
}
