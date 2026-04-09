/**
 * TipTap extensions that preserve arbitrary HTML styling during round-trips.
 *
 * Problem: when HTML created in "HTML mode" (with styled <div>, <p style="...">, etc.)
 * is loaded into TipTap, unknown elements/attributes are stripped — destroying the design.
 *
 * Solution:
 * - HtmlAttributePreserver: adds `style` and `class` preservation to all standard block nodes
 *   and to textStyle marks (for <span style="...">).
 * - DivBlock: generic <div> node that preserves structure and attributes.
 */

import { Extension, Node } from '@tiptap/core';

const MANAGED_BLOCK_PROPS = ['text-align'];
const MANAGED_INLINE_PROPS = ['color'];

function stripManagedProps(style: string | null, managed: string[]): string | null {
  if (!style) return null;
  const cleaned = style
    .split(';')
    .filter((rule) => {
      const prop = rule.split(':')[0]?.trim().toLowerCase();
      return prop && !managed.includes(prop);
    })
    .join('; ')
    .trim();
  return cleaned || null;
}

export const HtmlAttributePreserver = Extension.create({
  name: 'htmlAttributePreserver',

  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'blockquote',
          'bulletList',
          'orderedList',
          'listItem',
          'image',
          'horizontalRule',
          'codeBlock',
        ],
        attributes: {
          htmlStyle: {
            default: null,
            parseHTML: (el: HTMLElement) =>
              stripManagedProps(el.getAttribute('style'), MANAGED_BLOCK_PROPS),
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.htmlStyle) return {};
              return { style: attrs.htmlStyle as string };
            },
          },
          htmlClass: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.htmlClass) return {};
              return { class: attrs.htmlClass as string };
            },
          },
        },
      },
      {
        types: ['textStyle'],
        attributes: {
          preservedStyle: {
            default: null,
            parseHTML: (el: HTMLElement) =>
              stripManagedProps(el.getAttribute('style'), MANAGED_INLINE_PROPS),
            renderHTML: (attrs: Record<string, unknown>) => {
              if (!attrs.preservedStyle) return {};
              return { style: attrs.preservedStyle as string };
            },
          },
        },
      },
    ];
  },
});

export const DivBlock = Node.create({
  name: 'divBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('style') || null,
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
      class: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('class') || null,
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
      id: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('id') || null,
        renderHTML: (attrs) => (attrs.id ? { id: attrs.id } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div', priority: 40 }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
});
