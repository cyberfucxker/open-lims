import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Table as TableIcon,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

/** Shared styling for rendered CMS page content — used by the editor's own
 *  contentEditable area AND any static preview (`dangerouslySetInnerHTML`)
 *  elsewhere, so what an admin sees while editing matches what gets
 *  published. No `@tailwindcss/typography` plugin is installed in this
 *  project, so these are hand-rolled arbitrary-variant selectors (same
 *  convention the old PageEditorDialog preview used, extended with
 *  headings/lists/images/tables). */
export const RICH_TEXT_CONTENT_CLASSES = cn(
  "max-w-none text-sm leading-relaxed text-foreground",
  "[&_h1]:mt-2 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1:first-child]:mt-0",
  "[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2:first-child]:mt-0",
  "[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p:last-child]:mb-0",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:text-muted-foreground",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-sm [&_ol]:text-muted-foreground",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border",
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-border",
  "[&_th]:border [&_th]:border-border [&_th]:bg-secondary/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-foreground",
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-muted-foreground",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
);

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      className="h-8 gap-1.5 px-2.5"
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
}

function RichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder,
  className,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: cn(RICH_TEXT_CONTENT_CLASSES, "min-h-56 px-4 py-3 focus:outline-none"),
      },
    },
  });

  // Keep the editor in sync when the parent swaps `value` wholesale (e.g.
  // switching between pages) — Tiptap otherwise only reacts to in-editor edits.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  function handleLink() {
    const previousUrl = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter the link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (!url) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploading(false);
    }
  }

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-input", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-secondary/40 p-1.5">
        <ToolbarButton
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          icon={Heading1}
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon={Heading2}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon={Heading3}
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          icon={List}
          label="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          icon={LinkIcon}
          label="Link"
          active={editor.isActive("link")}
          onClick={handleLink}
        />
        <ToolbarButton
          icon={ImagePlus}
          label="Insert Image"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        />
        <ToolbarButton icon={TableIcon} label="Insert Table" onClick={insertTable} />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />
        {isUploading && <span className="ml-1 text-xs text-muted-foreground">Uploading…</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleImageSelected}
      />

      <EditorContent editor={editor} />
    </div>
  );
}

export { RichTextEditor };
